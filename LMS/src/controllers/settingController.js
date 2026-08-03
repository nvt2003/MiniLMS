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
            const settings = await SettingModel.getByGroup(group);

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
    createSetting: async (req, res) => {
        try {
            const { setting_key, setting_value, setting_group,parent_group, description } = req.body;
            console.log(parent_group);
            // Validate đầu vào
            if (!setting_key || setting_value === undefined) {
                return res.status(400).json({ message: 'setting_key và setting_value là bắt buộc' });
            }

            const insertId = await SettingModel.create({
                setting_key,
                setting_value,
                setting_group,
                parent_group,
                description
            });

            return res.status(201).json({
                message: 'Thêm setting thành công',
                data: { id: insertId, setting_key, setting_value, setting_group,parent_group, description }
            });
        } catch (error) {
            // Xử lý trùng lặp setting_key (Lỗi UNIQUE)
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'setting_key này đã tồn tại' });
            }
            return res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    },
    
    getSettingsByGroupAndKey: async (req, res) => {
        try {
            const {group,key} = req.params;
            const settings = await SettingModel.getByGroupAndKey(group,key);

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
    
    searchGroup: async (req, res) => {
        try {
            const { search = '' } = req.query;
            const settings = await SettingModel.searchGroup(search);

            res.json({
                success: true,
                data: settings
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Không thể tìm thấy cấu hình hệ thống"
            });
        }
    },searchParent: async (req, res) => {
        try {
            const { parent, group, key } = req.query;
            const settings = await SettingModel.searchParent(parent, group, key);

            res.json({
                success: true,
                data: settings
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Không thể tìm thấy cấu hình hệ thống"
            });
        }
    },
    updateSettingValue: async (req, res) => {
        try {
            const { parent_group, setting_group, setting_key, setting_value, description } = req.body;

            // Validate dữ liệu đầu vào
            if (!parent_group || !setting_group || !setting_key) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin định danh: parent_group, setting_group, hoặc setting_key"
            });
            }

            // Chuyển kiểu dữ liệu sang String nếu value truyền lên là Object/Array (như cấu hình Navbar JSON)
            const formattedValue = typeof setting_value === "object" 
            ? JSON.stringify(setting_value) 
            : setting_value;

            const affectedRows = await SettingModel.updateValue(
            parent_group,
            setting_group,
            setting_key,
            formattedValue,
            description
            );

            if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy cấu hình tương ứng để cập nhật"
            });
            }

            return res.status(200).json({
            success: true,
            message: "Cập nhật cấu hình thành công"
            });
        } catch (error) {
            console.error("Lỗi khi update setting:", error);
            return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ nội bộ",
            error: error.message
            });
        }
        }
}
module.exports = SettingController