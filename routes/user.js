const Router = require('koa-router');
const router = new Router();

const multer = require('@koa/multer');
const upload = multer();

const { authorise, requireRole } = require('../middleware/authorize');
const User = require('../controllers/user');

router.get('/user/data', authorise, User.getData);

router.post('/user', authorise, requireRole(['admin']), User.create);
router.post('/user/session', User.login);

router.put('/user/data', authorise, upload.single('image'), User.update);
router.put('/user/:userId/data', authorise, requireRole(['admin']), User.retrieve, User.update);

router.delete('/user/session', authorise, User.logout);

module.exports = router.routes();
