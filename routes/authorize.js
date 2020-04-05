const Router = require('koa-router');
const router = new Router();

router.get('/', (ctx, next) => {
    ctx.body = 'test';
});

module.exports = router.routes();
