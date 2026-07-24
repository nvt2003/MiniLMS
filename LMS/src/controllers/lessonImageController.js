const lessonImageModel = require("../models/lessonImageModel");
const LessonImage = require("../models/lessonImageModel");
const { uploadLessonImage, deleteImage } = require("../services/CloudinaryServices");

const LessonImageController = {
  upload: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Vui lòng chọn ảnh."
        });
      }

      // Upload lên Cloudinary
      const result = await uploadLessonImage(req.file.buffer);

      // Lưu DB
      const imageId = await lessonImageModel.create(
        null,
        result.public_id,
        result.secure_url
      );

      return res.status(201).json({
        id: imageId,
        url: result.secure_url
      });

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: error.message
      });
    }
  },
  delete: async (req, res) => {
  try {
    const { id } = req.params;

    const image = await lessonImageModel.getById(id);

    if (!image) {
      return res.status(404).json({
        message: "Không tìm thấy ảnh"
      });
    }


    // Xóa trên Cloudinary
    await cloudinary.uploader.destroy(
      image.public_id
    );


    // Xóa database
    await lessonImageModel.delete(id);


    return res.json({
      message:"Xóa ảnh thành công"
    });


  } catch(error){

    console.log(error);

    res.status(500).json({
      message:error.message
    });
  }
}
};

module.exports = LessonImageController;