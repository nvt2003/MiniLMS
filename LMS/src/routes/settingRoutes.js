const express = require('express');
const router = express.Router();
const SettingController = require('../controllers/settingController');
const { verifyToken,restrictTo } = require('../middlewares/authMiddleware');

router.get("/group/:group", SettingController.getSettings);
router.get("/key/:key", SettingController.getSettingByKey);
router.put('/key/:key',verifyToken,restrictTo('admin','admin_pages'), SettingController.updateByKey);
router.put('/group/:group',verifyToken,restrictTo('admin','admin_pages'), SettingController.updateByGroup);
router.post('/',verifyToken,restrictTo('admin','admin_pages'), SettingController.createSetting);
router.get("/group/:group/:key", SettingController.getSettingsByGroupAndKey);
router.get("/group", SettingController.searchGroup);
router.get("/parent", SettingController.searchParent);
router.put("/",verifyToken,restrictTo('admin','admin_pages'), SettingController.updateSettingValue);

module.exports = router;