const model = require('../models');

const list = async(ctx, next) => {
    const { studentId } = ctx.query;
    const where = {};

    if (ctx.curUser.student || studentId) {
        Object.assign(where, {
            studentId: ctx.curUser.student.id || studentId
        });
    }

    const result = await model.BalanceHistory.findAndCountAll({
        where,
        include: {
            model: model.Payment,
            as: 'payment'
        },
        limit: ctx.limit,
        offset: ctx.offset
    });

    ctx.body = {
        changes: result.rows
    };
    ctx.count = result.count;

    await next();
};

module.exports = {
    list
};
