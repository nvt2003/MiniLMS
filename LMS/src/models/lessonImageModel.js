const db = require("../config/db");

module.exports = {

    create: async (lessonId, publicId, url) => {
    const [result] = await db.execute(
      `INSERT INTO lesson_images (lesson_id, public_id, url)
       VALUES (?, ?, ?)`,
      [lessonId, publicId, url]
    );

    return result.insertId;
  },

    getByUrl: async (url) => {
  const [rows] = await db.execute(
    `SELECT * FROM lesson_images WHERE url = ?`,
    [url]
  );

  return rows[0];
},
getById: async (id) => {
  const [rows] = await db.execute(
    `SELECT * FROM lesson_images WHERE id = ?`,
    [id]
  );},

    delete: async (id) => {
  await db.execute(
    `DELETE FROM lesson_images WHERE id = ?`,
    [id]
  );
},
updateLessonId: async (imageIds, lessonId) => {
  if (!imageIds.length) return;

  const placeholders = imageIds.map(() => "?").join(",");

  await db.execute(
    `UPDATE lesson_images
     SET lesson_id = ?
     WHERE id IN (${placeholders})`,
    [lessonId, ...imageIds]
  );
},

}