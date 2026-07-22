const db = require('../config/db');

const QuestionModel = {
  // getQuestions: async ({ teacherId, questionType, keyword }) => {
  //   let sql = `
  //     SELECT id, parent_id, teacher_id, content, question_type, is_correct, score_weight, created_at
  //     FROM questions
  //     WHERE teacher_id = ? AND parent_id IS NULL
  //   `;
  //   const params = [teacherId];

  //   // Lọc theo loại câu hỏi ('single', 'multiple', 'essay')
  //   if (questionType) {
  //     sql += ` AND question_type = ?`;
  //     params.push(questionType);
  //   }

  //   // Tìm kiếm từ khóa theo nội dung câu hỏi
  //   if (keyword) {
  //     sql += ` AND content LIKE ?`;
  //     params.push(`%${keyword}%`);
  //   }

  //   // Sắp xếp câu hỏi mới nhất lên đầu
  //   sql += ` ORDER BY created_at DESC`;

  //   const [rows] = await db.query(sql, params);
  //   return rows;
  // },
  getQuestions: async ({ teacherId, questionType, keyword, page = 1, limit = 10 }) => {
    // 1. Chuyển đổi page và limit về kiểu số nguyên
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    // 2. Tạo phần điều kiện WHERE chung
    let whereSql = ` WHERE teacher_id = ? AND parent_id IS NULL`;
    const params = [teacherId];

    if (questionType) {
      whereSql += ` AND question_type = ?`;
      params.push(questionType);
    }

    if (keyword) {
      whereSql += ` AND content LIKE ?`;
      params.push(`%${keyword}%`);
    }

    // 3. Đếm tổng số câu hỏi thỏa mãn điều kiện (Query 1)
    const countSql = `SELECT COUNT(*) AS total FROM questions ${whereSql}`;
    const [countRows] = await db.query(countSql, params);
    const totalItems = countRows[0]?.total || 0;

    // 4. Lấy danh sách câu hỏi theo trang (Query 2)
    // Lưu ý: LIMIT và OFFSET dùng chuỗi template thay vì placeholder (?) để tránh lỗi kiểu dữ liệu ở một số driver MySQL
    const dataSql = `
      SELECT id, parent_id, teacher_id, content, question_type, is_correct, score_weight, created_at
      FROM questions
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const [rows] = await db.query(dataSql, params);

    // 5. Trả về dữ liệu kèm thông tin phân trang
    return {
      data: rows,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limitNum),
        currentPage: pageNum,
        limit: limitNum,
      },
    };
  },
  getQuestionDetail: async (questionId, teacherId) => {
    // Lấy câu hỏi chính
    const [questions] = await db.query(
      `SELECT * FROM questions WHERE id = ? AND teacher_id = ?`,
      [questionId, teacherId]
    );

    if (!questions.length) return null;

    // Lấy danh sách các đáp án con
    const [answers] = await db.query(
      `SELECT id, content, is_correct, score_weight 
      FROM questions 
      WHERE parent_id = ?`,
      [questionId]
    );

    return {
      ...questions[0],
      answers
    };
  },
  createQuestionWithAnswers: async ({ teacherId, content, questionType, answers, imageIds = [] }) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Tạo câu hỏi chính
      const [questionResult] = await connection.query(
        `INSERT INTO questions (teacher_id, content, question_type) VALUES (?, ?, ?)`,
        [teacherId, content, questionType]
      );
      const questionId = questionResult.insertId;

      // 2. Tạo danh sách đáp án (nếu có)
      if (answers && answers.length > 0) {
        const answerValues = answers.map((ans) => [
          questionId,
          teacherId,
          ans.content,
          questionType,
          ans.is_correct ? 1 : 0
        ]);

        await connection.query(
          `INSERT INTO questions (parent_id, teacher_id, content, question_type, is_correct) VALUES ?`,
          [answerValues]
        );
      }

      // 3. Cập nhật liên kết các ID ảnh với questionId vừa tạo
      if (imageIds && imageIds.length > 0) {
        await connection.query(
          `UPDATE images 
          SET imageable_id = ? 
          WHERE id IN (?) AND imageable_type = 'question'`,
          [questionId, imageIds]
        );
      }

      await connection.commit();
      return questionId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
  updateQuestionWithAnswers: async ({ questionId, teacherId, content, questionType, answers = [], imageIds = [] }) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      // Xóa ảnh
      // 1. Lấy danh sách tất cả ảnh cũ đang thuộc về câu hỏi này
      const [oldImages] = await connection.query(
        `SELECT id, public_id FROM images WHERE imageable_type = 'question' AND imageable_id = ?`,
        [questionId]
      );

      // 2. Tách ra các ảnh không còn được dùng nữa (Ảnh bị xóa khỏi TinyMCE / Đáp án bị xóa)
      const imagesToDelete = oldImages.filter(img => !imageIds.includes(img.id));
      const deleteIds = imagesToDelete.map(img => img.id);

      // 3. Xóa các bản ghi ảnh thừa trong DB
      if (deleteIds.length > 0) {
        await connection.query(`DELETE FROM images WHERE id IN (?)`, [deleteIds]);
      }
      //Cập nhật câu hỏi
      // 1. Kiểm tra câu hỏi có tồn tại và thuộc về giáo viên này không
      const [existing] = await connection.query(
        `SELECT id FROM questions WHERE id = ? AND teacher_id = ? AND parent_id IS NULL`,
        [questionId, teacherId]
      );

      if (existing.length === 0) {
        await connection.rollback();
        return false; // Không tìm thấy hoặc không có quyền
      }

      // 2. Cập nhật câu hỏi chính
      await connection.query(
        `UPDATE questions SET content = ?, question_type = ? WHERE id = ?`,
        [content, questionType, questionId]
      );

      // 3. Xử lý danh sách đáp án con (nếu có)
      const incomingAnswerIds = answers
        .map((ans) => ans.id)
        .filter((id) => id && !isNaN(id)); // Lấy các ID đáp án cũ truyền lên

      // 3a. Xóa những đáp án không còn trong danh sách gửi lên
      if (incomingAnswerIds.length > 0) {
        await connection.query(
          `DELETE FROM questions WHERE parent_id = ? AND id NOT IN (?)`,
          [questionId, incomingAnswerIds]
        );
      } else {
        // Nếu gửi lên mảng rỗng hoặc toàn đáp án mới -> Xóa hết đáp án cũ
        await connection.query(
          `DELETE FROM questions WHERE parent_id = ?`,
          [questionId]
        );
      }

      // 3b. Cập nhật đáp án cũ & Thêm đáp án mới
      for (const ans of answers) {
        if (ans.id && !isNaN(ans.id)) {
          // Cập nhật đáp án đã tồn tại
          await connection.query(
            `UPDATE questions SET content = ?, is_correct = ? WHERE id = ? AND parent_id = ?`,
            [ans.content, ans.is_correct ? 1 : 0, ans.id, questionId]
          );
        } else {
          // Thêm đáp án mới
          await connection.query(
            `INSERT INTO questions (parent_id, teacher_id, content, question_type, is_correct) 
            VALUES (?, ?, ?, ?, ?)`,
            [questionId, teacherId, ans.content, questionType, ans.is_correct ? 1 : 0]
          );
        }
      }

      // 4. Cập nhật ảnh đính kèm mới (nếu có chèn ảnh mới qua TinyMCE)
      if (imageIds && imageIds.length > 0) {
        await connection.query(
          `UPDATE images 
          SET imageable_id = ? 
          WHERE id IN (?) AND imageable_type = 'question'`,
          [questionId, imageIds]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
  deleteQuestion: async (questionId, teacherId) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Kiểm tra câu hỏi có tồn tại và thuộc về giáo viên này không
      const [questions] = await connection.query(
        `SELECT id FROM questions WHERE id = ? AND teacher_id = ? AND parent_id IS NULL`,
        [questionId, teacherId]
      );

      if (questions.length === 0) {
        await connection.rollback();
        return null; // Không tìm thấy hoặc không có quyền
      }

      // 2. Lấy danh sách public_id các ảnh liên quan để xóa trên Cloudinary
      const [images] = await connection.query(
        `SELECT public_id FROM images WHERE imageable_type = 'question' AND imageable_id = ?`,
        [questionId]
      );

      // 3. Xóa các bản ghi ảnh trong DB
      await connection.query(
        `DELETE FROM images WHERE imageable_type = 'question' AND imageable_id = ?`,
        [questionId]
      );

      // 4. Xóa câu hỏi chính (Cơ sở dữ liệu tự động xóa các đáp án con nhờ ON DELETE CASCADE)
      await connection.query(
        `DELETE FROM questions WHERE id = ?`,
        [questionId]
      );

      await connection.commit();

      // 5. Xóa thực tế các ảnh trên Cloudinary sau khi DB commit thành công
      for (const img of images) {
        deleteImage(img.public_id).catch((err) =>
          console.error(`Lỗi xóa ảnh Cloudinary (${img.public_id}):`, err)
        );
      }

      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = QuestionModel;