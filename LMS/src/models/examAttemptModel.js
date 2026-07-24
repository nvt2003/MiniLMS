const db = require('../config/db');

const ExamAttemptModel = {
  // Tìm đề thi theo ID
  findExamById: async (examId) => {
    const [rows] = await db.query(
      `SELECT id, course_id, title, duration_minutes, is_public 
       FROM exams 
       WHERE id = ?`,
      [examId]
    );
    return rows[0];
  },

  // Kiểm tra học sinh đã đăng ký khóa học chưa
  checkEnrollment: async (studentId, courseId) => {
    const [rows] = await db.query(
      `SELECT id FROM enrollments 
       WHERE student_id = ? AND course_id = ?`,
      [studentId, courseId]
    );
    return rows.length > 0;
  },

  // Tìm lượt làm bài đang dở
  findActiveAttempt: async (examId, studentId) => {
    const [rows] = await db.query(
      `SELECT id, start_time, status 
       FROM exam_attempts 
       WHERE exam_id = ? AND student_id = ? AND status = 'in_progress'`,
      [examId, studentId]
    );
    return rows[0];
  },

  // Tạo lượt làm bài mới
  createAttempt: async (examId, studentId) => {
    const now = new Date();
    const [result] = await db.query(
      `INSERT INTO exam_attempts (exam_id, student_id, start_time, status) 
       VALUES (?, ?, ?, 'in_progress')`,
      [examId, studentId, now]
    );

    return {
      id: result.insertId,
      exam_id: examId,
      student_id: studentId,
      start_time: now,
      status: 'in_progress'
    };
  },
  // Lấy lượt làm bài + phương thức chấm
  getAttemptWithExam: async (attemptId, studentId) => {
    const [rows] = await db.query(
      `SELECT ea.id, ea.exam_id, e.grading_method 
       FROM exam_attempts ea 
       JOIN exams e ON ea.exam_id = e.id 
       WHERE ea.id = ? AND ea.student_id = ? AND ea.status = 'in_progress'`,
      [attemptId, studentId]
    );
    return rows[0];
  },

  // Lấy đáp án đúng & điểm từng câu trong đề
  getExamQuestionsDetails: async (examId) => {
    const [rows] = await db.query(
      `SELECT 
        eq.question_id, 
        eq.points, 
        q.question_type, 
        -- Gom các ID đáp án đúng thành dạng chuỗi "1,2,6"
        GROUP_CONCAT(q_correct.id ORDER BY q_correct.id ASC SEPARATOR ',') AS correct_option_id
      FROM exam_questions eq
      JOIN questions q ON eq.question_id = q.id
      LEFT JOIN questions q_correct ON q_correct.parent_id = q.id AND q_correct.is_correct = 1
      WHERE eq.exam_id = ?
      GROUP BY 
        eq.question_id, 
        eq.points, 
        q.question_type`,
      [examId]
    );
    return rows;
  },

  // Lưu đáp án & Cập nhật kết quả bài thi
  submitExamTransaction: async (attemptId, answers, totalScore, status) => {
    if (answers.length > 0) {
      const values = answers.map(a => {
        let selectedOptStr = null;

        // Nếu là dạng multiple (mảng nhiều option_id)
        if (Array.isArray(a.selected_option_ids) && a.selected_option_ids.length > 0) {
          selectedOptStr = a.selected_option_ids.join(',');
        } 
        // Nếu là dạng single (1 option_id)
        else if (a.selected_option_id) {
          selectedOptStr = String(a.selected_option_id);
        }

        return [
          attemptId,
          a.question_id,
          selectedOptStr,
          a.essay_answer || null,
          a.score_given
        ];
      });

      await db.query(
        `INSERT INTO student_answers (attempt_id, question_id, selected_option_id, essay_answer, score_given) VALUES ?`,
        [values]
      );
    }

    await db.query(
      `UPDATE exam_attempts SET submit_time = NOW(), total_score = ?, status = ? WHERE id = ?`,
      [totalScore, status, attemptId]
    );
  },
  getQuestionAnswer: async (questionId) => {
    const [rows] = await db.query(
      `SELECT q.id AS question_id, q.question_type,
              GROUP_CONCAT(q_correct.id) AS correct_option_ids
       FROM questions q
       LEFT JOIN questions q_correct ON q_correct.parent_id = q.id AND q_correct.is_correct = 1
       WHERE q.id = ?
       GROUP BY q.id, q.question_type`,
      [questionId]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      ...row,
      correct_option_ids: row.correct_option_ids 
        ? row.correct_option_ids.split(',').map(Number) 
        : []
    };
  },
  // Lấy chi tiết lượt làm bài kèm các câu trả lời, đáp án đúng & nhận xét
  getAttemptResult: async (attemptId, studentId) => {
    // 1. Lấy thông tin chung của bài thi
    const [attemptRows] = await db.query(
      `SELECT ea.id AS attempt_id, ea.exam_id, e.title AS exam_title, 
              ea.start_time, ea.submit_time, ea.total_score, ea.status
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.id
       WHERE ea.id = ? AND ea.student_id = ?`,
      [attemptId, studentId]
    );

    if (attemptRows.length === 0) return null;

    // 2. Lấy chi tiết các câu hỏi, câu trả lời của sinh viên, đáp án đúng và điểm/nhận xét
    // const [detailsRows] = await db.query(
    //   `SELECT 
    //      sa.question_id,
    //      q.content AS question_content,
    //      q.question_type,
    //      eq.points AS max_points,
    //      sa.selected_option_id,
    //      sa.essay_answer,
    //      sa.score_given,
    //      sa.teacher_comment,
    //      q_correct.id AS correct_option_id
    //    FROM student_answers sa
    //    JOIN questions q ON sa.question_id = q.id
    //    JOIN exam_questions eq ON eq.exam_id = ? AND eq.question_id = q.id
    //    LEFT JOIN questions q_correct ON q_correct.parent_id = q.id AND q_correct.is_correct = 1
    //    WHERE sa.attempt_id = ?`,
    //   [attemptRows[0].exam_id, attemptId]
    // );
    const [detailsRows] = await db.query(
      `SELECT 
        q.id AS question_id,
        q.content,
        q.question_type,
        eq.points AS max_points,
        sa.essay_answer,
        sa.score_given,
        sa.teacher_comment,
        CASE 
    WHEN q.question_type = 'essay' THEN NULL
    ELSE 
      IF(
        SUM(CASE WHEN opt.is_correct = 1 AND FIND_IN_SET(opt.id, sa.selected_option_id) > 0 THEN 1 ELSE 0 END) 
        = SUM(CASE WHEN opt.is_correct = 1 THEN 1 ELSE 0 END)
        AND 
        SUM(CASE WHEN opt.is_correct = 0 AND FIND_IN_SET(opt.id, sa.selected_option_id) > 0 THEN 1 ELSE 0 END) = 0,
        1, 0
      )
  END AS is_correct,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'question_id', opt.id,
            'content', opt.content,
            'is_correct', opt.is_correct,
            'is_choice', IF(sa.selected_option_id = opt.id, 1, 0)
          )
        ) AS answers
      FROM student_answers sa
      JOIN questions q ON sa.question_id = q.id
      JOIN exam_questions eq ON eq.exam_id = ? AND eq.question_id = q.id
      LEFT JOIN questions opt ON opt.parent_id = q.id
      WHERE sa.attempt_id = ?
      GROUP BY q.id, q.content, q.question_type, eq.points, sa.essay_answer, sa.score_given, sa.teacher_comment`,
      [attemptRows[0].exam_id, attemptId]
    );

    const formattedResult = detailsRows.map(row => ({
      ...row,
      answers: typeof row.answers === 'string' ? JSON.parse(row.answers) : row.answers
    }));

    return {
  ...attemptRows[0],
  answers: formattedResult
    };
  },
  countByStudentId: async (studentId) => {
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total 
       FROM exam_attempts 
       WHERE student_id = ?`,
      [studentId]
    );
    return total;
  },
  findWithFilters: async (studentId, { search = '', sortBy = 'newest', limit = 5, offset = 0 }) => {
    let orderByClause = 'ORDER BY ea.created_at DESC'; // Mặc định: mới nhất

    switch (sortBy) {
      case 'oldest':
        orderByClause = 'ORDER BY ea.created_at ASC';
        break;
      case 'score_desc':
        orderByClause = 'ORDER BY ea.total_score DESC';
        break;
      case 'score_asc':
        orderByClause = 'ORDER BY ea.total_score ASC';
        break;
    }

    const queryParams = [studentId, `%${search}%`, Number(limit), Number(offset)];

    const [rows] = await db.query(
      `SELECT 
         ea.id AS attempt_id,
         e.id AS exam_id,
         e.title AS exam_title,
         e.type AS exam_type,
         ea.start_time,
         ea.submit_time,
         ea.total_score,
         ea.status
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.id
       WHERE ea.student_id = ? AND e.title LIKE ?
       ${orderByClause}
       LIMIT ? OFFSET ?`,
      queryParams
    );

    return rows;
  }
};

module.exports = ExamAttemptModel;