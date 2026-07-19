const db = require('../config/db');

const EnrollmentModel = {
  // 1. Học viên đăng ký khóa học
  enroll: async (studentId, courseId) => {
    const [result] = await db.query(
      'INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)',
      [studentId, courseId]
    );
    return result.insertId;
  },

  // 2. Kiểm tra xem học viên đã đăng ký khóa này chưa (tránh nhấn đăng ký lại)
  checkStatus: async (studentId, courseId) => {
    const [rows] = await db.query(
      'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
      [studentId, courseId]
    );
    return rows.length > 0; // Trả về true nếu đã đăng ký rồi
  },

  // 3. Lấy danh sách các khóa học mà học viên ĐÃ đăng ký
  getStudentCourses: async (studentId) => {
    const query = `
      SELECT c.id, c.title, c.thumbnail_url, e.enrolled_at
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = ?
      ORDER BY e.enrolled_at DESC
    `;
    const [rows] = await db.query(query, [studentId]);
    return rows;
  },
  // Hủy tham gia khóa học và xóa tiến trình học
unenrollCourse: async (studentId, courseId) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Xóa tiến trình học của các bài học thuộc khóa học
    const deleteProgressQuery = `
      DELETE lp
      FROM lesson_progress lp
      JOIN lessons l ON lp.lesson_id = l.id
      WHERE lp.student_id = ?
        AND l.course_id = ?
    `;

    await connection.query(deleteProgressQuery, [studentId, courseId]);

    // Xóa đăng ký khóa học
    const deleteEnrollmentQuery = `
      DELETE FROM enrollments
      WHERE student_id = ?
        AND course_id = ?
    `;

    const [result] = await connection.query(deleteEnrollmentQuery, [
      studentId,
      courseId,
    ]);

    await connection.commit();

    return {
      success: result.affectedRows > 0,
      message:
        result.affectedRows > 0
          ? "Hủy tham gia khóa học thành công."
          : "Không tìm thấy đăng ký khóa học.",
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
},
};

module.exports = EnrollmentModel;