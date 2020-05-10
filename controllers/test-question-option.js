const model = require('../models');

const create = async(ctx, next) => {
    const { text, correctAnswer } = ctx.request.body;

    if (!text) {
        ctx.throw(400);
    }

    ctx.body = await model.TestQuestionOption.create({
        text,
        correctAnswer,
        testQuestionId: ctx.testQuestion.id
    });

    ctx.status = 201;

    await next();
};

const update = async(ctx, next) => {
    const { text, correctAnswer } = ctx.request.body;

    if (!text) {
        ctx.throw(400);
    }

    await ctx.testQuestionOption.update({
        text,
        correctAnswer
    });

    ctx.body = Object.reject(ctx.testQuestionOption.dataValues, ['testQuestion']);

    await next();
};

const remove = async(ctx, next) => {
    await ctx.testQuestionOption.destroy();

    ctx.status = 204;

    await next();
};

const retrieve = async(ctx, next) => {
    const { testQuestionOptionId } = ctx.params;

    if (!testQuestionOptionId) {
        ctx.throw(404);
    }

    ctx.testQuestionOption = await model.TestQuestionOption.findOne({
        where: {
            id: testQuestionOptionId
        },
        include: {
            model: model.TestQuestion,
            as: 'testQuestion',
            required: true,
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
        }
    });

    if (!ctx.testQuestionOption) {
        ctx.throw(404);
    }

    ctx.test = ctx.testQuestionOption.testQuestion.test;

    await next();
};

module.exports = {
    create,
    update,
    remove,
    retrieve
};
