const model = require('../models');

const list = async(ctx, next) => {
    const result = await model.Assessment.findAll({
        where: {
            lessonId: ctx.lesson.id
        }
    });

    ctx.body = { assessments: result };

    await next();
};

const create = async(ctx, next) => {
    const { max, name, description, order } = ctx.request.body;

    if (!name || isNaN(parseInt(max)) || isNaN(parseInt(order))) {
        ctx.throw(400);
    }

    await checkExistAssessment(ctx, parseInt(order), ctx.lesson.id);

    ctx.body = await model.Assessment.create({
        max: parseInt(max),
        name,
        description,
        order: parseInt(order),
        lessonId: ctx.lesson.id
    });

    ctx.status = 201;

    await next();
};

const update = async(ctx, next) => {
    const { max, name, description, order } = ctx.request.body;

    if (!name || isNaN(parseInt(max)) || isNaN(parseInt(order))) {
        ctx.throw(400);
    }

    await checkExistAssessment(ctx, parseInt(order), ctx.assessment.lessonId, ctx.assessment.id);

    await ctx.assessment.update({
        max: parseInt(max),
        name,
        description,
        order: parseInt(order)
    });

    ctx.body = ctx.assessment;

    await next();
};

const remove = async(ctx, next) => {
    await model.StudentAssessment.destroy({
        where: {
            assessmentId: ctx.assessment.id
        }
    });

    await ctx.assessment.destroy();

    ctx.status = 204;

    await next();
};

const retrieve = async(ctx, next) => {
    const { assessmentId } = ctx.params;

    if (!assessmentId) {
        ctx.throw(404);
    }

    ctx.assessment = await model.Assessment.findOne({
        where: {
            id: assessmentId
        },
        include: {
            model: model.Lesson,
            as: 'lesson',
            required: true
        }
    });

    if (!ctx.assessment) {
        ctx.throw(404);
    }

    await next();
};

const setEvaluation = async(ctx, next) => {
    const existGroupLesson = await model.GroupLesson.count({
        where: {
            groupId: ctx.student.groupId,
            lessonId: ctx.assessment.lessonId
        }
    });

    if (!existGroupLesson) {
        ctx.throw(409, 'Student group does not have this lesson');
    }

    const { evaluation } = ctx.request.body;

    if (isNaN(parseInt(evaluation))) {
        ctx.throw(400);
    }

    if (parseInt(evaluation) > parseInt(ctx.assessment.max)) {
        ctx.throw(409, 'moreThanMaximum');
    }

    if (parseInt(evaluation) < 0) {
        ctx.throw(409, 'lessThanMinimum');
    }

    ctx.body = await model.StudentAssessment.upsert({
        assessmentId: ctx.assessment.id,
        studentId: ctx.student.id
    }, {
        assessmentId: ctx.assessment.id,
        studentId: ctx.student.id,
        evaluation
    });
    ctx.status = 201;

    await next();
};

async function checkExistAssessment(ctx, order, lessonId, id) {
    const alreadyExistAssessment = await model.Assessment.findOne({
        where: Object.assign({
            order,
            lessonId
        }, id ? { id: { [model.Sequelize.Op.not]: id } } : {})
    });

    if (alreadyExistAssessment) {
        ctx.throw(409, 'assessmentAlreadyExist');
    }
}

module.exports = {
    list,
    create,
    update,
    remove,
    retrieve,
    setEvaluation
};
