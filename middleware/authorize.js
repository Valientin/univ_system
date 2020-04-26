const model = require('../models');

exports.authorise = async function(ctx, next) {
    const token = ctx.header['x-auth-token'];

    if (!token) {
        ctx.throw(403);
    }

    ctx.curSession = await model.Session.findOne({
        where: {
            token
        },
        include: {
            model: model.User,
            as: 'user',
            include: [{
                model: model.Student,
                as: 'student'
            }, {
                model: model.Teacher,
                as: 'teacher'
            }]
        }
    });

    if (!ctx.curSession) {
        ctx.throw(403, 'Session not found');
    }

    if (new Date(ctx.curSession.expiredDate) < new Date()) {
        await ctx.curSession.destroy();

        ctx.throw(403, 'Expired token');
    }

    ctx.curUser = ctx.curSession.user;

    await ctx.curUser.update({ lastActiveTime: new Date(), status: 'online' });

    await next();
};

exports.requireRole = function requireRole(roles) {
    return async function(ctx, next) {
        if (!roles.includes(ctx.curUser.roleName)) {
            ctx.throw(403);
        }

        await next();
    };
};
