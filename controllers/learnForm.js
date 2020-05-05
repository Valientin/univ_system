const model = require('../models');

const list = async(ctx, next) => {
    const result = await model.LearnForm.findAndCountAll({
        limit: ctx.limit,
        offset: ctx.offset
    });

    ctx.body = {
        learnForms: result.rows
    };
    ctx.count = result.count;

    await next();
};

const all = async(ctx, next) => {
    ctx.body = await model.LearnForm.findAll({
        attributes: ['id', 'name']
    });

    await next();
};

const create = async(ctx, next) => {
    const { name, needPay, price } = ctx.request.body;

    if (!name || !needPay || !price) {
        ctx.throw(400);
    }

    await checkExistLearnForm(ctx, name);

    ctx.body = await model.LearnForm.create({
        name,
        needPay,
        price: parseInt(price)
    });

    ctx.status = 201;

    await next();
};

const update = async(ctx, next) => {
    const { name, needPay, price } = ctx.request.body;

    if (!name || !needPay || !price) {
        ctx.throw(400);
    }

    await checkExistLearnForm(ctx, name, ctx.learnForm.id);

    await ctx.learnForm.update({
        name,
        needPay,
        price: parseInt(price)
    });

    ctx.body = ctx.learnForm;
};

const remove = async(ctx, next) => {
    const studentCount = await model.Student.count({
        where: {
            learnFormId: ctx.learnForm.id
        }
    });

    if (studentCount > 0) {
        ctx.throw(409, 'Has active students');
    }

    await ctx.learnForm.destroy();

    ctx.status = 204;

    await next();
};

const retrieve = async(ctx, next) => {
    const { learnFormId } = ctx.params;

    if (!learnFormId) {
        ctx.throw(404);
    }

    ctx.learnForm = await model.LearnForm.findOne({
        where: {
            id: learnFormId
        }
    });

    if (!ctx.learnForm) {
        ctx.throw(404);
    }

    await next();
};

async function checkExistLearnForm(ctx, name, id) {
    const alreadyExistLearnForm = await model.LearnForm.findOne({
        where: Object.assign({
            name
        }, id ? { id: { [model.Sequelize.Op.not]: id } } : {})
    });

    if (alreadyExistLearnForm) {
        ctx.throw(409, 'Learn form with this name already exist');
    }
}

module.exports = {
    list,
    all,
    create,
    update,
    remove,
    retrieve
};
