const Router = require('koa-router');
const router = new Router();

const { authorise, requireRole } = require('../middleware/authorize');
const User = require('../controllers/user');

router.get('/user/data', authorise, User.getData);

router.post('/user', authorise, requireRole(['admin']), User.create);
router.post('/user/session', User.login);
router.delete('/user/session', authorise, User.logout);

module.exports = router.routes();
