const imageModel = require("../models/imageModel");
const LessonImage = require("../models/imageModel");
const { uploadLessonImage, deleteImage } = require("../services/CloudinaryServices");

const ImageController = {
  upload: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Vui lòng chọn ảnh."
        });
      }

      // 1. Upload lên Cloudinary
      const result = await uploadLessonImage(req.file.buffer);

      // 2. Lưu DB với thiết kế đa hình (Polymorphic)
      // imageableType: 'lesson', imageableId: null (do chưa tạo/lưu bài học)
      const imageId = await imageModel.create(
        'lesson',
        null,
        result.public_id,
        result.secure_url
      );

      return res.status(201).json({
        id: imageId,
        url: result.secure_url
      });

    } catch (error) {
      console.error("Error in upload image:", error);

      return res.status(500).json({
        message: error.message
      });
    }
  },
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      // 1. Lấy thông tin ảnh từ bảng `images` mới
      const image = await imageModel.getById(id);

      if (!image) {
        return res.status(404).json({
          message: "Không tìm thấy ảnh"
        });
      }

      // 2. Xóa file trên Cloudinary bằng public_id
      await cloudinary.uploader.destroy(
        image.public_id
      );

      // 3. Xóa bản ghi trong database
      await imageModel.delete(id);

      return res.json({
        message: "Xóa ảnh thành công"
      });

    } catch (error) {
      console.error("Error in delete image:", error);

      return res.status(500).json({
        message: error.message
      });
    }
  }
};

module.exports = ImageController;