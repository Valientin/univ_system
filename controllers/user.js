const model = require('../models');
const logger = require('../lib/logger');
const helpers = require('../lib/helpers');
const serializer = require('../serializers/user').main;

const list = async(ctx, next) => {
    const { roleName, groupId, learnFormId, cathedraId, facultyId } = ctx.query;
    const where = {};
    const studentWhere = {};
    const studentGroupWhere = {};
    const studentCathedraWhere = {};
    const teacherWhere = {};
    const teacherCathedraWhere = {};

    ['firstName', 'lastName', 'middleName', 'email', 'loginName'].forEach(it => {
        if (ctx.query[it]) {
            Object.assign(where, {
                [it]: {
                    [model.Sequelize.Op.iLike]: `%${ctx.query[it]}%`
                }
            });
        }
    });

    if (roleName) {
        Object.assign(where, { roleName });
    }

    if (groupId && roleName == 'student') {
        Object.assign(studentWhere, { groupId });
    }

    if (learnFormId && roleName == 'student') {
        Object.assign(studentWhere, { learnFormId });
    }

    if (cathedraId && roleName == 'student') {
        Object.assign(studentGroupWhere, { cathedraId });
    }

    if (facultyId && roleName == 'student') {
        Object.assign(studentCathedraWhere, { facultyId });
    }

    if (cathedraId && roleName == 'teacher') {
        Object.assign(teacherWhere, { cathedraId });
    }

    if (facultyId && roleName == 'teacher') {
        Object.assign(teacherCathedraWhere, { facultyId });
    }

    const studentRequired = Object.keys(studentWhere).length || Object.keys(studentGroupWhere).length
        || Object.keys(studentCathedraWhere).length;
    const teacherRequired = Object.keys(teacherWhere).length || Object.keys(teacherCathedraWhere).length;

    const result = await model.User.findAndCountAll({
        attributes: [
            'id', 'firstName', 'lastName', 'middleName', 'loginName',
            'email', 'roleName', 'birthday', 'createdAt', 'updatedAt'
        ],
        where,
        include: [{
            model: model.Student,
            as: 'student',
            where: studentWhere,
            required: studentRequired,
            include: [{
                model: model.Group,
                as: 'group',
                where: studentGroupWhere,
                required: studentRequired,
                include: {
                    model: model.Cathedra,
                    as: 'cathedra',
                    where: studentCathedraWhere,
                    required: studentRequired,
                    include: {
                        model: model.Faculty,
                        as: 'faculty',
                        required: studentRequired
                    }
                }
            }, {
                model: model.LearnForm,
                as: 'learnForm',
                required: studentRequired
            }]
        }, {
            model: model.Teacher,
            as: 'teacher',
            required: teacherRequired,
            where: teacherWhere,
            include: {
                model: model.Cathedra,
                as: 'cathedra',
                required: teacherRequired,
                where: teacherCathedraWhere,
                include: {
                    model: model.Faculty,
                    as: 'faculty',
                    required: teacherRequired
                }
            }
        }],
        limit: ctx.limit,
        offset: ctx.offset
    });

    ctx.body = {
        users: result.rows.map(it => serializer(it))
    };
    ctx.count = result.count;

    await next();
};

const getData = async(ctx, next) => {
    const user = await ctx.curUser.reload({
        include: [{
            model: model.Student,
            as: 'student',
            include: [{
                model: model.Group,
                as: 'group',
                include: {
                    model: model.Cathedra,
                    as: 'cathedra',
                    include: {
                        model: model.Faculty,
                        as: 'faculty'
                    }
                }
            }, {
                model: model.LearnForm,
                as: 'learnForm'
            }]
        }, {
            model: model.Teacher,
            as: 'teacher',
            include: {
                model: model.Cathedra,
                as: 'cathedra',
                include: {
                    model: model.Faculty,
                    as: 'faculty'
                }
            }
        }]
    });

    if (user.roleName == 'student') {
        let blocked = false;
        let needPaySum = 0;

        if (user.student.learnForm.needPay) {
            const payment = await model.Payment.findAll({
                attributes: [
                    [model.Sequelize.literal(`SUM("amount")`), 'sum']
                ],
                where: {
                    studentId: user.student.id,
                    type: 'tuitionFee',
                    status: 'success'
                }
            });

            const allSum = payment && payment[0] && parseInt(payment[0].getDataValue('sum')) || 0;

            if (allSum < parseInt(user.student.learnForm.price)) {
                blocked = true;
                needPaySum = parseInt(user.student.learnForm.price) - allSum;
            }
        }

        Object.assign(user.student.dataValues, {
            blocked, needPaySum
        });
    }

    ctx.body = user;
};

const create = async(ctx, next) => {
    const {
        firstName, lastName, middleName, loginName,
        email, roleName, birthday, groupId, cathedraId, learnFormId, password
    } = ctx.request.body;

    if (!firstName || !lastName || !middleName || !loginName || !email || !birthday || !password || password.length < 5) {
        ctx.throw(400);
    }

    if (!['admin', 'student', 'teacher'].includes(roleName)) {
        ctx.throw(400, 'Invalid role name');
    }

    if ((roleName == 'teacher' && !cathedraId) || (roleName == 'student' && (!learnFormId || !groupId))) {
        ctx.throw(400);
    }

    await checkExistUserByEmailOrLogin(ctx, email, loginName);

    const t = await model.sequelize.transaction();

    try {
        ctx.user = await model.User.create({
            firstName,
            lastName,
            middleName,
            loginName,
            email,
            roleName,
            birthday: new Date(birthday),
            status: 'offline'
        }, { transaction: t });

        await ctx.user.setPassword(password, t);

        if (roleName == 'teacher') {
            ctx.teacher = await model.Teacher.create({
                cathedraId,
                userId: ctx.user.id
            }, { transaction: t });
        } else if (roleName == 'student') {
            ctx.student = await model.Student.create({
                groupId,
                learnFormId,
                userId: ctx.user.id
            }, { transaction: t });
        }

        await t.commit();
    } catch (err) {
        logger.error(`CREATE USER ERROR: ${err.message}, ${err.stack}`);

        await t.rollback();

        ctx.throw(409);
    }

    ctx.body = ctx.user;
};

