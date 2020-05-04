const model = require('../models');
const logger = require('../lib/logger');
const helpers = require('../lib/helpers');

const getData = async(ctx, next) => {
    ctx.body = await ctx.curUser.reload({
        include: [{
            model: model.Student,
            as: 'student',
            include: {
                model: model.Group,
                as: 'group',
                include: {
                    model: model.Cathedra,
                    as: 'cathedra',
                    inlcude: {
                        model: model.Faculty,
                        as: 'faculty'
                    }
                }
            }
        }, {
            model: model.Teacher,
            as: 'teacher',
            include: {
                model: model.Cathedra,
                as: 'cathedra',
                inlcude: {
                    model: model.Faculty,
                    as: 'faculty'
                }
            }
        }]
    });
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
                cathedraId
            }, { transaction: t });
        } else if (roleName == 'student') {
            ctx.student = await model.Student.create({
                groupId
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
        email, birthday, groupId, cathedraId, learnFormId, password
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
                if (password.length < 5) {
                    ctx.throw(400, 'Less then minimum length of password');
                }

                await ctx.curUser.setPassword(password, t);
            }

            if (oldImage && oldImage.path) {
                helpers.deleteImage(oldImage.path);
            }

            await t.commit();
        } catch (err) {
            logger.error(`UPDATE USER ERROR: ${err.message}, ${err.stack}`);

            await t.rollback();

            if (newImage) {
                helpers.deleteImage(newImage.path);
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
        ctx.throw(404, 'User not found');
    }

    if (!(await user.hasPassword(password))) {
        ctx.throw(400, 'Invalid password');
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
        ctx.throw(409, 'Already exist user with this login');
    }

    const existUserByEmail = await model.User.findOne({
        where: Object.assign({
            email
        }, id ? { id: { [model.Sequelize.Op.not]: id } } : {})
    });

    if (existUserByEmail) {
        ctx.throw(409, 'Already exist user with this email');
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
    remove
};
