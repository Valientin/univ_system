const Router = require('koa-router');
const router = new Router();

const { authorise, requireRole } = require('../middleware/authorize');
const pagination = require('../middleware/pagination');
const BalanceHistory = require('../controllers/balance-history');

router.get('/balance-history', authorise, requireRole(['admin', 'student']), pagination, BalanceHistory.list);

module.exports = router.routes();
