const Router = require('koa-router');
const router = new Router();

const { authorise, requireRole } = require('../middleware/authorize');
const Test = require('../controllers/test');
const TestQuestion = require('../controllers/test-question');
const Lesson = require('../controllers/lesson');

router.post('/test-question/:testId', authorise, requireRole(['teacher']), Test.retrieve, Lesson.checkTeacher, Test.checkActiveTest, TestQuestion.create);

router.put('/test-question/:testQuestionId', authorise, requireRole(['teacher']), TestQuestion.retrieve, Lesson.checkTeacher, Test.checkActiveTest, TestQuestion.update);

router.delete('/test-question/:testQuestionId', authorise, requireRole(['teacher']), TestQuestion.retrieve, Lesson.checkTeacher, Test.checkActiveTest, TestQuestion.remove);

module.exports = router.routes();
