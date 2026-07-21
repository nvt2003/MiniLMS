const cron = require('node-cron');
const db = require('../config/db');
const { deleteImage } = require('../services/CloudinaryServices');

const initCleanOrphanImagesJob = () => {
  // Lịch chạy: Chạy vào lúc 02:00 sáng mỗi ngày ('0 2 * * *')
  cron.schedule('0 2 * * *', async () => {
    console.log('[CRON JOB] Đang quét và dọn dẹp ảnh mồ côi...');
    
    try {
      // 1. Tìm các ảnh có imageable_id = 0 và được tạo hơn 24 giờ trước
      const [orphans] = await db.query(
        `SELECT id, public_id FROM images 
         WHERE imageable_id = 0 AND created_at < NOW() - INTERVAL 1 DAY`
      );

      if (orphans.length === 0) {
        console.log('[CRON JOB] Không có ảnh mồ côi nào cần dọn dẹp.');
        return;
      }

      console.log(`[CRON JOB] Phát hiện ${orphans.length} ảnh mồ côi. Bắt đầu xóa...`);

      // 2. Lặp qua từng ảnh để xóa trên Cloudinary và DB
      for (const img of orphans) {
        try {
          // Xóa ảnh trên Cloudinary
          await deleteImage(img.public_id);
          // Xóa bản ghi trong Database
          await db.query(`DELETE FROM images WHERE id = ?`, [img.id]);
        } catch (err) {
          console.error(`[CRON JOB] Lỗi khi xóa ảnh ID ${img.id}:`, err);
        }
      }

      console.log('[CRON JOB] Hoàn tất dọn dẹp ảnh mồ côi!');
    } catch (error) {
      console.error('[CRON JOB] Lỗi khi thực thi Cron Job:', error);
    }
  });
};

module.exports = initCleanOrphanImagesJob;