const express = require('express');
const router = express.Router();
const GradingController = require('../controllers/gradingController');
const { verifyToken,restrictTo } = require('../middlewares/authMiddleware');

router.get('/pending', verifyToken, restrictTo('teacher'), GradingController.getPendingGradingList);
router.get('/graded', verifyToken, restrictTo('teacher'), GradingController.getGradedList);
router.post('/grade-essay', verifyToken, restrictTo('teacher'), GradingController.gradeEssay);
router.put('/finish/:attemptId', verifyToken, restrictTo('teacher'), GradingController.finishGrading);
router.get('/courses/:courseId/exams/:examId/gradebook', verifyToken, restrictTo('teacher'), GradingController.getClassGradebook);
router.get('/attempts/:attemptId', verifyToken, GradingController.getAttemptDetail);

module.exports = router;