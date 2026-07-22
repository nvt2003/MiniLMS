const ExamModel = require('../models/ExamModel');

const ExamController = {
  getTeacherExams: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const { search, type, is_public, course_id, page, limit } = req.query;

      const result = await ExamModel.getTeacherExams({
        teacherId,
        search,
        type,
        is_public,
        course_id,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10
      });

      res.json({
        success: true,
        data: result.exams,
        pagination: result.pagination
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
  getExamDetail: async (req, res) => {
    try {
      const exam = await ExamModel.getExamDetail(req.params.id);

      if (!exam) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đề thi" });
      }

      // Kiểm tra quyền: Chỉ người tạo hoặc đề công khai
      if (exam.creator_id !== req.user.id && exam.is_public !== 1) {
        return res.status(403).json({ success: false, message: "Không có quyền truy cập" });
      }

      res.json({ success: true, data: exam });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
  createExam: async (req, res) => {
    try {
      const creator_id = req.user.id;
      const { title, description, type, grading_method, duration_minutes, is_public, course_id } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, message: "Tiêu đề đề thi là bắt buộc" });
      }

      const newExamId = await ExamModel.createExam({
        course_id,
        creator_id,
        title,
        description,
        type,
        grading_method,
        duration_minutes,
        is_public
      });

      res.status(201).json({
        success: true,
        message: "Tạo đề thi thành công",
        data: { id: newExamId }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
  addQuestionsToExam: async (req, res) => {
    try {
      const examId = req.params.id;
      const userId = req.user.id;
      const { questions } = req.body; // Array: [{ question_id: 1, position: 1, points: 1.5 }, ...]

      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ success: false, message: "Danh sách câu hỏi không hợp lệ" });
      }

      // Kiểm tra xem đề thi có tồn tại và thuộc về giáo viên này hay không
      const exam = await ExamModel.getExamDetail(examId);
      if (!exam) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đề thi" });
      }
      if (exam.creator_id !== userId) {
        return res.status(403).json({ success: false, message: "Bạn không có quyền sửa đề thi này" });
      }

      await ExamModel.addQuestionsToExam(examId, questions);

      res.json({
        success: true,
        message: "Thêm danh sách câu hỏi vào đề thi thành công"
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
  updateExam: async (req, res) => {
    try {
      const examId = req.params.id;
      const userId = req.user.id;

      // Kiểm tra đề thi có tồn tại và đúng người tạo không
      const exam = await ExamModel.getExamDetail(examId);
      if (!exam) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đề thi" });
      }
      if (exam.creator_id !== userId) {
        return res.status(403).json({ success: false, message: "Bạn không có quyền chỉnh sửa đề thi này" });
      }

      await ExamModel.updateExam(examId, req.body);

      res.json({
        success: true,
        message: "Cập nhật đề thi thành công"
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
  copyExam: async (req, res) => {
    try {
      const originalExamId = req.params.id;
      const userId = req.user.id;

      // Lấy thông tin đề thi gốc
      const originalExam = await ExamModel.getExamDetail(originalExamId);
      if (!originalExam) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đề thi gốc" });
      }

      // Chỉ cho phép copy đề của chính mình HOẶC đề đã bật công khai (is_public = 1)
      if (originalExam.creator_id !== userId && originalExam.is_public !== 1) {
        return res.status(403).json({ success: false, message: "Bạn không có quyền sao chép đề thi này" });
      }

      const newExamId = await ExamModel.copyExam(originalExam, userId);

      res.status(201).json({
        success: true,
        message: "Sao chép đề thi thành công",
        data: { id: newExamId }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
  deleteExam: async (req, res) => {
    try {
      const examId = req.params.id;
      const userId = req.user.id;

      // Kiểm tra đề thi có tồn tại không
      const exam = await ExamModel.getExamDetail(examId);
      if (!exam) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đề thi" });
      }

      // Chỉ chính người tạo đề (hoặc admin nếu có) mới được quyền xóa
      if (exam.creator_id !== userId) {
        return res.status(403).json({ success: false, message: "Bạn không có quyền xóa đề thi này" });
      }

      await ExamModel.deleteExam(examId);

      res.json({
        success: true,
        message: "Xóa đề thi thành công"
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
};

module.exports = ExamController;