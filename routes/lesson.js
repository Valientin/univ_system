const Router = require('koa-router');
const router = new Router();

const { authorise, requireRole } = require('../middleware/authorize');
const pagination = require('../middleware/pagination');
const helpers = require('../lib/helpers');
const Lesson = require('../controllers/lesson');
const Group = require('../controllers/group');

const multer = require('@koa/multer');
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads');
    },
    filename: function(req, file, cb) {
        cb(null, helpers.generateFileName(file.originalname));
    }
});
const upload = multer({
    storage,
    limits: {
        fileSize: 3 * 1000 * 1000
    }
});

router.get('/lesson/list', authorise, requireRole(['admin', 'teacher', 'student']), pagination, Lesson.list);
router.get('/lesson/all', authorise, requireRole(['teacher']), Lesson.all);
router.get('/lesson/:lessonId/data', authorise, requireRole(['teacher', 'student']), Lesson.retrieve, Lesson.checkTeacher, Lesson.checkStudent, Lesson.getLessonData);
router.get('/lesson/:lessonId/:groupId/evaluations', authorise, requireRole(['teacher']), Lesson.retrieve, Lesson.checkTeacher, Group.retrieve, Lesson.groupStudentsEvaluations);
router.get('/lesson/:lessonId/evaluations', authorise, requireRole(['student']), Lesson.retrieve, Lesson.checkStudent, Lesson.studentEvaluations);

router.post('/lesson', authorise, requireRole(['admin']), Lesson.create);
router.post('/lesson/:lessonId/set-groups', authorise, requireRole(['admin']), Lesson.retrieve, Lesson.setGroups);
router.post('/lesson/:lessonId/materials', authorise, requireRole(['teacher']), Lesson.retrieve, Lesson.checkTeacher, upload.array('files', 5), Lesson.addMaterials);

router.put('/lesson/:lessonId', authorise, requireRole(['admin']), Lesson.retrieve, Lesson.update);

router.delete('/lesson/:lessonId', authorise, requireRole(['admin']), Lesson.retrieve, Lesson.remove);
router.delete('/lesson/:lessonId/:materialId', authorise, requireRole(['teacher']), Lesson.retrieve, Lesson.retrieveMaterial, Lesson.checkTeacher, Lesson.removeMaterial);

module.exports = router.routes();
