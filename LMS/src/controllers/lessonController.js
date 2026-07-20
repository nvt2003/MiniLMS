const LessonModel = require('../models/lessionModel');
const CourseModel = require('../models/coursesModel');
const NotificationModel = require('../models/notificationModel');
const { sendNewLessonEmail } = require("../utils/sendEmail");
const {
    uploadVideo,
    uploadImage
} = require("../services/CloudinaryServices");
const lessonImageModel = require('../models/lessonImageModel');
const lessonController = {
    createNewLesson: async (req, res) => {
    try {
      const { courseId, title, content, position } = req.body;
      const teacherId = req.user.id; // Lấy từ auth middleware

      // 1. Kiểm tra đầu vào tối thiểu
      if (!courseId || !title) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ courseId và tiêu đề bài học!' });
      }

      // 2. Kiểm tra quyền: Chỉ giáo viên tạo ra khóa học này mới được thêm bài học
      const course = await CourseModel.getDetailWithLessons(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Khóa học không tồn tại!' });
      }
      if (req.user.role === 'teacher' && course.teacher_id !== teacherId) {
        return res.status(403).json({ message: 'Bạn không có quyền thêm bài học vào khóa học này!' });
      }

      let videoUrl = null;
      let thumbnailUrl = null;

      const videoFile = req.files?.video?.[0];
      const thumbnailFile = req.files?.thumbnail?.[0];

      if (videoFile) {
          console.log("video:", videoFile.originalname);

          const result = await uploadVideo(videoFile.buffer);
          videoUrl = result.secure_url;
      }

      if (thumbnailFile) {
          const result = await uploadImage(thumbnailFile.buffer);
          thumbnailUrl = result.secure_url;
      }

      // 4. Lưu bài học vào Cơ sở dữ liệu
      const newLessonId = await LessonModel.create(courseId, title, content, videoUrl, position,thumbnailUrl);
      // ----
      const imageIds = JSON.parse(req.body.imageIds || "[]");
      await lessonImageModel.updateLessonId(
        imageIds,
        newLessonId
      );
      // ---
      setImmediate(async () => {
        const course = await CourseModel.getDetailWithLessons(courseId);
        const students = await NotificationModel.getStudentsAndEmailsByCourse(courseId);
        for (const student of students){
          try {
          if (global.io) {
            global.io
              .to(`student_${student.student_id}`)
              .emit('new_lesson_notification', {
                title: `Bài học mới: ${course.title}`,
                message: `Bài học "${title}" vừa được thêm vào.`,
                link: `/learning/${courseId}/lesson/${newLessonId}`
              });
          }
          }
          catch(err) {
            console.log("Socket lỗi:", err);
          }
          console.log("global.io:", !!global.io);
console.log("room:", `student_${student.student_id}`);
          try {
            if(student.email){
              await sendNewLessonEmail(
                student.email,
                course.title,
                title,
                courseId
              );
            }
          }
          catch(err) {
            console.log("Email lỗi:", err);
          }
        }
            });
            
      return res.status(201).json({
        message: 'Tạo bài học mới thành công!',
        data: {
          id: newLessonId,
          courseId,
          title,
          content,
          videoUrl,
          thumbnailUrl,
          position
        }
      });

    } catch (error) {
      console.error("Error in createNewLesson:", error);
      return res.status(500).json({ error: 'Lỗi server: ' + error.message });
    }
  },
  // [GET] /api/lessons/course/:courseId - Lấy danh sách bài học theo khóa học
  getLessonsByCourse: async (req, res) => {
    try {
      const { courseId } = req.params;
      const lessons = await LessonModel.getByCourseId(courseId);
      res.status(200).json({ message: 'Lấy danh sách bài học thành công', data: lessons });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  // [GET] /api/lessons/:id - Xem chi tiết bài học
  getLessonDetail: async (req, res) => {
    try {
      const { id } = req.params;
      const lesson = await LessonModel.findById(id);
      
      if (!lesson) {
        return res.status(404).json({ message: 'Bài học không tồn tại' });
      }
      res.status(200).json({ message: 'Lấy chi tiết bài học thành công', data: lesson });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  // [PUT] /api/lessons/:id - Cập nhật bài học
  updateLesson: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, position} = req.body;
      const lesson = await LessonModel.findById(id);

      if (!lesson) {
        return res.status(404).json({
          message: "Không tìm thấy bài học"
        });
      }
      let videoUrl = lesson.video_url;
      let thumbnailUrl = lesson.thumbnail_url;

        if (req.files?.video?.[0]) {

            const result = await uploadVideo(
                req.files.video[0].buffer
            );

            videoUrl = result.secure_url;
        }
        if (req.files?.thumbnail?.[0]) {

            const result = await uploadImage(
                req.files.thumbnail[0].buffer
            );

            thumbnailUrl = result.secure_url;
        }
      const isUpdated = await LessonModel.update(id, title, content, videoUrl, position, thumbnailUrl);
      if (!isUpdated) {
        return res.status(404).json({ message: 'Không tìm thấy bài học để cập nhật' });
      }
      return res.status(200).json({ message: 'Cập nhật bài học thành công' });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  // [DELETE] /api/lessons/:id - Xóa bài học
  deleteLesson: async (req, res) => {
    try {
      const { id } = req.params;
      const isDeleted = await LessonModel.delete(id);
      
      if (!isDeleted) {
        return res.status(404).json({ message: 'Không tìm thấy bài học để xóa' });
      }
      return res.status(200).json({ message: 'Xóa bài học thành công' });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  }
};


module.exports = lessonController;