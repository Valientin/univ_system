const model = require('../models');
const logger = require('../lib/logger');

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

    if (!firstName || !lastName || !middleName || !loginName || !email || !birthday || !password) {
        ctx.throw(400);
    }

    if (!['admin', 'student', 'teacher'].includes(roleName)) {
        ctx.throw(400, 'Invalid role name');
    }

    if ((roleName == 'teacher' && !cathedraId) || (roleName == 'student' && (!learnFormId || !groupId))) {
        ctx.throw(400);
    }

    const existUserByLogin = await model.User.findOne({
        where: {
            loginName
        }
    });

    if (existUserByLogin) {
        ctx.throw(409, 'Already exist user with this login');
    }

    const existUserByEmail = await model.User.findOne({
        where: {
            email
        }
    });

    if (existUserByEmail) {
        ctx.throw(409, 'Already exist user with this email');
    }

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

const login = async(ctx, next) => {
    const { loginName, email, password } = ctx.request.body;

    if ((!loginName && !email) || !password) {
        ctx.throw(400);
    }

    const user = await model.User.findOne({
        where: model.sequelize.or({
            loginName
        }, {
            email
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
        token: session.token
    };
};

const logout = async(ctx, next) => {
    await ctx.curSession.destroy();
    await ctx.curUser.update({
        status: 'offline'
    });

    ctx.status = 204;
};


module.exports = {
    create,
    login,
    logout,
    getData
};
