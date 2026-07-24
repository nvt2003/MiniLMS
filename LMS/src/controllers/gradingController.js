const GradingModel = require('../models/GradingModel');

const GradingController = {
  getPendingGradingList: async (req, res) => {
    try {
      const teacherId = req.user.id;

      const pendingList = await GradingModel.getPendingGradingList(teacherId);

      res.json({
        success: true,
        data: pendingList,
      });
    } catch (err) {
      console.error("Error fetching pending grading list:", err);

      res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },
  gradeEssay: async (req, res) => {
    try {
      const { attempt_id, grades } = req.body; 
      // grades: [{ answer_id: 1, score: 2.5, comment: "Làm tốt" }, ...]

      if (!attempt_id || !Array.isArray(grades)) {
        return res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ" });
      }

      // Lưu điểm và nhận xét cho từng câu
      for (const item of grades) {
        await GradingModel.gradeEssayQuestion(item.answer_id, item.score, item.comment);
      }

      // Cập nhật lại tổng điểm lượt làm bài và chuyển status -> 'graded'
      const totalScore = await GradingModel.updateAttemptTotalScore(attempt_id);

      res.json({
        success: true,
        message: "Chấm điểm thành công",
        data: { attempt_id, total_score: totalScore }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
    // Thêm vào GradingController
    finishGrading: async (req, res) => {
    try {
        const { attemptId } = req.params;

        const totalScore = await GradingModel.finishGrading(attemptId);

        res.json({
        success: true,
        message: "Hoàn tất chấm điểm bài thi thành công",
        data: {
            attempt_id: attemptId,
            total_score: totalScore,
            status: 'graded'
        }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
    },
    getClassGradebook: async (req, res) => {
    try {
      const { courseId, examId } = req.params;

      // Lấy điểm trung bình lớp
      const stats = await ClassModel.getClassExamStats(courseId, examId);

      // Lấy danh sách học sinh và điểm số
      const students = await ClassModel.getStudentScoresByExam(courseId, examId);

      res.json({
        success: true,
        data: {
          summary: {
            total_students: students.length,
            total_submitted: stats.total_submitted || 0,
            average_score: stats.average_score || 0
          },
          students: students
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  }

};

module.exports = GradingController;