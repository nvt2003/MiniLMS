const QuestionModel = require('../models/questionModel');
const { uploadLessonImage } = require('../services/CloudinaryServices');
const imageModel = require('../models/imageModel');
const { deleteImage } = require('../services/CloudinaryServices');


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
  getQuestionDetail: async (req, res) => {
    try {
      const question = await QuestionModel.getQuestionDetail(req.params.id, req.user.id);

      if (!question) {
        return res.status(404).json({ success: false, message: "Không tìm thấy câu hỏi" });
      }

      res.json({ success: true, data: question });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
  createQuestion: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const { content, question_type, answers, imageIds } = req.body;

      if (!content || !question_type) {
        return res.status(400).json({
          success: false,
          message: "Nội dung và loại câu hỏi không được để trống",
        });
      }

      // Ép kiểu mảng imageIds nếu truyền dạng chuỗi hoặc mảng
      const parsedImageIds = Array.isArray(imageIds) 
        ? imageIds 
        : JSON.parse(imageIds || "[]");

      const questionId = await QuestionModel.createQuestionWithAnswers({
        teacherId,
        content,
        questionType: question_type,
        answers,
        imageIds: parsedImageIds
      });

      res.status(201).json({
        success: true,
        message: "Tạo câu hỏi thành công",
        data: { id: questionId },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi server khi tạo câu hỏi" });
    }
  },
  uploadQuestionImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Chưa chọn file ảnh!" });
      }

      // 1. Upload ảnh lên Cloudinary
      const result = await uploadLessonImage(req.file.buffer);

      // 2. Lưu thông tin ảnh vào DB (tạm thời để imageable_id = 0)
      const imageId = await imageModel.create({
        imageable_type: 'question',
        imageable_id: 0,
        public_id: result.public_id,
        url: result.secure_url
      });

      // 3. Trả về đúng định dạng URL cho TinyMCE và kèm theo imageId
      return res.status(200).json({
        location: result.secure_url, // TinyMCE đọc trường location để chèn ảnh vào editor
        imageId: imageId
      });
    } catch (error) {
      console.error("Lỗi upload ảnh câu hỏi:", error);
      return res.status(500).json({ success: false, message: "Lỗi server khi upload ảnh" });
    }
  },
  deleteQuestionImage: async (req, res) => {
    try {
      const { id } = req.params;

      // Xóa trong DB và lấy public_id
      const publicId = await imageModel.deleteImage(id);

      if (publicId) {
        // Xóa thực tế trên Cloudinary
        await deleteImage(publicId);
      }

      res.json({ success: true, message: "Đã xóa ảnh thành công" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi server khi xóa ảnh" });
    }
  },
  updateQuestion: async (req, res) => {
    try {
      const questionId = req.params.id;
      const teacherId = req.user.id;
      const { content, question_type, answers, imageIds } = req.body;

      if (!content || !question_type) {
        return res.status(400).json({
          success: false,
          message: "Nội dung và loại câu hỏi không được để trống",
        });
      }

      const parsedImageIds = Array.isArray(imageIds)
        ? imageIds
        : JSON.parse(imageIds || "[]");

      const updated = await QuestionModel.updateQuestionWithAnswers({
        questionId,
        teacherId,
        content,
        questionType: question_type,
        answers,
        imageIds: parsedImageIds,
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy câu hỏi hoặc bạn không có quyền chỉnh sửa",
        });
      }

      res.json({
        success: true,
        message: "Cập nhật câu hỏi thành công",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật câu hỏi",
      });
    }
  },
  deleteQuestionImage: async (req, res) => {
    try {
      const { id } = req.params;

      // Xóa trong DB và lấy public_id
      const publicId = await imageModel.deleteImage(id);

      if (publicId) {
        // Xóa thực tế trên Cloudinary
        await deleteImage(publicId);
      }

      res.json({ success: true, message: "Đã xóa ảnh thành công" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi server khi xóa ảnh" });
    }
  },
  deleteQuestion: async (req, res) => {
    try {
      const questionId = req.params.id;
      const teacherId = req.user.id;

      const result = await QuestionModel.deleteQuestion(questionId, teacherId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy câu hỏi hoặc bạn không có quyền xóa",
        });
      }

      res.json({
        success: true,
        message: "Xóa câu hỏi thành công",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa câu hỏi",
      });
    }
  }
};

module.exports = QuestionController;