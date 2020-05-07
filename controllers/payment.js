const LiqPay = require('../lib/liqpay');
const axios = require('axios');
const querystring = require('querystring');

const config = require('config');
const publicKey = config.get('LiqPay.publicKey');
const privateKey = config.get('LiqPay.privateKey');
const liqpayHost = config.get('LiqPay.liqpayHost');
const sandbox = config.get('LiqPay.sandbox');

const liqpay = new LiqPay(publicKey, privateKey);

const logger = require('../lib/logger');
const model = require('../models');

const rechargeBalance = async(ctx) => {
    const orderId = Math.floor(Math.random() * (Math.pow(10, 14) - Math.pow(10, 13))) + Math.pow(10, 13);
    const { id: studentId } = ctx.curUser.student;
    const { amount, type } = ctx.request.body;

    if (!amount || isNaN(parseFloat(amount))) {
        ctx.throw(400, 'invalidAmount');
    }

    if (parseFloat(amount) && parseFloat(amount) < 10) {
        ctx.throw(409, 'lessThanMinimum');
    }

    logger.debug(`Recharge balance body: '${JSON.stringify(ctx.request.body)}'`);

    const payment = await model.Payment.create({
        studentId,
        orderId,
        amount: parseFloat(amount),
        type: 'rechargeBalance'
    });

    logger.debug(`Create payment: '${payment.id}'`);

    const params = {
        'action': 'pay',
        'amount': payment.amount,
        'currency': payment.currency,
        'description': 'Recharge balance',
        'order_id': payment.orderId,
        'version': '3'
    };

    if (sandbox) {
        params['sandbox'] = '1';
    }

    await model.PaymentLog.create({
        paymentId: payment.id,
        orderId: payment.orderId,
        type: 'client-server',
        request: params
    });

    logger.debug(`Recharge balance params: '${JSON.stringify(params)}'`);

    if (type === 'json') {
        ctx.body = { liqpay: await cnbJson(params) };
    } else {
        ctx.body = { liqpay: await cnbLink(params) };
    }
};

const callback = async(ctx) => {
    const { data, signature } = ctx.request.body;

    logger.debug(`Callback body: '${JSON.stringify(ctx.request.body)}'`);

    const paymentLog = await model.PaymentLog.create({
        type: 'callback',
        request: ctx.request.body
    });

    const sign = liqpay.str_to_sign(privateKey + data + privateKey);

    if (sign !== signature) {
        logger.error('Incorrect signature');

        return ctx.body = null;
    }

    const params = JSON.parse(Buffer.from(data, 'base64').toString());

    await paymentLog.update({
        response: params
    });

    if (params.public_key !== publicKey) {
        logger.error('Incorrect public key');
        return ctx.body = null;
    }

    const payment = await model.Payment.findOne({
        where: {
            orderId: params.order_id
        },
        include: {
            model: model.Student,
            as: 'student',
            required: true
        }
    });

    if (!payment) {
        logger.error('Payment not found');
        return ctx.body = null;
    }

    const student = payment.student;

    const amount = parseFloat(payment.amount);
    const balance = parseFloat(student.balance);

    await paymentLog.update({
        paymentId: payment.id,
        orderId: payment.orderId
    });

    if (params.action !== 'pay' || parseFloat(params.amount) !== parseFloat(amount) || params.currency !== payment.currency) {
        logger.error('Incorrect parameters');

        return ctx.body = null;
    }

    if (params.status === payment.status) {
        return ctx.body = null;
    }

    if (sandbox && params.status === 'sandbox') {
        await payment.update({
            status: 'sandbox'
        });

        if (payment.type === 'rechargeBalance') {
            await student.update({
                balance: balance + amount
            });

            await model.BalanceHistory.create({
                studentId: student.id,
                paymentId: payment.id,
                change: amount,
                balance: student.balance
            });

            logger.debug('Recharge balance');
        }
    }

    ctx.status = 200;
};

async function cnbJson(params) {
    params = liqpay.cnb_params(params);
    const data = new Buffer.from(JSON.stringify(params)).toString('base64');
    const signature = liqpay.str_to_sign(privateKey + data + privateKey);

    return {
        url: liqpayHost + '3/checkout',
        params: {
            data,
            signature
        }
    };
}

async function cnbLink(params) {
    params = liqpay.cnb_params(params);
    const data = new Buffer.from(JSON.stringify(params)).toString('base64');
    const signature = liqpay.str_to_sign(privateKey + data + privateKey);

    return {
        url: liqpayHost + '3/checkout?data=' + data + '&signature=' + signature
    };
}

module.exports = {
    rechargeBalance,
    callback
};
