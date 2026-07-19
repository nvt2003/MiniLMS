const db = require('../config/db');

const ProgressModel = {
  // 1. Đánh dấu một bài học là ĐÃ HOÀN THANH (hoặc cập nhật lại)
  markAsComplete: async (studentId, lessonId) => {
    const query = `
      INSERT INTO lesson_progress (student_id, lesson_id, is_completed)
      VALUES (?, ?, true)
      ON DUPLICATE KEY UPDATE is_completed = true
    `;
    const [result] = await db.query(query, [studentId, lessonId]);
    return result.affectedRows > 0;
  },
  
  // 2. Tính toán % tiến độ hoàn thành của học viên trong một khóa học cụ thể
  getCourseProgress: async (studentId, courseId) => {
    // Đếm tổng số bài học của khóa
    const [totalLessonsRows] = await db.query('SELECT COUNT(id) as total FROM lessons WHERE course_id = ?', [courseId]);
    const totalLessons = totalLessonsRows[0].total;

    if (totalLessons === 0) return 0; // Khóa học chưa có bài nào thì coi như 0%

    // Đếm số bài học học viên đã hoàn thành trong khóa đó
    const completedQuery = `
      SELECT COUNT(lp.id) as completed
      FROM lesson_progress lp
      JOIN lessons l ON lp.lesson_id = l.id
      WHERE lp.student_id = ? AND l.course_id = ? AND lp.is_completed = true
    `;
    const [completedRows] = await db.query(completedQuery, [studentId, courseId]);
    const completedLessons = completedRows[0].completed;

    // Tính phần trăm
    const percentage = (completedLessons / totalLessons) * 100;
    return Math.round(percentage); // Trả về số nguyên như 33, 50, 100
  },
  getCompletedLessonIdsByCourse: async (studentId, courseId) => {
  const query = `
    SELECT lp.lesson_id
    FROM lesson_progress lp
    JOIN lessons l ON lp.lesson_id = l.id
    WHERE lp.student_id = ?
      AND l.course_id = ?
      AND lp.is_completed = true
  `;

  const [rows] = await db.query(query, [studentId, courseId]);

  return rows.map(row => row.lesson_id);
},
};

module.exports = ProgressModel;