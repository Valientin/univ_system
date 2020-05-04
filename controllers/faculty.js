const model = require('../models');
const logger = require('../lib/logger');

const list = async(ctx, next) => {
    const result = await model.Faculty.findAndCountAll({
        limit: ctx.limit,
        offset: ctx.offset
    });

    ctx.body = {
        faculties: result.rows
    };
    ctx.count = result.count;

    await next();
};

const all = async(ctx, next) => {
    ctx.body = await model.Faculty.findAll({
        attributes: ['id', 'name']
    });

    await next();
};

const create = async(ctx, next) => {
    const { name, foundedDate, siteUrl, addittionalInfo } = ctx.request.body;

    if (!name) {
        ctx.throw(400);
    }

    await checkExistFaculty(ctx, name);

    ctx.body = await model.Faculty.create({
        name,
        foundedDate: foundedDate && new Date(foundedDate) || null,
        siteUrl: siteUrl || null,
        addittionalInfo: addittionalInfo || null
    });

    ctx.status = 201;

    await next();
};

const update = async(ctx, next) => {
    const { name, foundedDate, siteUrl, addittionalInfo } = ctx.request.body;

    if (!name) {
        ctx.throw(400);
    }

    await checkExistFaculty(ctx, name, ctx.faculty.id);

    await ctx.faculty.update({
        name,
        foundedDate: foundedDate && new Date(foundedDate) || null,
        siteUrl: siteUrl || null,
        addittionalInfo: addittionalInfo || null
    });

    ctx.body = ctx.faculty;
};

const remove = async(ctx, next) => {
    const cathedraCount = await model.Cathedra.count({
        where: {
            facultyId: ctx.faculty.id
        }
    });

    if (cathedraCount > 0) {
        ctx.throw(409, 'Has active cathedras');
    }

    await ctx.faculty.destroy();

    ctx.status = 204;

    await next();
};

const retrieve = async(ctx, next) => {
    const { facultyId } = ctx.params;

    if (!facultyId) {
        ctx.throw(404);
    }

    ctx.faculty = await model.Faculty.findOne({
        where: {
            id: facultyId
        }
    });

    if (!ctx.faculty) {
        ctx.throw(404);
    }

    await next();
};

async function checkExistFaculty(ctx, name, id) {
    const alreadyExistFaculty = await model.Faculty.findOne({
        where: Object.assign({
            name
        }, id ? { id: { [model.Sequelize.Op.not]: id } } : {})
    });

    if (alreadyExistFaculty) {
        ctx.throw(409, 'Faculty with this name already exist');
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
