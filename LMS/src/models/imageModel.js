const db = require("../config/db");

module.exports = {

    create: async (imageableType, imageableId, publicId, url) => {
      const [result] = await db.execute(
        `INSERT INTO images (imageable_type, imageable_id, public_id, url)
        VALUES (?, ?, ?, ?)`,
        [imageableType, imageableId, publicId, url]
      );

      return result.insertId;
    },
    getByUrl: async (url) => {
      const [rows] = await db.execute(
        `SELECT * FROM images WHERE url = ?`,
        [url]
      );

      return rows[0];
    },

    getById: async (id) => {
      const [rows] = await db.execute(
        `SELECT * FROM images WHERE id = ?`,
        [id]
      );

      return rows[0]; // Bổ sung return bị thiếu trong code gốc
    },

    delete: async (id) => {
      await db.execute(
        `DELETE FROM images WHERE id = ?`,
        [id]
      );
    },

    updateImageable: async (imageIds, imageableType, imageableId) => {
      if (!imageIds.length) return;

      const placeholders = imageIds.map(() => "?").join(",");

      await db.execute(
        `UPDATE images
        SET imageable_type = ?, imageable_id = ?
        WHERE id IN (${placeholders})`,
        [imageableType, imageableId, ...imageIds]
      );
    },
    // Lấy danh sách ảnh thuộc về 1 entity (ở đây là lesson)
    getByImageable: async (imageableType, imageableId) => {
      const [rows] = await db.execute(
        `SELECT * FROM images WHERE imageable_type = ? AND imageable_id = ?`,
        [imageableType, imageableId]
      );
      return rows;
    },
    deleteImage: async (imageId, teacherId) => {
      // 1. Lấy public_id để xóa trên Cloudinary
      const [rows] = await db.query(
        `SELECT public_id FROM images WHERE id = ?`,
        [imageId]
      );
      if (!rows.length) return null;

      const publicId = rows[0].public_id;

      // 2. Xóa khỏi database
      await db.query(`DELETE FROM images WHERE id = ?`, [imageId]);

      return publicId;
    }
}