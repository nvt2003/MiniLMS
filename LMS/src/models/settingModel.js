import db from "../config/db.js";

class SettingModel {
    static async getSettings(group) {
        const [rows] = await db.query(
            "SELECT setting_key, setting_value FROM system_settings WHERE setting_group = ?",
            [group]
        );

        return rows;
    }

    static async getByKey(key) {
        const [rows] = await db.query(
            "SELECT * FROM system_settings WHERE setting_key = ?",
            [key]
        );

        return rows[0] || null;
    }
}

export default SettingModel;