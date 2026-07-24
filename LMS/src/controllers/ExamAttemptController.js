const ExamAttemptModel = require('../models/ExamAttemptModel');

const ExamAttemptController = {
  startExam: async (req, res) => {
    try {
      const studentId = req.user.id;
      const { examId } = req.params;

      if (!examId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin mã bài kiểm tra (examId)",
        });
      }

      // 1. Kiểm tra bài kiểm tra có tồn tại không
      const exam = await ExamAttemptModel.findExamById(examId);
      if (!exam) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bài kiểm tra",
        });
      }

      // 2. Kiểm tra quyền truy cập (Nếu không public và thuộc khóa học)
      if (!exam.is_public && exam.course_id) {
        const isEnrolled = await ExamAttemptModel.checkEnrollment(studentId, exam.course_id);
        if (!isEnrolled) {
          return res.status(403).json({
            success: false,
            message: "Bạn chưa đăng ký khóa học này nên không thể làm bài kiểm tra",
          });
        }
      }

      // 3. Kiểm tra xem đã có lượt làm bài nào đang diễn ra chưa
      const existingAttempt = await ExamAttemptModel.findActiveAttempt(examId, studentId);
      if (existingAttempt) {
        return res.json({
          success: true,
          message: "Bạn đang có bài làm chưa hoàn thành, tiếp tục làm bài",
          data: existingAttempt,
        });
      }

      // 4. Tạo lượt làm bài mới (in_progress)
      const newAttempt = await ExamAttemptModel.createAttempt(examId, studentId);

      res.status(201).json({
        success: true,
        message: "Bắt đầu làm bài kiểm tra thành công",
        data: newAttempt,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },
  submitExam: async (req, res) => {
    try {
      const studentId = req.user.id;
      const { attemptId, answers = [] } = req.body;

      const attempt = await ExamAttemptModel.getAttemptWithExam(attemptId, studentId);
      if (!attempt) return res.status(400).json({ success: false, message: "Lượt làm bài không hợp lệ hoặc đã nộp" });

      const examQuestions = await ExamAttemptModel.getExamQuestionsDetails(attempt.exam_id);
      const qMap = Object.fromEntries(examQuestions.map(q => [q.question_id, q]));

      let totalScore = 0;
      let hasEssay = false;

      const preparedAnswers = answers.map(ans => {
        const q = qMap[ans.question_id];
        let score = null;

        if (q) {
          // 0. CHUYỂN ĐỔI DAP AN DUNG TU CHUOI (VD: "1,2,6") THANH MANG SO ([1, 2, 6])
          const correctOptionIds = q.correct_option_id 
            ? q.correct_option_id.toString().split(',').map(Number).sort((a, b) => a - b)
            : [];

          // 1. TỰ LUẬN
          if (q.question_type === 'essay' || ans.essay_answer) {
            hasEssay = true;
            score = null;
          } 

          // 2. TRẮC NGHIỆM 1 ĐÁP ÁN (SINGLE)
          else if (q.question_type === 'single') {
            const correctOptId = correctOptionIds[0];
            const userSelectedId = Number(ans.selected_option_id || ans.selected_option_ids);

            if (correctOptId && userSelectedId && userSelectedId === correctOptId) {
              score = parseFloat(q.points) || 0;
              totalScore += score;
            } else {
              score = 0;
            }
          } 

          // 3. TRẮC NGHIỆM NHIỀU ĐÁP ÁN (MULTIPLE)
          else if (q.question_type === 'multiple') {
            // Ép kiểu đầu vào người dùng chọn về mảng số
            let userSelected = [];
            if (Array.isArray(ans.selected_option_ids)) {
              userSelected = ans.selected_option_ids;
            } else if (Array.isArray(ans.selected_option_id)) {
              userSelected = ans.selected_option_id;
            } else if (typeof ans.selected_option_id === 'string') {
              userSelected = ans.selected_option_id.split(',');
            } else if (ans.selected_option_id) {
              userSelected = [ans.selected_option_id];
            }

            userSelected = userSelected.map(Number).filter(Boolean).sort((a, b) => a - b);

            // So sánh mảng người dùng chọn với mảng đáp án đúng
            const isCorrect = userSelected.length === correctOptionIds.length &&
              userSelected.every((val, index) => val === correctOptionIds[index]);
            if (isCorrect && userSelected.length > 0) {
              score = parseFloat(q.points) || 0;
              totalScore += score;
            } else {
              score = 0;
            }
          }
        }

        return { ...ans, score_given: score };
      });

      const isAuto = attempt.grading_method === 'auto' && !hasEssay;
      const finalStatus = isAuto ? 'graded' : 'submitted';
      const finalScore = isAuto ? totalScore : null;

      await ExamAttemptModel.submitExamTransaction(attemptId, preparedAnswers, finalScore, finalStatus);

      res.json({
        success: true,
        message: isAuto ? "Nộp bài thành công! Đã chấm điểm tự động." : "Nộp bài thành công! Đang chờ chấm tự luận.",
        data: { attempt_id: attemptId, status: finalStatus, total_score: finalScore }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
  // Kiểm tra nhanh đáp án 1 câu (Luyện tập)
  checkPracticeAnswer: async (req, res) => {
    try {
      const { questionId, selectedOptionId } = req.body;

      if (!questionId) {
        return res.status(400).json({ success: false, message: "Thiếu mã câu hỏi" });
      }

      const question = await ExamAttemptModel.getQuestionAnswer(questionId);
      if (!question) {
        return res.status(404).json({ success: false, message: "Không tìm thấy câu hỏi" });
      }

      const isCorrect = Number(selectedOptionId) === Number(question.correct_option_id);

      res.json({
        success: true,
        data: {
          question_id: questionId,
          is_correct: isCorrect,
          correct_option_id: question.correct_option_id
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
  // Xem kết quả bài thi
  getExamResult: async (req, res) => {
    try {
      const studentId = req.user.id;
      const { attemptId } = req.params;

      const result = await ExamAttemptModel.getAttemptResult(attemptId, studentId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy kết quả bài thi hoặc bạn không có quyền xem"
        });
      }

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
  getAttempts: async (req, res) => {
    try {
      const studentId = req.user.id;
      const { search = '', sortBy = 'newest', page = 1, limit = 5 } = req.query;
      const offset = (page - 1) * limit;

      const attempts = await ExamAttemptModel.findWithFilters(studentId, {
        search,
        sortBy,
        limit,
        offset
      });

      return res.status(200).json({
        success: true,
        data: attempts
      });
    } catch (error) {
      console.error('Lỗi getAttempts:', error);
      return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
};

module.exports = ExamAttemptController;