const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

const uploadToCloudinary = (buffer, folder, resourceType) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

const uploadVideo = (buffer) =>
    uploadToCloudinary(buffer, "lms_videos", "video");

const uploadImage = (buffer) =>
    uploadToCloudinary(buffer, "lms_images", "image");
const uploadLessonImage = (buffer) =>
    uploadToCloudinary(buffer, "lms_lesson_images", "image");

module.exports = {
    uploadVideo,
    uploadImage,
    uploadLessonImage
};
exports.deleteImage = async (publicId) => {

    return await cloudinary.uploader.destroy(publicId);

};