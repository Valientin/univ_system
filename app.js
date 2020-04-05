const koa = require('koa');
const cors = require('@koa/cors');
const body = require('koa-body');
const Router = require('koa-router');

const app = new koa();

app.use(cors({ credentials: true }));
app.use(body());

const router = new Router();

app
    .use(router.routes())
    .use(router.allowedMethods());

const authorizeRoute = require('./routes/authorize');

app.use(authorizeRoute);

if (!module.parent) {
    const model = require('./models');

    (async() => {
        await model.sequelize.authenticate();
        await model.sequelize.sync({ force: true });

        const port = process.env.PORT || 3001;

        app.listen(port);
    })(function(error) {
        if (error) {
            logger.error(error);
            throw error;
        }
    });
}
