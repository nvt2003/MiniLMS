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
      `SELECT eq.question_id, eq.points, q.question_type, q_correct.id AS correct_option_id
       FROM exam_questions eq
       JOIN questions q ON eq.question_id = q.id
       LEFT JOIN questions q_correct ON q_correct.parent_id = q.id AND q_correct.is_correct = 1
       WHERE eq.exam_id = ?`,
      [examId]
    );
    return rows;
  },

  // Lưu đáp án sinh viên & Cập nhật bài thi
  // submitExamTransaction: async (attemptId, answers, totalScore, status) => {
  //   if (answers.length > 0) {
  //     const values = answers.map(a => [attemptId, a.question_id, a.selected_option_id || null, a.essay_answer || null, a.score_given]);
  //     await db.query(`INSERT INTO student_answers (attempt_id, question_id, selected_option_id, essay_answer, score_given) VALUES ?`, [values]);
  //   }
  //   await db.query(`UPDATE exam_attempts SET submit_time = NOW(), total_score = ?, status = ? WHERE id = ?`, [totalScore, status, attemptId]);
  // },
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
  // Lấy đáp án đúng của 1 câu hỏi
  // getQuestionAnswer: async (questionId) => {
  //   const [rows] = await db.query(
  //     `SELECT q.id AS question_id, q.question_type, q_correct.id AS correct_option_id
  //      FROM questions q
  //      LEFT JOIN questions q_correct ON q_correct.parent_id = q.id AND q_correct.is_correct = 1
  //      WHERE q.id = ?`,
  //     [questionId]
  //   );
  //   return rows[0];
  // },
  // Lấy chi tiết đáp án đúng của câu hỏi phục vụ kiểm tra Practice
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
    const [detailsRows] = await db.query(
      `SELECT 
         sa.question_id,
         q.content AS question_content,
         q.question_type,
         eq.points AS max_points,
         sa.selected_option_id,
         sa.essay_answer,
         sa.score_given,
         sa.teacher_comment,
         q_correct.id AS correct_option_id
       FROM student_answers sa
       JOIN questions q ON sa.question_id = q.id
       JOIN exam_questions eq ON eq.exam_id = ? AND eq.question_id = q.id
       LEFT JOIN questions q_correct ON q_correct.parent_id = q.id AND q_correct.is_correct = 1
       WHERE sa.attempt_id = ?`,
      [attemptRows[0].exam_id, attemptId]
    );

    return {
      ...attemptRows[0],
      answers: detailsRows.map(row => ({
        ...row,
        is_correct: row.question_type !== 'essay' && row.selected_option_id 
          ? Number(row.selected_option_id) === Number(row.correct_option_id) 
          : null
      }))
    };
  }
};

module.exports = ExamAttemptModel;