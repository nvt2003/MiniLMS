const QuestionModel = require('../models/QuestionModel');

const QuestionController = {
  getQuestions: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const { question_type, search } = req.query;

      const questions = await QuestionModel.getQuestions({
        teacherId,
        questionType: question_type,
        keyword: search,
      });

      res.json({
        success: true,
        data: questions,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },
};

module.exports = QuestionController;