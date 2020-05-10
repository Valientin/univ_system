const model = require('../models');

const getTestData = async(ctx, next) => {
    if (ctx.curUser.roleName == 'teacher') {
        return ctx.body = await ctx.test.reload({
            include: [{
                model: model.TestQuestion,
                as: 'testQuestions',
                required: false,
                include: {
                    model: model.TestQuestionOption,
                    as: 'testQuestionOptions',
                    required: false
                }
            }]
        });
    }

    const result = await ctx.test.reload({
        include: [{
            model: model.TestResult,
            as: 'testResults',
            required: false,
            attributes: ['attempt', 'correctAnswers', 'questions'],
            where: {
                studentId: ctx.curUser.student.id
            }
        }]
    });

    ctx.body =  Object.reject(result.dataValues, ['lesson']);
};

const startTestAttempt = async(ctx, next) => {
    if (!ctx.test.active) {
        ctx.throw(409, 'testIsNotActive');
    }

    const countAttempts = await model.TestResult.count({
        where: {
            studentId: ctx.curUser.student.id,
            testId: ctx.test.id
        }
    });

    if (countAttempts >= ctx.test.maxAttempts) {
        ctx.throw(409, 'noMoreAttempts');
    }

    const attempt = await model.TestResult.create({
        studentId: ctx.curUser.student.id,
        testId: ctx.test.id,
        status: 'started',
        attempt: countAttempts + 1,
        questions: ctx.test.questions,
        correctAnswers: 0
    });

    const questions = await model.TestQuestion.findAll({
        where: {
            testId: ctx.test.id
        },
        include: {
            attributes: ['text', 'id'],
            model: model.TestQuestionOption,
            as: 'testQuestionOptions',
            order: model.Sequelize.literal('random()')
        },
        order: model.Sequelize.literal('random()'),
        limit: ctx.test.questions
    });

    await attempt.update({
        questionsIds: questions.map('id')
    });

    ctx.body = {
        attemptId: attempt.id,
        questions
    };
};

const finishTestAttempt = async(ctx, next) => {
    const { result } = ctx.request.body;

    if (!result || typeof result !== 'object' || Array.isArray(result)) {
        ctx.throw(400);
    }

    const questions = await model.TestQuestion.findAll({
        attributes: ['id', 'type'],
        where: model.Sequelize.and({
            id: { [model.Sequelize.Op.in]: Object.keys(result) }
        }, {
            id: { [model.Sequelize.Op.in]: ctx.testResult.questionsIds }
        }),
        include: {
            model: model.TestQuestionOption,
            as: 'testQuestionOptions',
            required: true,
            attributes: ['id'],
            where: {
                correctAnswer: true
            }
        }
    });

    let countCorrectAnswers = 0;

    ctx.testResult.questionsIds.forEach(questionId => {
        const question = questions.find(it => it.id == parseInt(questionId));

        if (question && question.type == 'single') {
            const correctIds = question.testQuestionOptions.map('id');
            const correctAnswer = correctIds.includes(parseInt(result[questionId]));

            if (correctAnswer) {
                countCorrectAnswers++;
            }
        } else if (question && question.type == 'multiple') {
            const correctIds = question.testQuestionOptions.map('id');

            if (Array.isArray(result[questionId])) {
                const correctAnswer = correctIds.every(it => result[questionId].includes(it));

                if (correctAnswer) {
                    countCorrectAnswers++;
                }
            }
        }
    });

    await ctx.testResult.update({
        status: 'finish',
        correctAnswers: countCorrectAnswers
    });

    ctx.body = {
        correctAnswers: countCorrectAnswers
    };
};

