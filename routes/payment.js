const Router = require('koa-router');
const router = new Router();

const { authorise, requireRole } = require('../middleware/authorize');
const pagination = require('../middleware/pagination');
const Payment = require('../controllers/payment');

router.get('/payment/history', authorise, requireRole(['admin']), pagination, Payment.history);
router.get('/payment/:paymentId/logs', authorise, requireRole(['admin']), Payment.logs);

router.post('/payment/recharge-balance', authorise, requireRole(['student']), Payment.rechargeBalance);
router.post('/payment/pay-tuition', authorise, requireRole(['student']), Payment.payTuition);

router.get(`/liqpay/callback`, Payment.callback);
router.post(`/liqpay/callback`, Payment.callback);

module.exports = router.routes();