const update = async(ctx, next) => {
    const {
        firstName, lastName, middleName, loginName,
        email, birthday, groupId, cathedraId, learnFormId, password, oldPassword
    } = ctx.request.body;

    if (!ctx.user) {
        const t = await model.sequelize.transaction();
        const newImage = await helpers.sharpImage(ctx);

        try {
            const oldImage = ctx.curUser.photo;
            if (newImage) {
                await ctx.curUser.update({
                    photo: newImage
                }, { transaction: t });
            }

            if (password) {
                if (!(await ctx.curUser.hasPassword(oldPassword || ''))) {
                    ctx.throw(400, 'invalidPassword');
                }

                if (password.length < 5) {
                    ctx.throw(400, 'Less then minimum length of password');
                }

                await ctx.curUser.setPassword(password, t);
            }

            if (oldImage && oldImage.path) {
                helpers.deleteFile(oldImage.path);
            }

            await t.commit();
        } catch (err) {
            logger.error(`UPDATE USER ERROR: ${err.message}, ${err.stack}`);

            await t.rollback();

            if (newImage) {
                helpers.deleteFile(newImage.path);
            }

            ctx.status = err.status || 500;
            ctx.body = err.message;
            return;
        }

        return ctx.body = await ctx.curUser.reload();
    } else {
        if (!firstName || !lastName || !middleName || !loginName || !email || !birthday) {
            ctx.throw(400);
        }

        const { roleName } = ctx.user;

        if ((roleName == 'teacher' && !cathedraId) || (roleName == 'student' && (!learnFormId || !groupId))) {
            ctx.throw(400);
        }

        await checkExistUserByEmailOrLogin(ctx, email, loginName, ctx.user.id);

        const t = await model.sequelize.transaction();

        try {
            await ctx.user.update({
                firstName,
                lastName,
                middleName,
                loginName,
                email,
                birthday: new Date(birthday)
            }, { transaction: t });

            if (roleName == 'teacher') {
                ctx.teacher = await ctx.user.teacher.update({
                    cathedraId
                }, { transaction: t });
            } else if (roleName == 'student') {
                ctx.student = await ctx.user.student.update({
                    groupId
                }, { transaction: t });
            }

            await t.commit();
        } catch (err) {
            logger.error(`UPDATE USER ERROR: ${err.message}, ${err.stack}`);

            await t.rollback();

            ctx.throw(409);
        }

        ctx.body = await ctx.user.reload();
    }

    await next();
};

const retrieve = async(ctx, next) => {
    const { userId } = ctx.params;

    if (!userId) {
        ctx.throw(404);
    }

    ctx.user = await model.User.findOne({
        where: {
            id: userId
        },
        include: [{
            model: model.Student,
            as: 'student',
            include: {
                model: model.Group,
                as: 'group'
            }
        }, {
            model: model.Teacher,
            as: 'teacher',
            include: {
                model: model.Cathedra,
                as: 'cathedra'
            }
        }]
    });

    if (!ctx.user) {
        ctx.throw(404);
    }

    await next();
};

const login = async(ctx, next) => {
    const { loginName, email, password } = ctx.request.body;

    if ((!loginName && !email) || !password) {
        ctx.throw(400);
    }

    const user = await model.User.findOne({
        where: model.sequelize.or({
            loginName: loginName || null
        }, {
            email: email || null
        })
    });

    if (!user) {
        ctx.throw(404, 'userNotFound');
    }

    if (!(await user.hasPassword(password))) {
        ctx.throw(400, 'invalidPassword');
    }

    await model.Session.destroy({
        where: {
            userId: user.id
        }
    });

    const session = await model.Session.create({
        userId: user.id,
        expiredDate: new Date().addDays(1)
    });

    ctx.body = {
        token: session.token,
        user
    };
};

const logout = async(ctx, next) => {
    await ctx.curSession.destroy();
    await ctx.curUser.update({
        status: 'offline'
    });

    ctx.status = 204;
};

async function checkExistUserByEmailOrLogin(ctx, email, loginName, id = null) {
    const existUserByLogin = await model.User.findOne({
        where: Object.assign({
            loginName
        }, id ? { id: { [model.Sequelize.Op.not]: id } } : {})
    });

    if (existUserByLogin) {
        ctx.throw(409, 'existUserWithLogin');
    }

    const existUserByEmail = await model.User.findOne({
        where: Object.assign({
            email
        }, id ? { id: { [model.Sequelize.Op.not]: id } } : {})
    });

    if (existUserByEmail) {
        ctx.throw(409, 'existUserWithEmail');
    }
}

const remove = async(ctx, next) => {
    await ctx.user.destroy();

    ctx.status = 204;

    await next();
};

module.exports = {
    create,
    login,
    logout,
    getData,
    retrieve,
    update,
    remove,
    list
};
