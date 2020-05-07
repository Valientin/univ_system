const model = require('../models');

const list = async(ctx, next) => {
    const { name, facultyId } = ctx.query;
    const where = {};

    if (name) {
        Object.assign(where, {
            name: {
                [model.Sequelize.Op.iLike]: `%${name}%`
            }
        });
    }

    if (facultyId) {
        Object.assign(where, { facultyId });
    }

    const result = await model.Cathedra.findAndCountAll({
        attributes: [
            'id', 'name', 'foundedDate', 'siteUrl', 'addittionalInfo', 'facultyId',
            [model.Sequelize.literal(`(SELECT COUNT(*) FROM "Groups" WHERE "cathedraId" = "Cathedra"."id")`), 'groups']
        ],
        where,
        include: {
            model: model.Faculty,
            attributes: ['name'],
            as: 'faculty'
        },
        limit: ctx.limit,
        offset: ctx.offset
    });

    ctx.body = {
        cathedras: result.rows
    };
    ctx.count = result.count;

    await next();
};

const all = async(ctx, next) => {
    ctx.body = await model.Cathedra.findAll({
        attributes: ['id', 'name']
    });

    await next();
};

const create = async(ctx, next) => {
    const { name, foundedDate, siteUrl, addittionalInfo, facultyId } = ctx.request.body;

    if (!name || !facultyId) {
        ctx.throw(400);
    }

    await checkExistCathedra(ctx, name);

    ctx.body = await model.Cathedra.create({
        name,
        foundedDate: foundedDate && new Date(foundedDate) || null,
        siteUrl: siteUrl || null,
        addittionalInfo: addittionalInfo || null,
        facultyId
    });

    ctx.status = 201;

    await next();
};

const update = async(ctx, next) => {
    const { name, foundedDate, siteUrl, addittionalInfo, facultyId } = ctx.request.body;

    if (!name || !facultyId) {
        ctx.throw(400);
    }

    await checkExistCathedra(ctx, name, ctx.cathedra.id);

    await ctx.cathedra.update({
        name,
        foundedDate: foundedDate && new Date(foundedDate) || null,
        siteUrl: siteUrl || null,
        addittionalInfo: addittionalInfo || null,
        facultyId
    });

    ctx.body = ctx.cathedra;
};

const remove = async(ctx, next) => {
    const groupCount = await model.Group.count({
        where: {
            cathedraId: ctx.cathedra.id
        }
    });

    if (groupCount > 0) {
        ctx.throw(409, 'hasActiveGroups');
    }

    await ctx.cathedra.destroy();

    ctx.status = 204;

    await next();
};

const retrieve = async(ctx, next) => {
    const { cathedraId } = ctx.params;

    if (!cathedraId) {
        ctx.throw(404);
    }

    ctx.cathedra = await model.Cathedra.findOne({
        where: {
            id: cathedraId
        }
    });

    if (!ctx.cathedra) {
        ctx.throw(404);
    }

    await next();
};

async function checkExistCathedra(ctx, name, id) {
    const alreadyExistCathedra = await model.Cathedra.findOne({
        where: Object.assign({
            name
        }, id ? { id: { [model.Sequelize.Op.not]: id } } : {})
    });

    if (alreadyExistCathedra) {
        ctx.throw(409, 'cathedraAlreadyExist');
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
