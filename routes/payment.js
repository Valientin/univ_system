const Router = require('koa-router');
const router = new Router();

const { authorise, requireRole } = require('../middleware/authorize');
// const pagination = require('../middleware/pagination');
const Payment = require('../controllers/payment');

router.get(`/liqpay/callback`, Payment.callback);
router.post(`/liqpay/callback`, Payment.callback);

router.post('/payment/recharge-balance', authorise, requireRole(['student']), Payment.rechargeBalance);

module.exports = router.routes();
