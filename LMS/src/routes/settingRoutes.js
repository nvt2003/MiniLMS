const express = require('express');
const router = express.Router();
const SettingController = require('../controllers/settingController');
const { verifyToken,restrictTo } = require('../middlewares/authMiddleware');

router.get("/group/:group", SettingController.getSettings);
router.get("/key/:key", SettingController.getSettingByKey);
router.put('/key/:key',verifyToken,restrictTo('admin'), SettingController.updateByKey);
router.put('/group/:group',verifyToken,restrictTo('admin'), SettingController.updateByGroup);

module.exports = router;