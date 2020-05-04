const Router = require('koa-router');
const router = new Router();

const { authorise, requireRole } = require('../middleware/authorize');
const pagination = require('../middleware/pagination');
const Faculty = require('../controllers/faculty');

router.get('/faculty/list', authorise, requireRole(['admin']), pagination, Faculty.list);
router.get('/faculty/all', authorise, Faculty.all);

router.post('/faculty', authorise, requireRole(['admin']), Faculty.create);

router.put('/faculty/:facultyId', authorise, requireRole(['admin']), Faculty.retrieve, Faculty.update);

router.delete('/faculty/:facultyId', authorise, requireRole(['admin']), Faculty.retrieve, Faculty.remove);

module.exports = router.routes();
