const express = require("express");
const router = express.Router();

const imageController = require("../controllers/imageController");
const {verifyToken} = require("../middlewares/authMiddleware");
const {restrictTo} = require("../middlewares/authMiddleware");
const {upload} = require("../middlewares/uploadMiddleware");

router.post(
    "/upload",
    verifyToken,
    restrictTo("teacher", "admin"),
    upload.single("image"),
    imageController.upload
);

router.delete(
    "/:id",
    verifyToken,
    restrictTo("teacher", "admin"),
    imageController.delete
);

module.exports = router;