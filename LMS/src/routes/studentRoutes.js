const express = require('express');
const router = express.Router();
const StudentController = require('../controllers/studentController');
const { verifyToken,restrictTo } = require('../middlewares/authMiddleware');

// 1. API Học viên bấm Đăng ký khóa học
router.post('/enroll', verifyToken, restrictTo("student"), StudentController.enrollInCourse);

// 2. API Học viên tích chọn "Đã học xong bài này"
router.post('/complete-lesson', verifyToken, restrictTo("student"), StudentController.completeLesson);

// 3. API Lấy màn hình Dashboard của học viên (Xem danh sách khóa học đang theo học + % tiến độ cụ thể)
router.get('/dashboard', verifyToken, restrictTo("student"),StudentController.getMyDashboard);

router.get(
  "/completed-lessons/:courseId",
  verifyToken,
  restrictTo("student"),
  StudentController.getCompletedLessonIdsByCourse
);
module.exports = router;