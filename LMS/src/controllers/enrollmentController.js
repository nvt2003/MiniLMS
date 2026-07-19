// controllers/enrollment.controller.js
const EnrollmentModel = require('../models/enrollmentModel');

const EnrollmentController = {
  // [POST] /api/enrollments
  enrollCourse: async (req, res) => {
    try {
      const studentId = req.user.id; // Lấy từ middleware xác thực (auth middleware)
      const { courseId } = req.body;

      if (!courseId) {
        return res.status(400).json({ message: 'Vui lòng cung cấp courseId' });
      }

      // 1. Kiểm tra xem học viên đã đăng ký khóa học này chưa
      const isEnrolled = await EnrollmentModel.checkStatus(studentId, courseId);
      if (isEnrolled) {
        return res.status(400).json({ message: 'Bạn đã đăng ký khóa học này rồi' });
      }

      // 2. Tiến hành đăng ký
      const enrollmentId = await EnrollmentModel.enroll(studentId, courseId);
      
      return res.status(201).json({
        message: 'Đăng ký khóa học thành công',
        data: { enrollmentId, studentId, courseId }
      });

    } catch (error) {
      console.error('Error in enrollCourse:', error);
      // Xử lý lỗi trùng lặp (nếu có lỗi chạy đồng thời bypass qua checkStatus)
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Bạn đã đăng ký khóa học này rồi' });
      }
      return res.status(500).json({ message: 'Lỗi hệ thống khi đăng ký khóa học' });
    }
  },
  unenrollCourse:async (req, res) => {
    try {
      const studentId = req.user.id;
      const { courseId } = req.params;

      const result = await EnrollmentModel.unenrollCourse(studentId, courseId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi hủy khóa học.",
      });
    }
  },
  // [GET] /api/enrollments/status/:courseId
  checkEnrollmentStatus: async (req, res) => {
    try {
      const studentId = req.user.id;
      const { courseId } = req.params;

      const isEnrolled = await EnrollmentModel.checkStatus(studentId, courseId);
      
      return res.status(200).json({
        enrolled: isEnrolled
      });
    } catch (error) {
      console.error('Error in checkEnrollmentStatus:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi kiểm tra trạng thái' });
    }
  },

  // [GET] /api/enrollments/my-courses
  getEnrolledCourses: async (req, res) => {
    try {
      const studentId = req.user.id;

      const courses = await EnrollmentModel.getStudentCourses(studentId);
      
      return res.status(200).json({
        message: 'Lấy danh sách khóa học thành công',
        data: courses
      });
    } catch (error) {
      console.error('Error in getEnrolledCourses:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi lấy danh sách khóa học' });
    }
  },
};

module.exports = EnrollmentController;