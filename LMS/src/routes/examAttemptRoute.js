const express = require('express');
const router = express.Router();
const ExamAttemptController = require('../controllers/ExamAttemptController');
const { verifyToken,restrictTo } = require('../middlewares/authMiddleware'); // Giả định middleware verifyToken của bạn

// API Bắt đầu làm bài
router.post('/start', verifyToken, restrictTo("student"), ExamAttemptController.startExam);
router.post('/submit', verifyToken, restrictTo("student"), ExamAttemptController.submitExam);
router.post('/check-answer', verifyToken, restrictTo("student"), ExamAttemptController.checkPracticeAnswer);
router.get('/result/:attemptId', verifyToken, ExamAttemptController.getExamResult);

module.exports = router;