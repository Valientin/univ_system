const koa = require('koa');
const cors = require('@koa/cors');
const body = require('koa-body');
const Router = require('koa-router');
const sugar = require('sugar');

sugar();

const app = new koa();

app.use(cors({ credentials: true }));
app.use(body());

const requestLogger = require('./middleware/request-logger');
const exceptionLogger = require('./middleware/exception-logger');

app.use(requestLogger);
app.use(exceptionLogger);

const router = new Router();

app
    .use(router.routes())
    .use(router.allowedMethods());

const userRoutes = require('./routes/user');

app.use(userRoutes);

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
