const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { verifyToken} = require('../middlewares/authMiddleware');

router.post('/register', AuthController.register);

router.post('/login', AuthController.login);

router.get('/profile',verifyToken,AuthController.getProfile);

router.put('/change-pwd',verifyToken,AuthController.changePassword);

router.post('/forgot-pwd',AuthController.forgotPassword);

router.put('/reset-pwd',AuthController.resetPassword);

router.post('/register/admin', AuthController.registerAdmin);

router.get('/verify-activation-token/:token', adminAuthController.verifyActivationToken);
ư
router.post('/activate-account', adminAuthController.activateAccount);

module.exports = router;