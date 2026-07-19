// routes/enrollment.route.js
const express = require('express');
const router = express.Router();
const EnrollmentController = require('../controllers/enrollmentController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Tất cả các route bên dưới đều cần user đăng nhập
router.use(verifyToken);

// 1. Đăng ký một khóa học mới
router.post('/', EnrollmentController.enrollCourse);

// 2. Lấy danh sách các khóa học đã đăng ký của học viên hiện tại
router.get('/my-courses', EnrollmentController.getEnrolledCourses);

// 3. Kiểm tra xem học viên đã đăng ký khóa học cụ thể này chưa
router.get('/status/:courseId', EnrollmentController.checkEnrollmentStatus);

router.delete(
  "/:courseId/unenroll",
  verifyToken,
  EnrollmentController.unenrollCourse
);
module.exports = router;