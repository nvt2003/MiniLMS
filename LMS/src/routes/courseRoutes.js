const express = require('express');
const router = express.Router();
const CourseController = require('../controllers/courseController');
const { verifyToken, restrictTo } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');

// 1. Xem danh sách khóa học công khai (Không cần đăng nhập)
router.get('/', CourseController.getCourses);

// 2. Xem chi tiết khóa học và danh sách bài học (Không cần đăng nhập hoặc tùy bạn chặn nếu muốn)
router.get('/:id', CourseController.getCourseDetail);

// 3. Tạo khóa học mới (Bắt buộc Đăng nhập + Phải có quyền Teacher hoặc Admin)
router.post('/', verifyToken, restrictTo('teacher', 'admin'),upload.single("thumbnail"), CourseController.createNewCourse);
//sửa
router.put('/:id', verifyToken, restrictTo('teacher', 'admin'),upload.single("thumbnail"), CourseController.updateCourse);

// 4. Xóa khóa học (Bắt buộc Đăng nhập + Phải có quyền Teacher hoặc Admin)
router.delete('/:id', verifyToken, restrictTo('teacher', 'admin'), CourseController.deleteCourse);

module.exports = router;