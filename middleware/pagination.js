module.exports = async(ctx, next) => {
    ctx.page = parseInt(ctx.request.query.page) || 1;
    ctx.limit = 20;
    ctx.offset = (ctx.page - 1) * ctx.limit;

    await next();

    const count = ctx.body.count || ctx.count;

    if (count) {
        const totalPages = Math.ceil(count / ctx.limit) || 1;

        if (ctx.page > totalPages) {
            ctx.throw(400, 'Incorrect page');
        }

        ctx.body = {
            limit: ctx.limit,
            page: ctx.page,
            totalPages,
            ...ctx.body
        };
    }
};
