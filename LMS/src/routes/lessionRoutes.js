const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const { verifyToken, checkTeacher } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');

// 1. Tạo mới bài học (Bắt buộc đăng nhập + phải là Giáo viên)
router.post('/', verifyToken, checkTeacher, upload.fields([
    {
        name: "video",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]), lessonController.createNewLesson);

// 2. Cập nhật thông tin bài học (Bắt buộc đăng nhập + phải là Giáo viên)
router.put('/:id', verifyToken, checkTeacher,upload.fields([
    {
        name: "video",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]), lessonController.updateLesson);

// 3. Xóa bài học (Bắt buộc đăng nhập + phải là Giáo viên)
router.delete('/:id', verifyToken, checkTeacher, lessonController.deleteLesson);

// --- CÁC ROUTE DƯỚI ĐÂY HỌC SINH CŨNG CÓ THỂ TRUY CẬP ---

// 4. Lấy toàn bộ bài học thuộc về 1 khóa học (Chỉ cần đăng nhập tài khoản bất kỳ)
router.get('/course/:courseId', verifyToken, lessonController.getLessonsByCourse);

// 5. Lấy chi tiết 1 bài học (Chỉ cần đăng nhập tài khoản bất kỳ)
router.get('/:id', verifyToken, lessonController.getLessonDetail);

module.exports = router;