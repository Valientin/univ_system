const model = require('../models');

const create = async(ctx, next) => {
    const { question, type } = ctx.request.body;

    if (!question || !['single', 'multiple'].includes(type)) {
        ctx.throw(400);
    }

    ctx.body = await model.TestQuestion.create({
        question,
        type,
        testId: ctx.test.id
    });

    ctx.status = 201;

    await next();
};

const update = async(ctx, next) => {
    const { question, type } = ctx.request.body;

    if (!question || !['single', 'multiple'].includes(type)) {
        ctx.throw(400);
    }

    await ctx.testQuestion.update({
        question,
        type
    });

    ctx.body = Object.reject(ctx.testQuestion.dataValues, ['test']);

    await next();
};

const remove = async(ctx, next) => {
    await model.TestQuestionOption.destroy({
        where: {
            testQuestionId: ctx.testQuestion.id
        }
    });
    await ctx.testQuestion.destroy();

    ctx.status = 204;

    await next();
};

const retrieve = async(ctx, next) => {
    const { testQuestionId } = ctx.params;

    if (!testQuestionId) {
        ctx.throw(404);
    }

    ctx.testQuestion = await model.TestQuestion.findOne({
        where: {
            id: testQuestionId
        },
        include: {
            model: model.Test,
            as: 'test',
            required: true,
            include: {
                model: model.Lesson,
                as: 'lesson',
                required: true
            }
        }
    });

    if (!ctx.testQuestion) {
        ctx.throw(404);
    }

    ctx.test = ctx.testQuestion.test;

    await next();
};

module.exports = {
    create,
    update,
    remove,
    retrieve
};
