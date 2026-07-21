const express = require('express');
const router = express.Router();
const ExamController = require('../controllers/ExamController');
const {verifyToken, restrictTo} = require('../middlewares/verifyToken'); // Đường dẫn tới middleware verifyToken

router.get('/teacher', verifyToken, ExamController.getTeacherExams);
router.get('/:id', verifyToken, ExamController.getExamDetail);
router.post('/', verifyToken, restrictTo('teacher'), ExamController.createExam);
router.post('/:id/questions', verifyToken, restrictTo('teacher'), ExamController.addQuestionsToExam);
router.put('/:id', verifyToken, restrictTo('teacher'), ExamController.updateExam);
router.post('/:id/copy', verifyToken, restrictTo('teacher'), ExamController.copyExam);
router.delete('/:id', verifyToken, restrictTo('teacher'), ExamController.deleteExam);

module.exports = router;