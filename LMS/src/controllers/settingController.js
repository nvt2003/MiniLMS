const SettingModel = require('../models/settingModel');

const SettingController = {
    updateByKey: async (req, res) => {
        try {
            const { key } = req.params;
            const { value } = req.body; // Body: { "value": "Gia tri moi" }

            if (value === undefined) {
                return res.status(400).json({ message: 'Thiếu trường value' });
            }

            const updated = await SettingModel.updateByKey(key, value);
            if (!updated) {
                return res.status(404).json({ message: 'Không tìm thấy setting key này' });
            }

            return res.json({ message: 'Cập nhật thành công', key, value });
        } catch (error) {
            return res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    },
    updateByGroup: async (req, res) => {
        try {
            const { group } = req.params;
            const settings = req.body; // Body dạng object: { "site_name": "LMS 2026", "site_logo": "new_logo.png" }

            if (!settings || Object.keys(settings).length === 0) {
                return res.status(400).json({ message: 'Dữ liệu gửi lên không hợp lệ' });
            }

            await SettingModel.updateByGroup(group, settings);
            return res.json({ message: `Cập nhật nhóm ${group} thành công` });
        } catch (error) {
            return res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    },
    getSettingByKey: async (req, res) => {
        try {
            const {key} = req.params;
            const settings = await SettingModel.getSettingByKey(key);

            res.json({
                success: true,
                data: settings
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Không thể lấy cấu hình hệ thống"
            });
        }
    },
    getSettings: async (req, res) => {
        try {
            const {group} = req.params;
            const settings = await SettingModel.getSettings(group);

            res.json({
                success: true,
                data: settings
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Không thể lấy cấu hình hệ thống"
            });
        }
    }
}
module.exports = SettingController