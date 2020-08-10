const Router = require('koa-router');
const router = new Router();

const { authorise, requireRole } = require('../middleware/authorize');
const Test = require('../controllers/test');
const Lesson = require('../controllers/lesson');
const Group = require('../controllers/group');

router.get('/test/:testId/data', authorise, requireRole(['teacher', 'student']), Test.retrieve, Lesson.checkTeacher, Lesson.checkStudent, Test.getTestData);
router.get('/test/:testId/data/:groupId', authorise, requireRole(['teacher']), Test.retrieve, Lesson.checkTeacher, Group.retrieve, Test.getGroupResults);

router.post('/test/:lessonId', authorise, requireRole(['teacher']), Lesson.retrieve, Lesson.checkTeacher, Test.create);
router.post('/test/:testId/start', authorise, requireRole(['student']), Test.retrieve, Lesson.checkStudent, Test.startTestAttempt);
router.post('/test/:testAttemptId/finish', authorise, requireRole(['student']), Test.retrieveTestAttempt, Lesson.checkStudent, Test.finishTestAttempt);

router.put('/test/:testId', authorise, requireRole(['teacher']), Test.retrieve, Lesson.checkTeacher, Test.checkActiveTest, Test.update);
router.put('/test/:testId/change-active', authorise, requireRole(['teacher']), Test.retrieve, Lesson.checkTeacher, Test.changeActive);

router.delete('/test/:testId', authorise, requireRole(['teacher']), Test.retrieve, Lesson.checkTeacher, Test.checkActiveTest, Test.remove);

router.post('callback/liqpay', (ctx, next) => {
    logger.log('info', ctx.body);
})

module.exports = router.routes();
