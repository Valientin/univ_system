const logger = require('../lib/logger');

module.exports = async function(ctx, next) {
    try {
        await next();
    } catch (e) {
        logger.error(`EXCEPTION ERROR (${new Date()}): message - ${e.message}, stack - ${e.stack}`);
        ctx.status = e.status || 500;
        ctx.body = e.message;
    }
};
