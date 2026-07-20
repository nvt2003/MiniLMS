const db = require('../config/db');

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

  // 2. Lấy chi tiết 1 khóa học kèm danh sách các bài học bên trong nó
  getDetailWithLessons: async (courseId) => {
    // Lấy thông tin khóa học trước
    const courseQuery = `
      SELECT c.*, u.name as teacher_name 
      FROM courses c
      JOIN users u ON c.teacher_id = u.id
      WHERE c.id = ?
    `;
    const [courses] = await db.query(courseQuery, [courseId]);
    if (courses.length === 0) return null;

    const course = courses[0];

    // Lấy danh sách bài học thuộc khóa này, sắp xếp theo thứ tự (position)
    const [lessons] = await db.query(
      'SELECT id, title, video_url, position,thumbnail_url FROM lessons WHERE course_id = ? ORDER BY position ASC',
      [courseId]
    );

    course.lessons = lessons; // Nhét mảng bài học vào object khóa học luôn
    return course;
  },

  // 3. Giáo viên tạo khóa học mới
  create: async (teacherId, title, description, thumbnailUrl) => {
    const [result] = await db.query(
      'INSERT INTO courses (teacher_id, title, description, thumbnail_url) VALUES (?, ?, ?, ?)',
      [teacherId, title, description, thumbnailUrl]
    );
    return result.insertId;
  },
update: async (courseId, title, description, thumbnailUrl) => {
  const [result] = await db.query(
    `UPDATE courses
     SET title = ?, description = ?, thumbnail_url = ?
     WHERE id = ?`,
    [title, description, thumbnailUrl, courseId]
  );

  return result.affectedRows;
},
  // 4. Xóa khóa học (Vì có ON DELETE CASCADE ở DB nên bài học liên quan sẽ tự động mất)
  delete: async (id) => {
    const [result] = await db.query('DELETE FROM courses WHERE id = ?', [id]);
    return result.affectedRows > 0; // Trả về true nếu xóa thành công
  },
  // searchAndFilter: async (filters) => {
  //   const { search, teacherId } = filters;
  //   let query = `SELECT * FROM courses WHERE 1=1`;
  //   let queryParams = [];

  //   // 1. Nếu có từ khóa tìm kiếm (tìm gần đúng trong title hoặc description)
  //   if (search) {
  //     query += ` AND (title LIKE ? OR description LIKE ?)`;
  //     const searchParam = `%${search}%`;
  //     queryParams.push(searchParam, searchParam);
  //   }

  //   // 2. Nếu có lọc theo giảng viên
  //   if (teacherId) {
  //     query += ` AND teacher_id = ?`;
  //     queryParams.push(teacherId);
  //   }

  //   // Sắp xếp khóa học mới nhất lên đầu
  //   query += ` ORDER BY created_at DESC`;

  //   const [rows] = await db.query(query, queryParams);
  //   return rows;
  // }

  //pagination
  searchAndFilter: async ({ search, teacherId, page, limit }) => {
    let query = `
      SELECT c.*, u.name AS teacher_name
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

    if (search) {
      query += ` AND (c.title LIKE ? OR c.description LIKE ?)`;
      countQuery += ` AND (c.title LIKE ? OR c.description LIKE ?)`;

      params.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (teacherId) {
      query += ` AND c.teacher_id = ?`;
      countQuery += ` AND c.teacher_id = ?`;

      params.push(teacherId);
      countParams.push(teacherId);
    }

    query += ` ORDER BY c.created_at DESC`;

    if (page && limit) {
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, (page - 1) * limit);
    }

    const [courses] = await db.query(query, params);
    const [[{ total }]] = await db.query(countQuery, countParams);

    return {
      data: courses,
      total,
      page,
      totalPages: page && limit ? Math.ceil(total / limit) : 1,
    };
  }
};

module.exports = CourseModel;