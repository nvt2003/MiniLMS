const EnrollmentModel = require('../models/enrollmentModel');
const ProgressModel = require('../models/progressModel');
const CourseModel = require('../models/coursesModel');

const StudentController = {
  // 1. ĐĂNG KÝ HỌC MỘT KHÓA HỌC
  enrollInCourse: async (req, res) => {
    try {
      const courseId = req.body.courseId;
      const studentId = req.user.id; // Lấy ra từ Token sau khi verify

      if (!courseId) {
        return res.status(400).json({ message: 'Vui lòng cung cấp ID khóa học (courseId)' });
      }

      // Kiểm tra xem khóa học đó có tồn tại thật không
      const course = await CourseModel.getDetailWithLessons(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Khóa học không tồn tại!' });
      }

      // Kiểm tra xem học viên này đã đăng ký khóa này trước đó chưa
      const isAlreadyEnrolled = await EnrollmentModel.checkStatus(studentId, courseId);
      if (isAlreadyEnrolled) {
        return res.status(400).json({ message: 'Bạn đã đăng ký khóa học này rồi!' });
      }

      // Tiến hành lưu thông tin đăng ký học
      await EnrollmentModel.enroll(studentId, courseId);

      return res.status(201).json({
        message: 'Đăng ký khóa học thành công! Chúc bạn học tập tốt.'
      });
    } catch (error) {
      return res.status(500).json({ error: 'Lỗi server: ' + error.message });
    }
  },

  // 2. ĐÁNH DẤU HOÀN THÀNH BÀI HỌC & XEM TIẾN ĐỘ (%) HIỆN TẠI
  completeLesson: async (req, res) => {
    try {
      const { lessonId, courseId } = req.body;
      const studentId = req.user.id;

      if (!lessonId || !courseId) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ lessonId và courseId' });
      }

      // 1. Đánh dấu bài học này là đã hoàn thành (is_completed = true)
      await ProgressModel.markAsComplete(studentId, lessonId);

      // 2. Tính toán lại xem sau khi học xong bài này, tổng tiến độ của khóa học đạt bao nhiêu %
      const currentProgress = await ProgressModel.getCourseProgress(studentId, courseId);

      return res.status(200).json({
        message: 'Chúc mừng bạn đã hoàn thành thêm một bài học!',
        progressPercentage: currentProgress // Ví dụ trả về: 25 (nghĩa là xong 25% khóa học)
      });
    } catch (error) {
      return res.status(500).json({ error: 'Lỗi server: ' + error.message });
    }
  },

  // 3. LẤY DANH SÁCH KHÓA HỌC MÀ HỌC VIÊN ĐÃ ĐĂNG KÝ (KÈM TIẾN ĐỘ %)
  getMyDashboard: async (req, res) => {
    try {
      const studentId = req.user.id;
      
      // Lấy danh sách các khóa học học viên này tham gia
      const enrolledCourses = await EnrollmentModel.getStudentCourses(studentId);

      // Duyệt qua từng khóa học để tính toán % tiến độ hiện tại của khóa đó
      const dashboardData = await Promise.all(
        enrolledCourses.map(async (course) => {
          const progress = await ProgressModel.getCourseProgress(studentId, course.id);
          return {
            ...course,
            progress_percentage: progress
          };
        })
      );

      return res.status(200).json({
        message: 'Lấy thông tin tiến độ học tập thành công!',
        data: dashboardData
      });
    } catch (error) {
      return res.status(500).json({ error: 'Lỗi server: ' + error.message });
    }
  },
  
  getCompletedLessonIdsByCourse: async (req, res) => {
    try {
      const studentId = req.user.id;
      const { courseId } = req.params;

      const lessonIds = await ProgressModel.getCompletedLessonIdsByCourse(
        studentId,
        courseId
      );

      return res.status(200).json({
        success: true,
        data: lessonIds,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ",
      });
    }
  },
};

module.exports = StudentController;