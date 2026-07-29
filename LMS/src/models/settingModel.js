const db = require('../config/db');

const SettingModel = {
    getByKey: async (key)=>{
        const res = await db.query(`SELECT setting_key, setting_value, setting_group, description 
        FROM system_settings 
        WHERE setting_key = ?`,key);
        return res;
    },
    getByGroup: async (group)=>{
        const [res] = await db.query(`SELECT setting_key, setting_value, description 
        FROM system_settings 
        WHERE setting_group = ?`,group)
        return res;
    },
    updateByKey: async (key, value) => {
        const [result] = await db.query(
            `UPDATE system_settings SET setting_value = ? WHERE setting_key = ?`,
            [value, key]
        );
        return result.affectedRows > 0;
    },
    updateByGroup: async (group, settings) => {
        // settings dạng object: { "site_name": "LMS V2", "site_logo": "logo.png" }
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            for (const [key, value] of Object.entries(settings)) {
                await connection.query(
                    `UPDATE system_settings SET setting_value = ? WHERE setting_key = ? AND setting_group = ?`,
                    [value, key, group]
                );
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}