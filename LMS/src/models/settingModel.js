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
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            for (const [key, value] of Object.entries(settings)) {
                await connection.query(
                    `INSERT INTO system_settings
                    (setting_key, setting_value, setting_group)
                    VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    setting_value = VALUES(setting_value)`,
                    [key, value, group]
                );
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
        console.error("updateByGroup error:", error);
            throw error;
        } finally {
            connection.release();
        }
    },
    create: async ({ setting_key, setting_value, setting_group = 'general', description = null }) => {
        const [result] = await db.query(
            `INSERT INTO system_settings (setting_key, setting_value, setting_group, description) 
             VALUES (?, ?, ?, ?)`,
            [setting_key, setting_value, setting_group, description]
        );
        return result.insertId;
    },
    getByGroupAndKey: async (group,key)=>{
        const [res] = await db.query(`SELECT setting_value, description 
        FROM system_settings 
        WHERE setting_group = ? AND setting_key = ?`,[group,key])
        return res;
    },
    searchGroup: async (keyword) => {
    const [res] = await db.query(`
        SELECT DISTINCT setting_group
        FROM system_settings
        WHERE setting_group LIKE ?
    `, [`%${keyword}%`]);

    return res;
},
}
module.exports = SettingModel