const getGroupResults = async(ctx, next) => {
    const existGroupLesson = await model.GroupLesson.count({
        where: {
            groupId: ctx.group.id,
            lessonId: ctx.test.lesson.id
        }
    });

    if (!existGroupLesson) {
        ctx.throw(409, 'Group does not have this lesson');
    }

    const allStudents = await model.Student.findAll({
        where: {
            groupId: ctx.group.id
        },
        include: {
            attributes: ['firstName', 'lastName', 'middleName', 'email'],
            model: model.User,
            as: 'user',
            required: true
        }
    });

    const studentResults = await model.TestResult.findAll({
        raw: true,
        attributes: [
            'studentId',
            [model.Sequelize.fn('max', model.Sequelize.col('correctAnswers')), 'max'],
            [model.Sequelize.fn('count', model.Sequelize.col('id')), 'attempts']
        ],
        where: {
            studentId: {
                [model.Sequelize.Op.in]: allStudents.map('id')
            }
        },
        group: ['studentId']
    });

    const result = allStudents.map(({ dataValues: student }) => {
        const { firstName, lastName, middleName, email } = student.user;
        const res = {
            firstName, lastName, middleName, email,
            studentId: student.id
        };

        const results = studentResults.find(it => it.studentId == student.id);

        return Object.assign(res, {
            maxResult: results && parseInt(results.max) || 0,
            attempts: results && parseInt(results.attempts) || 0
        });
    });

    ctx.body = result;
};

const retrieveTestAttempt = async(ctx, next) => {
    const { testAttemptId } = ctx.params;

    if (!testAttemptId) {
        ctx.throw(404);
    }

    ctx.testResult = await model.TestResult.findOne({
        where: {
            id: testAttemptId,
            status: 'started'
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

    if (!ctx.testResult) {
        ctx.throw(404);
    }

    ctx.lesson = ctx.testResult.test.lesson;

    await next();
};

const create = async(ctx, next) => {
    const { name, description, maxAttempts, questions } = ctx.request.body;

    if (!name || isNaN(parseInt(maxAttempts)) || isNaN(parseInt(questions))) {
        ctx.throw(400);
    }

    ctx.body = await model.Test.create({
        name,
        description,
        maxAttempts: parseInt(maxAttempts),
        questions: parseInt(questions),
        active: false,
        lessonId: ctx.lesson.id
    });

    ctx.status = 201;

    await next();
};

const update = async(ctx, next) => {
    const { name, description, maxAttempts, questions } = ctx.request.body;

    if (!name || isNaN(parseInt(maxAttempts)) || isNaN(parseInt(questions))) {
        ctx.throw(400);
    }

    await ctx.test.update({
        name,
        description,
        maxAttempts: parseInt(maxAttempts),
        questions: parseInt(questions),
        active: false
    });

    ctx.body = Object.reject(ctx.test.dataValues, ['lesson']);

    await next();
};

const remove = async(ctx, next) => {
    await ctx.test.destroy();

    ctx.status = 204;

    await next();
};

const retrieve = async(ctx, next) => {
    const { testId } = ctx.params;

    if (!testId) {
        ctx.throw(404);
    }

    ctx.test = await model.Test.findOne({
        where: {
            id: testId
        },
        include: {
            model: model.Lesson,
            as: 'lesson',
            required: true
        }
    });

    if (!ctx.test) {
        ctx.throw(404);
    }

    await next();
};

const checkActiveTest = async(ctx, next) => {
    if (ctx.test.active) {
        ctx.throw(409, 'testIsActive');
    }

    await next();
};

const changeActive = async(ctx, next) => {
    if (ctx.test.active) {
        await ctx.test.update({
            active: false
        });

        return ctx.body = Object.reject(ctx.test.dataValues, ['lesson']);
    }

    const questions = await model.TestQuestion.findAll({
        raw: true,
        attributes: [
            'id',
            [model.Sequelize.literal(`
                (SELECT COUNT(*) FROM "TestQuestionOptions" WHERE "testQuestionId" = "TestQuestion"."id")`
            ), 'options']
        ]
    });

    let fullQuestionCount = 0;

    questions.forEach(it => {
        if (parseInt(it.options) >= 2) {
            fullQuestionCount++;
        }
    });

    if (fullQuestionCount < ctx.test.questions) {
        ctx.throw(409, 'Count of questions less than minimum');
    }

    await ctx.test.update({
        active: true
    });

    ctx.body = Object.reject(ctx.test.dataValues, ['lesson']);

    await next();
};

module.exports = {
    create,
    update,
    remove,
    retrieve,
    getTestData,
    checkActiveTest,
    changeActive,
    startTestAttempt,
    retrieveTestAttempt,
    finishTestAttempt,
    getGroupResults
};
