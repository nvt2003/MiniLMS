const db = require('../config/db');

const UserModel = {
  // 1. Tìm user theo email (Phục vụ Đăng nhập / Kiểm tra trùng lặp)
  findByEmail: async (email) => {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },

  // 2. Tạo user mới (Phục vụ Đăng ký)
  create: async (name, email, hashedPassword, role = 'student') => {
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );
    return result.insertId;
  },

  // 3. Tìm user theo ID (Phục vụ lấy Profile / Check Middleware)
  findById: async (id) => {
    const [rows] = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id]);
    return rows[0];
  },
  getProfile: async (id) => {
    const [rows] = await db.query(
      `SELECT id, name, email, role, created_at
       FROM users
       WHERE id = ?`,
      [id]
    );

    return rows[0];
  },

  getById: async (id) => {
    const [rows] = await db.query(
      `SELECT * FROM users WHERE id = ?`,
      [id]
    );

    return rows[0];
  },

  updatePassword: async (id, password) => {
    await db.query(
      `UPDATE users
       SET password = ?
       WHERE id = ?`,
      [password, id]
    );
  },
  saveResetToken: async (userId, token, expiresAt) => {
    // Xóa token cũ nếu có
    await db.query(
      "DELETE FROM password_resets WHERE user_id = ?",
      [userId]
    );

    await db.query(
      `INSERT INTO password_resets (user_id, token, expires_at)
       VALUES (?, ?, ?)`,
      [userId, token, expiresAt]
    );
  },
  getResetToken: async (token) => {
    const [rows] = await db.query(
      `SELECT *
       FROM password_resets
       WHERE token = ?`,
      [token]
    );

    return rows[0];
  },
  deleteResetToken: async (token) => {
    await db.query(
      `DELETE FROM password_resets
       WHERE token = ?`,
      [token]
    );
  },
};
module.exports = UserModel;