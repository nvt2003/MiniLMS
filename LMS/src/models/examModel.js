const db = require('../config/db'); 

const ExamModel = {
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
  // Lấy chi tiết đề thi kèm câu hỏi & đáp án đầy đủ (Dành cho Giáo viên/Admin xem & sửa)
  getExamDetailForPractice: async (examId) => {
    // 1. Lấy thông tin chung của đề thi
    const [examRows] = await db.query(
      `SELECT e.*, u.name AS creator_name, c.title AS course_title
       FROM exams e
       LEFT JOIN users u ON e.creator_id = u.id
       LEFT JOIN courses c ON e.course_id = c.id
       WHERE e.id = ?`,
      [examId]
    );

    if (examRows.length === 0) return null;
    
    // Nếu không phải bài practice thì ngắt luôn hoặc từ chối trả về is_correct
    if (examRows[0].type !== 'practice') {
      throw new Error("Hàm này chỉ dùng cho đề luyện tập (Practice)!");
    }

    // 2. Lấy danh sách câu hỏi chính trong đề thi
    const [questions] = await db.query(
      `SELECT eq.id AS exam_question_id, eq.position, eq.points, 
              q.id AS question_id, q.content, q.question_type, q.parent_id
       FROM exam_questions eq
       JOIN questions q ON eq.question_id = q.id
       WHERE eq.exam_id = ?
       ORDER BY eq.position ASC`,
      [examId]
    );

    if (questions.length === 0) {
      return { ...examRows[0], questions: [] };
    }

    // 3. Lấy tất cả phương án lựa chọn (bao gồm cả is_correct) để đổ vào form Edit
    const questionIds = questions.map((q) => q.question_id);
    const [options] = await db.query(
      `SELECT id, parent_id, content, is_correct 
       FROM questions 
       WHERE parent_id IN (?)`,
      [questionIds]
    );

    // 4. Gom nhóm options vào đúng câu hỏi tương ứng
    const questionsWithOptions = questions.map((q) => ({
      ...q,
      options: options.filter((opt) => Number(opt.parent_id) === Number(q.question_id))
    }));

    return { ...examRows[0], questions: questionsWithOptions };
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
  
  addQuestionsToExam: async (examId, questions) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Xóa toàn bộ câu hỏi cũ của đề thi này
      await connection.query('DELETE FROM exam_questions WHERE exam_id = ?', [examId]);

      // 2. Thêm lại danh sách câu hỏi mới
      const values = questions.map((q) => [
        examId,
        q.question_id,
        q.position,
        q.points
      ]);

      if (values.length > 0) {
        await connection.query(
          'INSERT INTO exam_questions (exam_id, question_id, position, points) VALUES ?',
          [values]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
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
  // Cập nhật thông tin đề thi
updateExam: async (examId, examData) => {
  const {
    course_id,
    title,
    description,
    type = 'practice',
    grading_method = 'auto',
    duration_minutes = 0,
    is_public = 0
  } = examData;

  const [result] = await db.query(
      `UPDATE exams 
      SET course_id = ?, 
          title = ?, 
          description = ?, 
          type = ?, 
          grading_method = ?, 
          duration_minutes = ?, 
          is_public = ?
      WHERE id = ?`,
      [
        course_id || null,
        title,
        description || null,
        type,
        grading_method,
        duration_minutes,
        is_public,
        examId
      ]
    );

    return result.affectedRows > 0;
  },
  // Xóa đề thi
  deleteExam: async (examId) => {
    const [result] = await db.query(
      `DELETE FROM exams WHERE id = ?`,
      [examId]
    );

    return result.affectedRows > 0;
  },
  // Lấy chi tiết đề thi kèm câu hỏi & các phương án lựa chọn (Đã ẩn is_correct để bảo mật)
  getExamForStudent: async (examId) => {
    // 1. Lấy thông tin chung đề thi
    const [examRows] = await db.query(
      `SELECT e.*, u.name AS creator_name, c.title AS course_title
       FROM exams e
       LEFT JOIN users u ON e.creator_id = u.id
       LEFT JOIN courses c ON e.course_id = c.id
       WHERE e.id = ?`,
      [examId]
    );

    if (examRows.length === 0) return null;

    // 2. Lấy danh sách câu hỏi chính của đề thi
    const [questions] = await db.query(
      `SELECT eq.id AS exam_question_id, eq.position, eq.points, 
              q.id AS question_id, q.content, q.question_type
       FROM exam_questions eq
       JOIN questions q ON eq.question_id = q.id
       WHERE eq.exam_id = ?
       ORDER BY eq.position ASC`,
      [examId]
    );

    if (questions.length === 0) {
      return { ...examRows[0], questions: [] };
    }

    // 3. Lấy danh sách các phương án (Options)
    const questionIds = questions.map((q) => q.question_id);
    const [options] = await db.query(
      `SELECT id, parent_id, content 
       FROM questions 
       WHERE parent_id IN (?)`,
      [questionIds]
    );

    // 4. Ghép danh sách options vào đúng từng câu hỏi tương ứng
    const questionsWithOptions = questions.map((q) => ({
      ...q,
      options: options.filter((opt) => opt.parent_id === q.question_id),
    }));

    return { ...examRows[0], questions: questionsWithOptions };
  },
};

module.exports = ExamModel;