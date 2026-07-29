import SettingModel from "../models/setting.model.js";

export const getSettings = async (req, res) => {
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
};