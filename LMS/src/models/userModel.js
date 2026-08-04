const db = require('../config/db');

const UserModel = {
  // 1. Tìm user theo email (Phục vụ Đăng nhập / Kiểm tra trùng lặp)
  findByEmail: async (email) => {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },

  // 2. Tạo user mới (Phục vụ Đăng ký)
  // create: async (name, email, hashedPassword, role = 'student') => {
  //   const [result] = await db.query(
  //     'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
  //     [name, email, hashedPassword, role]
  //   );
  //   return result.insertId;
  // },
  create: async (name, email, hashedPassword, role = 'student', status = 'ACTIVE', createdBy = null) => {
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, status, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, status, createdBy]
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
      `
      SELECT *
      FROM password_resets
      WHERE token = ?
      `,
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
    findById: async (id) => {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  },

  // Kích hoạt tài khoản Admin
  activateAdminUser: async (userId, hashedPassword) => {
    const [result] = await db.query(
      `UPDATE users 
      SET password = ?, status = 'ACTIVE', created_at = NOW() 
      WHERE id = ?`,
      [hashedPassword, userId]
    );
    return result.affectedRows > 0;
  },
  updateUserRoleAndStatus: async ({ userId, name, password, role, status, created_by }) => {
    const [result] = await db.query(
      `UPDATE users 
      SET name = ?, 
          password = ?, 
          role = ?, 
          status = ?, 
          created_by = ?, 
          created_at = NOW() 
      WHERE id = ?`,
      [name, password, role, status, created_by, userId]
    );
    return result.affectedRows > 0;
  },
  deactivateUser: async (userId) => {
    const [result] = await db.query(
      `UPDATE users 
      SET status = 'BLOCKED', create_at = NOW() 
      WHERE id = ?`,
      [userId]
    );
    return result.affectedRows > 0;
  },
  activateUser: async (userId) => {
    const [result] = await db.query(
      `UPDATE users 
      SET status = 'ACTIVE', updated_at = NOW() 
      WHERE id = ?`,
      [userId]
    );
    
    // Trả về true nếu có ít nhất 1 dòng bản ghi được cập nhật thành công
    return result.affectedRows > 0;
  },
    
  getList: async ({ search = '', role = 'ALL', status = 'ALL', page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  
  let whereClause = "WHERE 1=1";
  const queryParams = [];

  // Tìm kiếm theo Tên hoặc Email
  if (search) {
    whereClause += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
    queryParams.push(`%${search}%`, `%${search}%`);
  }

  // Lọc theo Role cụ thể
  if (role && role !== 'ALL') {
    whereClause += ` AND u.role LIKE ?`;
    queryParams.push(`${role}%`);
  }

  // Lọc theo Status (ACTIVE, PENDING, BLOCKED)
  if (status && status !== 'ALL') {
    whereClause += ` AND u.status = ?`;
    queryParams.push(status);
  }

  // 1. Query lấy tổng số lượng bản ghi (để tính tổng số trang)
  const countSql = `SELECT COUNT(*) AS total FROM users u ${whereClause}`;
  const [countRows] = await db.query(countSql, queryParams);
  const total = countRows[0].total;

  const dataSql = `
    SELECT 
      u.id, 
      u.name, 
      u.email, 
      u.role, 
      u.status, 
      u.created_by,
      creator.name AS created_by_name,
      u.created_at
    FROM users u
    LEFT JOIN users creator ON u.created_by = creator.id
    ${whereClause}
    ORDER BY u.id DESC
    LIMIT ? OFFSET ?
  `;

  // Thêm limit và offset vào tham số SQL
  const [rows] = await db.query(dataSql, [...queryParams, Number(limit), Number(offset)]);

  return {
    data: rows,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
}
};
module.exports = UserModel;