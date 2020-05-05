const Router = require('koa-router');
const router = new Router();

const { authorise, requireRole } = require('../middleware/authorize');
const pagination = require('../middleware/pagination');
const Group = require('../controllers/group');

router.get('/group/list', authorise, requireRole(['admin']), pagination, Group.list);
router.get('/group/all', authorise, Group.all);

router.post('/group', authorise, requireRole(['admin']), Group.create);

router.put('/group/:groupId', authorise, requireRole(['admin']), Group.retrieve, Group.update);

router.delete('/group/:groupId', authorise, requireRole(['admin']), Group.retrieve, Group.remove);

module.exports = router.routes();
