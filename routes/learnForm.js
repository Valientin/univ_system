const Router = require('koa-router');
const router = new Router();

const { authorise, requireRole } = require('../middleware/authorize');
const pagination = require('../middleware/pagination');
const LearnForm = require('../controllers/learnForm');

router.get('/learn-form/list', authorise, requireRole(['admin']), pagination, LearnForm.list);
router.get('/learn-form/all', authorise, LearnForm.all);

router.post('/learn-form', authorise, requireRole(['admin']), LearnForm.create);

router.put('/learn-form/:learnFormId', authorise, requireRole(['admin']), LearnForm.retrieve, LearnForm.update);

router.delete('/learn-form/:learnFormId', authorise, requireRole(['admin']), LearnForm.retrieve, LearnForm.remove);

module.exports = router.routes();
