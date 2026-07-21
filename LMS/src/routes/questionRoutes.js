const express = require('express');
const router = express.Router();
const QuestionController = require('../controllers/QuestionController');
const verifyToken = require('../middlewares/authMiddleware'); // Đường dẫn tới middleware xác thực token

router.get('/questions', verifyToken, QuestionController.getQuestions);

module.exports = router;