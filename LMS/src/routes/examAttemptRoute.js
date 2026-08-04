const express = require('express');
const router = express.Router();
const ExamAttemptController = require('../controllers/examAttemptController');
const { verifyToken,restrictTo } = require('../middlewares/authMiddleware');

// API Bắt đầu làm bài
router.post('/:examId/start', verifyToken, restrictTo("student"), ExamAttemptController.startExam);
router.post('/submit', verifyToken, restrictTo("student"), ExamAttemptController.submitExam);
router.post('/check-answer', verifyToken, restrictTo("student"), ExamAttemptController.checkPracticeAnswer);
router.get('/result/:attemptId', verifyToken, ExamAttemptController.getExamResult);
router.get('/', verifyToken, ExamAttemptController.getAttempts);
router.post("/auto-save", verifyToken,restrictTo('student'), ExamAttemptController.autoSaveDraft);

module.exports = router;