const db = require('../config/db'); // Đường dẫn kết nối db của bạn

const GradingModel = {
  // Lấy danh sách lượt làm bài đang chờ chấm (status = 'submitted')
  getPendingGradingList: async (teacherId, options = {}) => {
    const { page = 1, limit = 5, exam_id, sort = 'submit_time_desc' } = options;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, parseInt(limit, 10) || 5);
    const offset = (parsedPage - 1) * parsedLimit;

    // Build câu truy vấn động dựa trên tham số filter
    let whereConditions = ["ea.status = 'submitted'", "e.creator_id = ?"];
    let params = [teacherId];

    // Lọc theo exam_id nếu có
    if (exam_id) {
      whereConditions.push("ea.exam_id = ?");
      params.push(parseInt(exam_id, 10));
    }

    const whereClause = whereConditions.join(" AND ");

    // Xử lý Sắp xếp (Sort)
    let orderBy = "ea.submit_time DESC";
    switch (sort) {
      case 'submit_time_asc':
        orderBy = "ea.submit_time ASC";
        break;
      case 'start_time_desc':
        orderBy = "ea.start_time DESC";
        break;
      case 'start_time_asc':
        orderBy = "ea.start_time ASC";
        break;
      case 'submit_time_desc':
      default:
        orderBy = "ea.submit_time DESC";
        break;
    }

    // 1. Đếm tổng số bài thỏa mãn điều kiện lọc
    const countSql = `
      SELECT COUNT(*) AS total
      FROM exam_attempts ea
      JOIN exams e ON ea.exam_id = e.id
      WHERE ${whereClause}
    `;
    const [countRows] = await db.query(countSql, params);
    const totalItems = countRows[0].total;

    // 2. Truy vấn dữ liệu có Phân trang + Sắp xếp + Lọc
    const querySql = `
      SELECT 
        ea.id AS attempt_id,
        ea.exam_id,
        e.title AS exam_title,
        ea.student_id,
        u.name AS student_name,
        u.email AS student_email,
        ea.start_time,
        ea.submit_time,
        ea.status
      FROM exam_attempts ea
      JOIN exams e ON ea.exam_id = e.id
      JOIN users u ON ea.student_id = u.id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(querySql, [...params, parsedLimit, offset]);

    return {
      items: rows,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total_items: totalItems,
        total_pages: Math.ceil(totalItems / parsedLimit) || 1
      }
    };
  },
  // Cập nhật điểm & nhận xét từng câu tự luận
  gradeEssayQuestion: async (answerId, score, comment) => {
    await db.query(
      `UPDATE student_answers 
       SET score_given = ?, teacher_comment = ? 
       WHERE id = ?`,
      [score, comment, answerId]
    );
  },

  // Cập nhật tổng điểm bài thi và chuyển trạng thái sang 'graded'
  updateAttemptTotalScore: async (attemptId) => {
    // Tính tổng điểm từ các câu hỏi
    const [rows] = await db.query(
      `SELECT SUM(score_given) AS total_score 
       FROM student_answers 
       WHERE attempt_id = ?`,
      [attemptId]
    );

    const totalScore = rows[0].total_score || 0;

    await db.query(
      `UPDATE exam_attempts 
       SET total_score = ?, status = 'graded' 
       WHERE id = ?`,
      [totalScore, attemptId]
    );

    return totalScore;
  },
    // Thêm vào GradingModel
    finishGrading: async (attemptId) => {
    // Tính tổng điểm tất cả các câu trả lời của lượt thi
    const [rows] = await db.query(
        `SELECT SUM(score_given) AS total_score 
        FROM student_answers 
        WHERE attempt_id = ?`,
        [attemptId]
    );

    const totalScore = rows[0].total_score || 0;

    // Cập nhật tổng điểm và đổi status sang 'graded'
    await db.query(
        `UPDATE exam_attempts 
        SET total_score = ?, status = 'graded' 
        WHERE id = ?`,
        [totalScore, attemptId]
    );

    return totalScore;
    },
    //Thống kê điểm trung bình của cả lớp cho đề thi này
  getClassExamStats: async (courseId, examId) => {
    const [rows] = await db.query(
      `SELECT 
        COUNT(ea.id) AS total_submitted,
        ROUND(AVG(ea.total_score), 2) AS average_score
       FROM exam_attempts ea
       JOIN enrollments e ON ea.student_id = e.student_id
       WHERE e.course_id = ? AND ea.exam_id = ? AND ea.status = 'graded'`,
      [courseId, examId]
    );

    return rows[0];
  },

  //Danh sách tất cả học sinh trong khóa học kèm điểm số & thời gian nộp
  getStudentScoresByExam: async (courseId, examId) => {
    const [rows] = await db.query(
      `SELECT 
        u.id AS student_id,
        u.name AS student_name,
        u.email AS student_email,
        ea.id AS attempt_id,
        ea.total_score,
        ea.submit_time,
        IFNULL(ea.status, 'not_started') AS status
       FROM enrollments en
       JOIN users u ON en.student_id = u.id
       LEFT JOIN exam_attempts ea ON ea.student_id = u.id AND ea.exam_id = ?
       WHERE en.course_id = ?
       ORDER BY u.name ASC`,
      [examId, courseId]
    );

    return rows;
  },
  getAttemptDetail: async (attemptId) => {
    // 1. Lấy thông tin chung của bài nộp
    const [attemptRows] = await db.query(
      `SELECT ea.id AS attempt_id, e.title AS exam_title, u.name AS student_name, ea.status
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.id
       JOIN users u ON ea.student_id = u.id
       WHERE ea.id = ?`,
      [attemptId]
    );

    if (attemptRows.length === 0) return null;

    // 2. Lấy danh sách câu hỏi và câu trả lời
    const [answerRows] = await db.query(
      `SELECT 
        sa.id AS answer_id, 
        q.content AS question_content, 
        q.question_type, 
        q.score_weight AS max_score, 
        sa.essay_answer, 
        sa.score_given, 
        sa.teacher_comment
       FROM student_answers sa
       JOIN questions q ON sa.question_id = q.id
       WHERE sa.attempt_id = ? AND q.question_type = 'essay'`,
      [attemptId]
    );

    return {
      ...attemptRows[0],
      answers: answerRows
    };
  }
};

module.exports = GradingModel;