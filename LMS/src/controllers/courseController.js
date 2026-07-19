const CourseModel = require('../models/coursesModel');
const {uploadImage} = require("../services/CloudinaryServices");

const CourseController = {
  // 1. LẤY TẤT CẢ KHÓA HỌC (Ai cũng xem được - Phục vụ trang chủ)
  getAllCourses: async (req, res) => {
    try {
      const courses = await CourseModel.getAll();
      return res.status(200).json({
        message: 'Lấy danh sách khóa học thành công!',
        data: courses
      });
    } catch (error) {
      return res.status(500).json({ error: 'Lỗi server: ' + error.message });
    }
  },

  //search
  getCourses: async (req, res) => {
    try {
      const { search, teacherId } = req.query;
      // Gọi model xử lý lọc dữ liệu
      const courses = await CourseModel.searchAndFilter({ search, teacherId });

      return res.status(200).json({
        message: 'Lấy danh sách khóa học thành công!',
        data: courses
      });
    } catch (error) {
      return res.status(500).json({ error: 'Lỗi server: ' + error.message });
    }
  },

  // 2. LẤY CHI TIẾT 1 KHÓA HỌC KÈM BÀI HỌC (Học viên/Giáo viên đều xem được)
  getCourseDetail: async (req, res) => {
    try {
      const courseId = req.params.id;
      const course = await CourseModel.getDetailWithLessons(courseId);

      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học này!' });
      }

      return res.status(200).json({
        message: 'Lấy chi tiết khóa học thành công!',
        data: course
      });
    } catch (error) {
      return res.status(500).json({ error: 'Lỗi server: ' + error.message });
    }
  },

  // 3. TẠO KHÓA HỌC MỚI (Chỉ Giáo viên / Admin)
  createNewCourse: async (req, res) => {
    try {
      const { title, description } = req.body;
      
      // req.user.id lấy được từ token sau khi đi qua verifyToken middleware
      const teacherId = req.user.id; 

      if (!title) {
        return res.status(400).json({ message: 'Tiêu đề khóa học không được để trống!' });
      }
      let thumbnailUrl=null;
      if (req.file) {
          const result = await uploadImage(req.file.buffer);
          thumbnailUrl = result.secure_url;
      }
      const newCourseId = await CourseModel.create(teacherId, title, description, thumbnailUrl);

      return res.status(201).json({
        message: 'Tạo khóa học mới thành công!',
        courseId: newCourseId
      });
    } catch (error) {
      return res.status(500).json({ error: 'Lỗi server: ' + error.message });
    }
  },
updateCourse: async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const teacherId = req.user.id;

    if (!title) {
      return res.status(400).json({
        message: "Tiêu đề khóa học không được để trống!",
      });
    }
    // Kiểm tra khóa học
    const course = await CourseModel.getDetailWithLessons(id);

    if (!course) {
      return res.status(404).json({
        message: "Không tìm thấy khóa học!",
      });
    }

    // Chỉ giáo viên tạo khóa học mới được sửa
    if (course.teacher_id !== teacherId) {
      return res.status(403).json({
        message: "Bạn không có quyền sửa khóa học này!",
      });
    }

    // Mặc định giữ ảnh cũ
    let thumbnailUrl = course.thumbnail;

    // Nếu upload ảnh mới thì thay thế
    if (req.file) {
      const result = await uploadImage(req.file.buffer);
      thumbnailUrl = result.secure_url;
    }

    await CourseModel.update(
      id,
      title,
      description,
      thumbnailUrl
    );

    return res.status(200).json({
      message: "Cập nhật khóa học thành công!",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Lỗi server: " + error.message,
    });
  }
},
  // XÓA KHÓA HỌC (Chỉ Giáo viên / Admin)
  deleteCourse: async (req, res) => {
    try {
      const courseId = req.params.id;

      // Kiểm tra khóa học có tồn tại không trước khi xóa
      const course = await CourseModel.getDetailWithLessons(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Khóa học không tồn tại hoặc đã bị xóa trước đó!' });
      }

      // Kiểm tra quyền: Nếu là giáo viên, phải đúng là người đã tạo ra khóa học này mới được xóa
      // (Admin thì có quyền xóa mọi khóa học)
      if (req.user.role === 'teacher' && course.teacher_id !== req.user.id) {
        return res.status(403).json({ message: 'Bạn không được phép xóa khóa học của giáo viên khác!' });
      }

      await CourseModel.delete(courseId);

      return res.status(200).json({
        message: 'Xóa khóa học thành công!'
      });
    } catch (error) {
      return res.status(500).json({ error: 'Lỗi server: ' + error.message });
    }
  },
  
};

module.exports = CourseController;