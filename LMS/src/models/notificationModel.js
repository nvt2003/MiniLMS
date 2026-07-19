const db = require('../config/db');

const NotificationModel = {
  // Lấy cả ID và Email của những học sinh đã đăng ký khóa học
  getStudentsAndEmailsByCourse: async (courseId) => {
    const query = `
      SELECT e.student_id, u.email 
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE e.course_id = ?
    `;
    const [rows] = await db.query(query, [courseId]);
    return rows; // Trả về dạng mảng: [{ student_id: 1, email: 'hs1@gmail.com' }, ...]
  }
};

module.exports = NotificationModel;