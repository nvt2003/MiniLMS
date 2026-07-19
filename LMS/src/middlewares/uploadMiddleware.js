// // middlewares/uploadMiddleware.js
// const multer = require("multer");
// const storage = multer.memoryStorage();
// const cloudinary = require("../config/cloudinary"); 

// const uploadVideo = multer({
//     storage,

//     limits: {
//         fileSize: 100 * 1024 * 1024 //100MB
//     },

//     fileFilter(req, file, cb) {

//         if (file.mimetype.startsWith("video/")) {
//             cb(null, true);
//         } else {
//             cb(new Error("Chỉ được upload video."));
//         }

//     }
// });

// module.exports = { uploadVideo };
const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024
    }
});

module.exports = { upload };