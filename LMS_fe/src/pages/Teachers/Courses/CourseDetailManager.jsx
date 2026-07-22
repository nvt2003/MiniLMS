import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../../services/api";
import Navbar from "../../../Components/Navbar";
import useAlert from "../../../Components/Alert/useAlert";
import ImageModal from "../../../Components/ImageModal";

const CourseDetailManager = () => {
  const { id } = useParams(); // Lấy courseId từ URL của trang chi tiết khóa học
  const navigate = useNavigate();
  const { showAlert, confirm } = useAlert();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 1. Hàm tải toàn bộ thông tin khóa học và danh sách bài học
  const fetchCourseDetail = async () => {
    try {
      const res = await api.get(`/courses/${id}`);

      setCourse(res.data.data);
      setLessons(res.data.data.lessons || []);
    } catch (err) {
      if (
        err?.response?.status === 404 &&
        err.response?.data?.message.includes("Không tìm thấy")
      )
        navigate("*");
      setError(
        err.response?.data?.message || "Không thể tải thông tin khóa học.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseDetail();
  }, [id]);
  const handleDeleteCourse = async (courseId, courseTitle) => {
    // const confirmDelete = window.confirm(
    //   `Bạn có chắc chắn muốn xóa khóa học "${courseTitle}" không? Hành động này không thể hoàn tác!`,
    // );
    // if (!confirmDelete) return;

    try {
      confirm(
        "Xoá khóa học",
        `Bạn có chắc chắn muốn xóa khóa học: "${courseTitle}"?`,
        async () => {
          await api.delete(`/courses/${courseId}`);
          showAlert("success", "Thành công", "Xóa khóa học thành công!");
          navigate("/dashboard");
        },
      );
    } catch (err) {
      showAlert(
        "error",
        "Lỗi",
        `err.response?.data?.message || "Không thể xóa khóa học này.`,
      );
    }
  };
  const handleDeleteLesson = async (lessonId, lessonTitle) => {
    try {
      confirm(
        "Xóa bài học",
        `Bạn có chắc chắn muốn xóa bài học: "${lessonTitle}"?`,
        async () => {
          await api.delete(`/lessons/${lessonId}`);
          showAlert("success", "Thành công", "Xóa bài học thành công!");
          fetchCourseDetail();
        },
      );
    } catch (err) {
      alert(err.response?.data?.message || "Gặp lỗi khi xóa bài học này.");
    }
  };

  if (loading)
    return (
      <div className="text-center p-10 font-medium">
        Đang tải cấu trúc khóa học...
      </div>
    );
  if (error)
    return (
      <div>
        <Navbar />
        <div className="text-center p-10 text-red-500 bg-red-50 m-6 rounded-xl">
          {error}
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <Navbar />

        {/* Thông tin chung của Khóa học */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 mb-8 justify-between">
          <div className="max-w-5xl  flex flex-col md:flex-row gap-8 justify-between items-center">
            <div className="flex flex-3 items-center">
              <div className="flex flex-col gap-3">
                <Link
                  to={`/dashboard`}
                  className="text-slate-500 hover:text-blue-600 transition text-sm font-medium"
                >
                  ← Khóa học của tôi
                </Link>
                <ImageModal
                  src={course.thumbnail_url || "https://placehold.co/600x400"}
                  alt={course.title}
                  className="w-full md:w-64 aspect-video object-cover rounded-xl shadow-lg bg-slate-700"
                />
              </div>
              <div className="m-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 mt-2 mb-3">
                  {course?.title}
                </h1>
                <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-line">
                  {course?.description ||
                    "Chưa có mô tả chi tiết cho khóa học này."}
                </p>
              </div>
            </div>
            <div className="flex flex-1 justify-end center-end gap-2">
              <button
                onClick={() => navigate(`/teacher/edit-course/${course.id}`)}
                className="px-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs transition"
              >
                Sửa thông tin
              </button>
              <button
                onClick={() => handleDeleteCourse(course.id, course.title)}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl text-xs transition"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>

        {/* Khu vực quản lý bài học */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Danh sách bài giảng
              </h2>

              <p className="text-xs text-slate-400 mt-0.5">
                Tổng số: {lessons.length} bài học
              </p>
            </div>

            {/* NÚT THÊM BÀI HỌC MỚI */}
            <button
              onClick={() => navigate(`/teacher/course/${id}/add-lesson`)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition shadow-sm flex items-center justify-center gap-2"
            >
              <span className="text-lg leading-none">+</span> Thêm bài học mới
            </button>
          </div>

          {/* Danh sách các bài giảng lặp qua map */}
          {lessons.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
              <p className="text-slate-400 text-sm mb-2">
                Khóa học này chưa có nội dung bài giảng nào.
              </p>
              <p className="text-xs text-slate-400">
                Hãy nhấn "Thêm bài học mới" để tải lên video đầu tiên.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {[...lessons]
                .sort((a, b) => a.position - b.position)
                .map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-100 transition gap-4"
                  >
                    {/* Thông tin bài học */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Thumbnail */}
                      <div className="relative w-24 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200">
                        <ImageModal
                          src={
                            lesson.thumbnail_url ||
                            "https://placehold.co/320x180?text=No+Image"
                          }
                          alt={lesson.title}
                          className="w-full h-full object-cover"
                        />

                        {/* Badge số thứ tự */}
                        <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                          {lesson.position || index + 1}
                        </div>
                      </div>

                      {/* Nội dung */}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-700 text-base truncate mb-1">
                          {lesson.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          {lesson.video_url ? (
                            <span className="text-emerald-600 font-medium flex items-center gap-1">
                              ● Đã có video bài giảng
                            </span>
                          ) : (
                            <span className="text-amber-500 font-medium">
                              ○ Chưa đính kèm video
                            </span>
                          )}

                          {lesson.content && (
                            <span className="list-item list-inside">
                              Có tài liệu đính kèm
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CỤM NÚT SỬA VÀ XÓA BÀI HỌC */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {/* NÚT SỬA BÀI HỌC */}
                      <button
                        onClick={() =>
                          navigate(`/teacher/edit-lesson/${lesson.id}`)
                        }
                        className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                      >
                        Chỉnh sửa
                      </button>

                      {/* NÚT XÓA BÀI HỌC */}
                      <button
                        onClick={() =>
                          handleDeleteLesson(lesson.id, lesson.title)
                        }
                        className="px-3.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                      >
                        Xóa bỏ
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetailManager;
