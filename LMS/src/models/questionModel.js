const db = require('../config/db');

const QuestionModel = {
  getQuestions: async ({ teacherId, questionType, keyword }) => {
    let sql = `
      SELECT id, parent_id, teacher_id, content, question_type, is_correct, score_weight, created_at
      FROM questions
      WHERE teacher_id = ? AND parent_id IS NULL
    `;
    const params = [teacherId];

    // Lọc theo loại câu hỏi ('single', 'multiple', 'essay')
    if (questionType) {
      sql += ` AND question_type = ?`;
      params.push(questionType);
    }

    // Tìm kiếm từ khóa theo nội dung câu hỏi
    if (keyword) {
      sql += ` AND content LIKE ?`;
      params.push(`%${keyword}%`);
    }

    // Sắp xếp câu hỏi mới nhất lên đầu
    sql += ` ORDER BY created_at DESC`;

    const [rows] = await db.query(sql, params);
    return rows;
  }
};

module.exports = QuestionModel;