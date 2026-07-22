const db = require('../config/db'); 

const ExamModel = {
  // // Lấy danh sách đề thi do giáo viên tạo HOẶC các đề được công khai (is_public = 1)
  // getTeacherExams: async (teacherId) => {
  //   const [rows] = await db.query(
  //     `SELECT 
  //       e.id, 
  //       e.course_id, 
  //       e.creator_id, 
  //       u.name AS creator_name,
  //       e.title, 
  //       e.description, 
  //       e.type, 
  //       e.grading_method, 
  //       e.duration_minutes, 
  //       e.is_public, 
  //       e.created_at
  //      FROM exams e
  //      JOIN users u ON e.creator_id = u.id
  //      WHERE (e.creator_id = ? OR e.is_public = 1)
  //      ORDER BY e.created_at DESC`,
  //     [teacherId]
  //   );

  //   return rows;
  // },
  // Lấy danh sách đề thi kèm lọc & phân trang
  getTeacherExams: async ({ teacherId, search, type, is_public, course_id, page = 1, limit = 10 }) => {
    const offset = (page - 1) * limit;
    const whereConditions = ['(e.creator_id = ? OR e.is_public = 1)'];
    const params = [teacherId];

    // Lọc theo từ khóa tiêu đề
    if (search) {
      whereConditions.push('e.title LIKE ?');
      params.push(`%${search}%`);
    }

    // Lọc theo loại đề (practice / test)
    if (type) {
      whereConditions.push('e.type = ?');
      params.push(type);
    }

    // Lọc theo trạng thái công khai (1 / 0)
    if (is_public !== undefined && is_public !== '') {
      whereConditions.push('e.is_public = ?');
      params.push(is_public);
    }

    // Lọc theo khóa học
    if (course_id) {
      whereConditions.push('e.course_id = ?');
      params.push(course_id);
    }

    const whereClause = whereConditions.join(' AND ');

    // 1. Đếm tổng số bản ghi
    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM exams e WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    // 2. Lấy dữ liệu phân trang
    const queryParams = [...params, parseInt(limit), parseInt(offset)];
    const [rows] = await db.query(
      `SELECT 
        e.id, e.course_id, c.title AS course_title, e.creator_id, u.name AS creator_name,
        e.title, e.description, e.type, e.grading_method, e.duration_minutes, e.is_public, e.created_at
       FROM exams e
       JOIN users u ON e.creator_id = u.id
       LEFT JOIN courses c ON e.course_id = c.id
       WHERE ${whereClause}
       ORDER BY e.created_at DESC
       LIMIT ? OFFSET ?`,
      queryParams
    );

    return {
      exams: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  },
  // Lấy chi tiết đề thi kèm danh sách câu hỏi
  getExamDetail: async (examId) => {
    const [examRows] = await db.query(
      `SELECT e.*, u.name AS creator_name, c.title AS course_title
       FROM exams e
       LEFT JOIN users u ON e.creator_id = u.id
       LEFT JOIN courses c ON e.course_id = c.id
       WHERE e.id = ?`,
      [examId]
    );

    if (examRows.length === 0) return null;

    const [questions] = await db.query(
      `SELECT eq.id AS exam_question_id, eq.position, eq.points, 
              q.id AS question_id, q.content, q.question_type, q.parent_id
       FROM exam_questions eq
       JOIN questions q ON eq.question_id = q.id
       WHERE eq.exam_id = ?
       ORDER BY eq.position ASC`,
      [examId]
    );

    return { ...examRows[0], questions };
  },
  // Tạo đề thi mới
  createExam: async (examData) => {
    const {
      course_id,
      creator_id,
      title,
      description,
      type = 'practice',
      grading_method = 'auto',
      duration_minutes = 0,
      is_public = 0
    } = examData;

    const [result] = await db.query(
      `INSERT INTO exams (course_id, creator_id, title, description, type, grading_method, duration_minutes, is_public)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [course_id || null, creator_id, title, description || null, type, grading_method, duration_minutes, is_public]
    );

    return result.insertId;
  },
  // Thêm danh sách câu hỏi vào đề thi (Transaction để đảm bảo toàn vẹn dữ liệu)
  addQuestionsToExam: async (examId, questions) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const values = questions.map((q, index) => [
        examId,
        q.question_id,
        q.position || index + 1,
        q.points || 1.00
      ]);

      await connection.query(
        `INSERT INTO exam_questions (exam_id, question_id, position, points)
         VALUES ?
         ON DUPLICATE KEY UPDATE position = VALUES(position), points = VALUES(points)`,
        [values]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
  // Cập nhật thông tin đề thi
  updateExam: async (examId, examData) => {
    const {
      title,
      description,
      type,
      grading_method,
      duration_minutes,
      is_public,
      course_id
    } = examData;

    const [result] = await db.query(
      `UPDATE exams 
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           type = COALESCE(?, type),
           grading_method = COALESCE(?, grading_method),
           duration_minutes = COALESCE(?, duration_minutes),
           is_public = COALESCE(?, is_public),
           course_id = COALESCE(?, course_id)
       WHERE id = ?`,
      [title, description, type, grading_method, duration_minutes, is_public, course_id, examId]
    );

    return result.affectedRows > 0;
  },
  // Nhân bản đề thi (Copy đề thi & câu hỏi liên kết trong transaction)
  copyExam: async (originalExam, newCreatorId) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Tạo đề thi mới từ thông tin đề gốc (gán creator_id = giáo viên hiện tại)
      const [examResult] = await connection.query(
        `INSERT INTO exams (course_id, creator_id, title, description, type, grading_method, duration_minutes, is_public)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          originalExam.course_id || null,
          newCreatorId,
          `${originalExam.title} (Bản sao)`,
          originalExam.description,
          originalExam.type,
          originalExam.grading_method,
          originalExam.duration_minutes
        ]
      );

      const newExamId = examResult.insertId;

      // 2. Sao chép toàn bộ danh sách câu hỏi từ đề gốc sang đề mới
      await connection.query(
        `INSERT INTO exam_questions (exam_id, question_id, position, points)
         SELECT ?, question_id, position, points
         FROM exam_questions
         WHERE exam_id = ?`,
        [newExamId, originalExam.id]
      );

      await connection.commit();
      return newExamId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
  // Xóa đề thi
  deleteExam: async (examId) => {
    const [result] = await db.query(
      `DELETE FROM exams WHERE id = ?`,
      [examId]
    );

    return result.affectedRows > 0;
  },
};

module.exports = ExamModel;