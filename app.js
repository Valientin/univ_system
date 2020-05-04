const koa = require('koa');
const cors = require('@koa/cors');
const body = require('koa-body');
const Router = require('koa-router');
const sugar = require('sugar');
const mount = require('koa-mount');
const koaStatic = require('koa-static');

sugar();

const app = new koa();

app.use(cors({ credentials: true }));
app.use(body());
app.use(mount('/uploads', koaStatic('./uploads')));

const requestLogger = require('./middleware/request-logger');
const exceptionLogger = require('./middleware/exception-logger');

app.use(requestLogger);
app.use(exceptionLogger);

const router = new Router();

app
    .use(router.routes())
    .use(router.allowedMethods());

router.get('/', async(ctx, next) => {
    ctx.body = 'I welcome you. This is a closed api system of an educational institution.';

    await next();
});

const userRoutes = require('./routes/user');
const facultyRoutes = require('./routes/faculty');

app.use(userRoutes);
app.use(facultyRoutes);

if (!module.parent) {
    const model = require('./models');

    (async() => {
        await model.sequelize.authenticate();
        await model.sequelize.sync({ force: false });

        const port = process.env.PORT || 3000;

        app.listen(port);
    })(function(error) {
        if (error) {
            logger.error(error);
            throw error;
        }
    });
}
