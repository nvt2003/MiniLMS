const db = require('../config/db'); // Đường dẫn kết nối db của bạn

const GradingModel = {
  // Lấy danh sách lượt làm bài đang chờ chấm (status = 'submitted')
  getPendingGradingList: async (teacherId) => {
    // Nếu muốn lọc danh sách các bài thi do chính giáo viên đó tạo (creator_id = teacherId):
    const [rows] = await db.query(
      `SELECT 
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
       WHERE ea.status = 'submitted' AND e.creator_id = ?
       ORDER BY ea.submit_time ASC`,
      [teacherId]
    );

    return rows;
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
  }
};

module.exports = GradingModel;