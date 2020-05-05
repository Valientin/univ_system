const model = require('../models');

const list = async(ctx, next) => {
    const result = await model.Group.findAndCountAll({
        limit: ctx.limit,
        offset: ctx.offset
    });

    ctx.body = {
        groups: result.rows
    };
    ctx.count = result.count;

    await next();
};

const all = async(ctx, next) => {
    ctx.body = await model.Group.findAll({
        attributes: ['id', 'name']
    });

    await next();
};

const create = async(ctx, next) => {
    const { name, numberOfSemesters, cathedraId } = ctx.request.body;

    if (!name || !cathedraId || !numberOfSemesters) {
        ctx.throw(400);
    }

    await checkExistGroup(ctx, name);

    ctx.body = await model.Group.create({
        name,
        numberOfSemesters: parseInt(numberOfSemesters),
        cathedraId
    });

    ctx.status = 201;

    await next();
};

const update = async(ctx, next) => {
    const { name, numberOfSemesters, cathedraId } = ctx.request.body;

    if (!name || !cathedraId || !numberOfSemesters) {
        ctx.throw(400);
    }

    await checkExistGroup(ctx, name, ctx.group.id);

    await ctx.group.update({
        name,
        numberOfSemesters: parseInt(numberOfSemesters),
        cathedraId
    });

    ctx.body = ctx.group;
};

const remove = async(ctx, next) => {
    const studentCount = await model.Student.count({
        where: {
            groupId: ctx.group.id
        }
    });

    if (studentCount > 0) {
        ctx.throw(409, 'Has active students');
    }

    await ctx.group.destroy();

    ctx.status = 204;

    await next();
};

const retrieve = async(ctx, next) => {
    const { groupId } = ctx.params;

    if (!groupId) {
        ctx.throw(404);
    }

    ctx.group = await model.Group.findOne({
        where: {
            id: groupId
        }
    });

    if (!ctx.group) {
        ctx.throw(404);
    }

    await next();
};

async function checkExistGroup(ctx, name, id) {
    const alreadyExistGroup = await model.Group.findOne({
        where: Object.assign({
            name
        }, id ? { id: { [model.Sequelize.Op.not]: id } } : {})
    });

    if (alreadyExistGroup) {
        ctx.throw(409, 'Group with this name already exist');
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
