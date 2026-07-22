const express = require('express');
const router = express.Router();
const QuestionController = require('../controllers/questionController');
const {verifyToken, restrictTo} = require('../middlewares/authMiddleware'); 
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', verifyToken, QuestionController.getQuestions);
router.get('/:id', verifyToken, QuestionController.getQuestionDetail);
router.post('/', verifyToken,restrictTo('teacher'), QuestionController.createQuestion);
router.post('/upload-image', verifyToken, upload.single('file'), QuestionController.uploadQuestionImage);
router.put('/:id', verifyToken,restrictTo('teacher'), QuestionController.updateQuestion);
router.delete('/:id', verifyToken, restrictTo('teacher'), QuestionController.deleteQuestion);

module.exports = router;