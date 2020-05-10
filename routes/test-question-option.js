const Router = require('koa-router');
const router = new Router();

const { authorise, requireRole } = require('../middleware/authorize');
const Test = require('../controllers/test');
const TestQuestion = require('../controllers/test-question');
const TestQuestionOption = require('../controllers/test-question-option');
const Lesson = require('../controllers/lesson');

router.post('/test-question-option/:testQuestionId', authorise, requireRole(['teacher']), TestQuestion.retrieve, Lesson.checkTeacher, Test.checkActiveTest, TestQuestionOption.create);

router.put('/test-question-option/:testQuestionOptionId', authorise, requireRole(['teacher']), TestQuestionOption.retrieve, Lesson.checkTeacher, Test.checkActiveTest, TestQuestionOption.update);

router.delete('/test-question-option/:testQuestionOptionId', authorise, requireRole(['teacher']), TestQuestionOption.retrieve, Lesson.checkTeacher, Test.checkActiveTest, TestQuestionOption.remove);

module.exports = router.routes();
