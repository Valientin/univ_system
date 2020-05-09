const model = require('../models');
const helpers = require('../lib/helpers');

const list = async(ctx, next) => {
    const { name, groupId, teacherId } = ctx.query;
    const where = {};
    const groupWhere = {};

    if (name) {
        Object.assign(where, {
            name: {
                [model.Sequelize.Op.iLike]: `%${name}%`
            }
        });
    }

    if (teacherId && !['teacher'].includes(ctx.curUser.roleName)) {
        Object.assign(where, { teacherId });
    } else if (['teacher'].includes(ctx.curUser.roleName)) {
        Object.assign(where, { teacherId: ctx.curUser.teacher.id });
    }

    if (groupId) {
        Object.assign(groupWhere, { id: groupId });
    }

    const result = await model.Lesson.findAndCountAll({
        attributes: [
            'id', 'name', 'createdAt', 'updatedAt'
        ],
        where,
        include: {
            model: model.GroupLesson,
            as: 'groupLesson',
            include: {
                model: model.Group,
                as: 'group',
                where: groupWhere,
                required: !!(groupId)
            }
        },
        limit: ctx.limit,
        offset: ctx.offset
    });

    ctx.body = {
        lessons: result.rows
    };
    ctx.count = result.count;

    await next();
};

const getLessonData = async(ctx, next) => {
    ctx.body = await ctx.lesson.reload({
        include: [{
            model: model.LessonMaterial,
            as: 'lessonMaterials'
        }, {
            model: model.GroupLesson,
            as: 'groupLesson',
            include: {
                model: model.Group,
                as: 'group'
            }
        }]
    });

    await next();
};

const create = async(ctx, next) => {
    const { name, teacherId, semester } = ctx.request.body;

    if (!name || !semester || isNaN(parseInt(semester))) {
        ctx.throw(400);
    }

    await checkExistLesson(ctx, name, teacherId, semester);

    ctx.body = await model.Lesson.create({
        name,
        teacherId,
        semester: parseInt(semester)
    });

    ctx.status = 201;

    await next();
};

const update = async(ctx, next) => {
    const { name, teacherId, semester } = ctx.request.body;

    if (!name || !teacherId || isNaN(parseInt(semester))) {
        ctx.throw(400);
    }

    await checkExistLesson(ctx, name, teacherId, semester, ctx.lesson.id);

    await ctx.lesson.update({
        name,
        teacherId,
        semester: parseInt(semester)
    });

    ctx.body = ctx.lesson;
};

const remove = async(ctx, next) => {
    const groupLessonCount = await model.GroupLesson.count({
        where: {
            lessonId: ctx.lesson.id
        }
    });

    if (groupLessonCount > 0) {
        ctx.throw(409, 'lessonAlreayUsed');
    }

    await ctx.lesson.destroy();

    ctx.status = 204;

    await next();
};

const retrieve = async(ctx, next) => {
    const { lessonId } = ctx.params;

    if (!lessonId) {
        ctx.throw(404);
    }

    ctx.lesson = await model.Lesson.findOne({
        where: {
            id: lessonId
        }
    });

    if (!ctx.lesson) {
        ctx.throw(404);
    }

    await next();
};

const checkTeacher = async(ctx, next) => {
    const lesson = ctx.lesson || ctx.assessment.lesson;

    if (ctx.curUser.teacher.id != lesson.teacherId) {
        ctx.throw(403);
    }

    await next();
};

const setGroups = async(ctx, next) => {
    const { groupsIds } = ctx.request.body;

    if (!groupsIds || !Array.isArray(groupsIds)) {
        ctx.throw(400);
    }

    const groups = await model.Group.findAll({
        attributes: ['id', 'numberOfSemesters'],
        where: {
            id: {
                [model.Sequelize.Op.in]: groupsIds
            }
        },
        group: ['"Group.id"'],
        having: model.Sequelize.literal(`"numberOfSemesters" <= ${ctx.lesson.semester}`),
        logging: true
    });

    if (!groups.length) {
        ctx.throw(404, 'notFoundGroups');
    }

    await model.GroupLesson.destroy({
        where: {
            lessonId: ctx.lesson.id
        }
    });

    await model.GroupLesson.bulkCreate(groups.map(it => ({
        groupId: it.id,
        lessonId: ctx.lesson.id
    })));

    ctx.body = await ctx.lesson.reload({
        include: {
            model: model.GroupLesson,
            as: 'groupLesson',
            include: {
                model: model.Group,
                as: 'group'
            }
        }
    });

    await next();
};

const addMaterials = async(ctx, next) => {
    if (!ctx.files.length) {
        ctx.throw(400);
    }

    const t = await model.sequelize.transaction();

    try {
        await model.LessonMaterial.bulkCreate(ctx.files.map(it => ({
            file: it,
            lessonId: ctx.lesson.id
        })), { transaction: t });

        await t.commit();
    } catch (err) {
        await t.rollback();

        for (let file of ctx.files) {
            helpers.deleteFile(file.path);
        }

        ctx.throw(409);
    }

    ctx.body = { files: ctx.files };
    ctx.status = 201;

    await next();
};

const removeMaterial = async(ctx, next) => {
    const path = ctx.material.file.path;

    await ctx.material.destroy();
    await helpers.deleteFile(path);

    ctx.status = 204;
};

const retrieveMaterial = async(ctx, next) => {
    const { materialId } = ctx.params;

    if (!materialId) {
        ctx.throw(404);
    }

    ctx.material = await model.LessonMaterial.findOne({
        where: {
            id: materialId,
            lessonId: ctx.lesson.id
        }
    });

    if (!ctx.material) {
        ctx.throw(404);
    }

    await next();
};

const groupStudentsEvaluations = async(ctx, next) => {
    const existGroupLesson = await model.GroupLesson.count({
        where: {
            groupId: ctx.group.id,
            lessonId: ctx.lesson.id
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

    const allAssessments = await model.Assessment.findAll({
        attributes: ['id'],
        where: {
            lessonId: ctx.lesson.id
        },
        raw: true,
        order: [['order', 'DESC']]
    });

    const allStudentsAssessment = await model.StudentAssessment.findAll({
        attributes: ['assessmentId', 'studentId', 'evaluation'],
        raw: true,
        include: {
            attributes: [],
            model: model.Student,
            as: 'student',
            required: true,
            where: {
                groupId: ctx.group.id
            }
        }
    });

    const result = allStudents.map(({ dataValues: student }) => {
        const { firstName, lastName, middleName, email } = student.user;
        const res = {
            firstName, lastName, middleName, email,
            studentId: student.id,
            assessment: Object.assign({},
                ...allAssessments.map(assessment => {
                    const studentAssessment = allStudentsAssessment.find(it => {
                        return it.studentId == student.id && it.assessmentId == assessment.id;
                    });

                    return {
                        [assessment.id]: studentAssessment && studentAssessment.evaluation || 0
                    };
                })
            )
        };

        return res;
    });

    ctx.body = result;
};

async function checkExistLesson(ctx, name, teacherId, semester, id) {
    const alreadyExistLesson = await model.Lesson.findOne({
        where: Object.assign({
            name,
            teacherId,
            semester: parseInt(semester)
        }, id ? { id: { [model.Sequelize.Op.not]: id } } : {})
    });

    if (alreadyExistLesson) {
        ctx.throw(409, 'lessonAlreadyExist');
    }
}

module.exports = {
    list,
    remove,
    retrieve,
    create,
    update,
    setGroups,
    addMaterials,
    removeMaterial,
    checkTeacher,
    retrieveMaterial,
    getLessonData,
    groupStudentsEvaluations
};