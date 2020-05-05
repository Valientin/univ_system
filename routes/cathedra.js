const Router = require('koa-router');
const router = new Router();

const { authorise, requireRole } = require('../middleware/authorize');
const pagination = require('../middleware/pagination');
const Cathedra = require('../controllers/cathedra');

router.get('/cathedra/list', authorise, requireRole(['admin']), pagination, Cathedra.list);
router.get('/cathedra/all', authorise, Cathedra.all);

router.post('/cathedra', authorise, requireRole(['admin']), Cathedra.create);

router.put('/cathedra/:cathedraId', authorise, requireRole(['admin']), Cathedra.retrieve, Cathedra.update);

router.delete('/cathedra/:cathedraId', authorise, requireRole(['admin']), Cathedra.retrieve, Cathedra.remove);

module.exports = router.routes();
