const express = require("express");
const router = express.Router();

const LessonImageController = require("../controllers/lessonImageController");
const {verifyToken} = require("../middlewares/authMiddleware");
const {restrictTo} = require("../middlewares/authMiddleware");
const {upload} = require("../middlewares/uploadMiddleware");

router.post(
    "/upload",
    verifyToken,
    restrictTo("teacher", "admin"),
    upload.single("image"),
    LessonImageController.upload
);

router.delete(
    "/:id",
    verifyToken,
    restrictTo("teacher", "admin"),
    LessonImageController.delete
);

module.exports = router;