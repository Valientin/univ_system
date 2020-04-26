const logger = require('../lib/logger');

let requestNumber = 0;

module.exports = async function(ctx, next) {
    const level = isStatic(ctx.path) ? 'silly' : 'info';

    ctx.requestNumber = ++requestNumber;

    logger.log(level, `${ctx.requestNumber}: [${ctx.method}] ${ctx.path}`);

    const startTime = new Date().getTime();
    await next();
    const time = new Date().getTime() - startTime;

    logger.log(level, `${ctx.requestNumber}: Finished with status ${ctx.response.status} in ${time} ms`);
};

function isStatic(path) {
    return ['/images'].some(e => path.startsWith(e));
}
