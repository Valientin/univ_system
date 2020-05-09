const Router = require('koa-router');
const router = new Router();

const { authorise, requireRole } = require('../middleware/authorize');
const Lesson = require('../controllers/lesson');
const Assessment = require('../controllers/assessment');
const User = require('../controllers/user');

router.get('/assessment/:lessonId/list', authorise, requireRole(['teacher']), Lesson.retrieve, Lesson.checkTeacher, Assessment.list);

router.post('/assessment/:lessonId', authorise, requireRole(['teacher']), Lesson.retrieve, Lesson.checkTeacher, Assessment.create);
router.post('/assessment/:assessmentId/:studentId/set-evaluation', authorise, requireRole(['teacher']), Assessment.retrieve, Lesson.checkTeacher, User.retrieveStudent, Assessment.setEvaluation);

router.put('/assessment/:assessmentId', authorise, requireRole(['teacher']), Assessment.retrieve, Lesson.checkTeacher, Assessment.update);

router.delete('/assessment/:assessmentId', authorise, requireRole(['teacher']), Assessment.retrieve, Lesson.checkTeacher, Assessment.remove);

module.exports = router.routes();
