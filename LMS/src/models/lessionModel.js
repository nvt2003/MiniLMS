const db = require('../config/db');

const LessonModel = {
  // 1. Thêm bài học mới vào khóa học
  create: async (courseId, title, content, videoUrl, position, thumbnailUrl) => {
    
    const [result] = await db.query(
      'INSERT INTO lessons (course_id, title, content, video_url, position, thumbnail_url) VALUES (?, ?, ?, ?, ?, ?)',
      [courseId, title, content, videoUrl, position, thumbnailUrl]
    );
    
    return result.insertId;
  },

  // 2. Lấy nội dung chi tiết của một bài học để xem
  findById: async (id) => {
    const [rows] = await db.query('SELECT * FROM lessons WHERE id = ?', [id]);
    return rows[0];
  },
  update: async (
    id,
    title,
    content,
    videoUrl,
    position,
    thumbnailUrl
  ) => {

    const [result] = await db.query(
      `UPDATE lessons
       SET
          title = ?,
          content = ?,
          video_url = ?,
          position = ?,
          thumbnail_url = ?
       WHERE id = ?`,
      [
        title,
        content,
        videoUrl,
        position,
        thumbnailUrl,
        id
      ]
    );

    return result.affectedRows > 0;
  },
  delete: async (id) => {

    const [result] = await db.query(
      "DELETE FROM lessons WHERE id = ?",
      [id]
    );

    return result.affectedRows > 0;
  }
};

module.exports = LessonModel;