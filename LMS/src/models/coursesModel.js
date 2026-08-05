const db = require('../config/db');
const { getEmbedding } =require('../utils/embedding.js');
const { cosineSimilarity } = require('../utils/math.js');

const CourseModel = {
  // 1. Lấy tất cả khóa học kèm tên giảng viên tạo
  getAll: async () => {
    const query = `
      SELECT c.*, u.name as teacher_name 
      FROM courses c
      JOIN users u ON c.teacher_id = u.id
      ORDER BY c.created_at DESC
    `;
    const [rows] = await db.query(query);
    return rows;
  },
  getDetailWithLessons: async (courseId) => {
    // 1. Lấy thông tin khóa học
    const courseQuery = `
      SELECT c.*, u.name as teacher_name 
      FROM courses c
      JOIN users u ON c.teacher_id = u.id
      WHERE c.id = ?
    `;
    const [courses] = await db.query(courseQuery, [courseId]);
    if (courses.length === 0) return null;

    const course = courses[0];

    // 2. Chạy đồng thời các query lấy lessons và exams để tối ưu hiệu năng
    const [lessonsResult, examsResult] = await Promise.all([
      db.query(
        'SELECT id, title, video_url, position, thumbnail_url FROM lessons WHERE course_id = ? ORDER BY position ASC',
        [courseId]
      ),
      db.query(
        'SELECT id, title, description, type, grading_method, duration_minutes, is_public, created_at FROM exams WHERE course_id = ? ORDER BY id DESC',
        [courseId]
      )
    ]);

    // 3. Gán kết quả vào object course
    course.lessons = lessonsResult[0];
    course.exams = examsResult[0];

    return course;
},


  create: async (teacherId, title, description, thumbnailUrl) => {
    // 1. Tạo chuỗi văn bản gộp từ title và description để sinh vector
    const textToEmbed = `${title || ''}. ${description || ''}`.trim();
    
    // 2. Gọi Hugging Face lấy Vector
    const vector = await getEmbedding(textToEmbed);
    const embeddingJson = vector ? JSON.stringify(vector) : null;

    // 3. Thêm vào MySQL
    const [result] = await db.query(
      `INSERT INTO courses (teacher_id, title, description, thumbnail_url, embedding) 
       VALUES (?, ?, ?, ?, ?)`,
      [teacherId, title, description, thumbnailUrl, embeddingJson]
    );

    return result.insertId;
  },

  update: async (courseId, title, description, thumbnailUrl) => {
    // 1. Tạo chuỗi văn bản gộp mới để sinh vector mới
    const textToEmbed = `${title || ''}. ${description || ''}`.trim();

    // 2. Gọi Hugging Face cập nhật lại Vector
    const vector = await getEmbedding(textToEmbed);
    const embeddingJson = vector ? JSON.stringify(vector) : null;

    // 3. Cập nhật vào MySQL
    const [result] = await db.query(
      `UPDATE courses
       SET title = ?, description = ?, thumbnail_url = ?, embedding = ?
       WHERE id = ?`,
      [title, description, thumbnailUrl, embeddingJson, courseId]
    );

    return result.affectedRows;
  },
  // 4. Xóa khóa học (Vì có ON DELETE CASCADE ở DB nên bài học liên quan sẽ tự động mất)
  delete: async (id) => {
    const [result] = await db.query('DELETE FROM courses WHERE id = ?', [id]);
    return result.affectedRows > 0; // Trả về true nếu xóa thành công
  },
  //seach in db
  // searchAndFilter: async ({ search, teacherId, page, limit }) => {
  //   let query = `
  //     SELECT c.*, u.name AS teacher_name
  //     FROM courses c
  //     JOIN users u ON c.teacher_id = u.id
  //     WHERE 1 = 1
  //   `;

  //   let countQuery = `
  //     SELECT COUNT(*) AS total
  //     FROM courses c
  //     WHERE 1 = 1
  //   `;

  //   const params = [];
  //   const countParams = [];

  //   if (search) {
  //     query += ` AND (c.title LIKE ? OR c.description LIKE ?)`;
  //     countQuery += ` AND (c.title LIKE ? OR c.description LIKE ?)`;

  //     params.push(`%${search}%`, `%${search}%`);
  //     countParams.push(`%${search}%`, `%${search}%`);
  //   }

  //   if (teacherId) {
  //     query += ` AND c.teacher_id = ?`;
  //     countQuery += ` AND c.teacher_id = ?`;

  //     params.push(teacherId);
  //     countParams.push(teacherId);
  //   }

  //   query += ` ORDER BY c.created_at DESC`;

  //   if (page && limit) {
  //     query += ` LIMIT ? OFFSET ?`;
  //     params.push(limit, (page - 1) * limit);
  //   }

  //   const [courses] = await db.query(query, params);
  //   const [[{ total }]] = await db.query(countQuery, countParams);

  //   return {
  //     data: courses,
  //     total,
  //     page,
  //     totalPages: page && limit ? Math.ceil(total / limit) : 1,
  //   };
  // }
  searchAndFilter: async ({ search, teacherId, page = 1, limit = 10 }) => {
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const offset = (pageNum - 1) * limitNum;

  // ==========================================
  // TH1: TRƯỜNG HỢP KHÔNG CÓ TỪ KHÓA TÌM KIẾM
  // (Dùng SQL Pagination tối ưu hiệu năng như code cũ)
  // ==========================================
  if (!search) {
    let query = `
      SELECT c.id, c.title, c.description, c.thumbnail_url, c.teacher_id, c.created_at, u.name AS teacher_name
      FROM courses c
      JOIN users u ON c.teacher_id = u.id
      WHERE 1 = 1
    `;
    
    let countQuery = `
      SELECT COUNT(*) AS total
      FROM courses c
      WHERE 1 = 1
    `;

    const params = [];
    const countParams = [];

    if (teacherId) {
      query += ` AND c.teacher_id = ?`;
      countQuery += ` AND c.teacher_id = ?`;
      params.push(teacherId);
      countParams.push(teacherId);
    }

    query += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    const [courses] = await db.query(query, params);
    const [[{ total }]] = await db.query(countQuery, countParams);

    return {
      data: courses,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    };
  }

  // ==========================================
  // TH2: TRƯỜNG HỢP CÓ TỪ KHÓA TÌM KIẾM
  // (Hybrid Vector + Keyword Search trên Node.js)
  // ==========================================
  let query = `
    SELECT c.id, c.title, c.description, c.thumbnail_url, c.teacher_id, c.embedding, c.created_at, u.name AS teacher_name
    FROM courses c
    JOIN users u ON c.teacher_id = u.id
    WHERE 1 = 1
  `;
  const params = [];

  if (teacherId) {
    query += ` AND c.teacher_id = ?`;
    params.push(teacherId);
  }

  query += ` ORDER BY c.created_at DESC`;

  const [courses] = await db.query(query, params);
  const queryVector = await getEmbedding(search);

  // Tính điểm Similarity & Keyword Match
  const scoredCourses = courses.map((course) => {
    let vectorScore = 0;

    if (course.embedding && queryVector) {
      const courseVector = typeof course.embedding === 'string' 
        ? JSON.parse(course.embedding) 
        : course.embedding;

      vectorScore = cosineSimilarity(queryVector, courseVector);
    }

    const searchLower = search.toLowerCase();
    const titleMatch = course.title?.toLowerCase().includes(searchLower);
    const descMatch = course.description?.toLowerCase().includes(searchLower);

    let keywordScore = 0;
    if (titleMatch) keywordScore += 0.5;
    if (descMatch) keywordScore += 0.2;

    const finalScore = vectorScore + keywordScore;

    return {
      ...course,
      score: finalScore,
    };
  });

  // Lọc kết quả và sắp xếp theo điểm giảm dần
  const filteredCourses = scoredCourses
    .filter(c => c.score > 0.25)
    .sort((a, b) => b.score - a.score);

  // Phân trang danh sách đã lọc
  const total = filteredCourses.length;
  const paginatedData = filteredCourses.slice(offset, offset + limitNum);

  // Loại bỏ trường embedding nặng trước khi trả về Client
  const cleanedData = paginatedData.map(({ embedding, score, ...rest }) => rest);

  return {
    data: cleanedData,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
}
};

module.exports = CourseModel;