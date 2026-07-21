const express = require('express');
const router = express.Router();
const QuestionController = require('../controllers/questionController');
const {verifyToken, restrictTo} = require('../middlewares/authMiddleware'); 
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/questions', verifyToken, QuestionController.getQuestions);
router.get('/questions/:id', verifyToken, QuestionController.getQuestionDetail);
router.post('/questions', verifyToken,restrictTo('teacher'), QuestionController.createQuestion);
router.post('/questions/upload-image', verifyToken, upload.single('file'), QuestionController.uploadQuestionImage);
router.put('/questions/:id', verifyToken,restrictTo('teacher'), QuestionController.updateQuestion);
router.delete('/questions/:id', verifyToken, restrictTo('teacher'), QuestionController.deleteQuestion);

module.exports = router;