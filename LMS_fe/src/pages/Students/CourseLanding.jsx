import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { BookOpen, ClipboardList } from "lucide-react";
import api from "../../services/api";
import Navbar from "../../Components/Navbar";
import useAlert from "../../Components/Alert/useAlert";
import ImageModal from "../../Components/ImageModal";

const CourseLanding = () => {
  const { id } = useParams(); // courseId
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { showAlert, confirm } = useAlert();
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState("lessons");

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const res = await api.get(`/courses/${id}`);
        setCourse(res.data.data);
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
    const fetchCompletedLessons = async () => {
      try {
        const res = await api.get(`/student/completed-lessons/${id}`);
        setCompletedLessonIds(new Set(res.data.data));
      } catch (err) {
        console.error(err);
      }
    };
    fetchCourseData();
    fetchCompletedLessons();
  }, [id]);
  const handleUnenroll = async (courseId, courseTitle) => {
    try {
      confirm(
        "Hủy tham gia khóa học",
        `Tiến trình sẽ bị mất, bạn có chắc chắn muốn bỏ tham gia khóa học "${courseTitle}"`,
        async () => {
          const res = await api.delete(`/enrollments/${courseId}/unenroll`);
          showAlert("success", "Thành công", res.data.message);
          navigate(`../../view-course/${courseId}`);
        },
      );
    } catch (err) {
      console.error(err);
      showAlert(
        "error",
        "Thất bại",
        err?.data?.message || "Hủy khóa học thất bại",
      );
    }
  };
  if (loading)
    return (
      <div className="text-center p-10 font-medium text-slate-600">
        Đang tải thông tin khóa học...
      </div>
    );
  if (error)
    <div>
      <Navbar />
      <div className="text-center p-10 text-red-500">{error}</div>
    </div>;

  const firstLessonId = course?.lessons?.[0]?.id;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />
      {/* Hero Banner Section */}
      <div className="bg-gradient-to-r from-white-900 to-slate-200 text-white py-12 px-6 md:px-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-center">
          <div className="flex flex-col gap-3">
            <Link
              to={`/dashboard`}
              className="text-blue-500 hover:text-blue-7 transition text-sm font-medium"
            >
              ← Khóa học của tôi
            </Link>
            <ImageModal
              src={course.thumbnail_url || "https://placehold.co/600x400"}
              alt={course.title}
              className="w-full md:w-64 aspect-video object-cover rounded-xl shadow-lg bg-slate-700"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-4xl font-extrabold text-black mb-4">
              {course?.title}
            </h1>
            <p className="text-slate-700 text-sm md:text-base max-w-2xl leading-relaxed">
              {course?.description}
            </p>

            {/* Nút vào học bài đầu tiên */}
            <button
              onClick={() => {
                if (firstLessonId) {
                  navigate(`/learning/${id}/lesson/${firstLessonId}`);
                } else {
                  showAlert(
                    "success",
                    "Thành công",
                    "Khóa học hiện tại chưa cập nhật bài học nào.",
                  );
                }
              }}
              className="m-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-lg shadow-blue-900/30"
            >
              Bắt đầu học ngay
            </button>
            <button
              onClick={() => handleUnenroll(course.id, course.title)}
              className="m-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition shadow-lg shadow-blue-900/30"
            >
              Hủy tham gia
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto mt-10 px-6">
        <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 mb-6">
          <button
            onClick={() => setActiveTab("lessons")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all duration-200 ${
              activeTab === "lessons"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <BookOpen size={18} />
            <span className="font-medium">
              Bài học ({course?.lessons?.length || 0})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("exams")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all duration-200 ${
              activeTab === "exams"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ClipboardList size={18} />
            <span className="font-medium">
              Bài kiểm tra ({course?.exams?.length || 0})
            </span>
          </button>
        </div>
      </div>
      {/* Curriculum Section */}
      <div className="max-w-3xl mx-auto mt-10 px-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          Nội dung khóa học
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
          {activeTab === "lessons" ? (
            <>
              {course?.lessons?.length === 0 ? (
                <p className="p-6 text-center text-slate-400">
                  Nội dung bài giảng đang được biên soạn.
                </p>
              ) : (
                course.lessons.map((lesson, idx) => {
                  const isCompleted = completedLessonIds.has(lesson.id);

                  return (
                    <div
                      key={lesson.id}
                      onClick={() =>
                        navigate(`/learning/${id}/lesson/${lesson.id}`)
                      }
                      className={`flex items-center gap-4 p-4 cursor-pointer transition group ${
                        isCompleted
                          ? "bg-green-50 hover:bg-green-100"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-20 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200">
                        <ImageModal
                          src={
                            lesson.thumbnail_url ||
                            "https://placehold.co/640x400/e2e8f0/64748b?text=No+Thumbnail"
                          }
                          alt={lesson.title}
                          className="w-full h-full object-cover"
                        />

                        {/* Badge số thứ tự */}
                        <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                          {idx + 1}
                        </div>

                        {/* Badge hoàn thành */}
                        {isCompleted && (
                          <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
                            ✓
                          </div>
                        )}
                      </div>

                      {/* Thông tin */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-sm font-semibold truncate ${
                            isCompleted
                              ? "text-green-700"
                              : "text-slate-700 group-hover:text-blue-600"
                          }`}
                        >
                          {lesson.title}
                        </h3>

                        <p className="text-xs text-slate-500 mt-1">
                          {lesson.video_url ? "🎥 Video" : ""}
                        </p>
                      </div>

                      {/* Trạng thái */}
                      <span
                        className={`text-xs font-medium ${
                          isCompleted
                            ? "text-green-600"
                            : "text-blue-500 opacity-0 group-hover:opacity-100 transition"
                        }`}
                      >
                        {isCompleted ? "✓ Đã học" : "Học →"}
                      </span>
                    </div>
                  );
                })
              )}
            </>
          ) : (
            <>
              {course?.exams?.length === 0 ? (
                <p className="p-6 text-center text-slate-400">
                  Chưa có bài kiểm tra.
                </p>
              ) : (
                course.exams.map((exam) => (
                  <div
                    key={exam.id}
                    onClick={() =>
                      exam.type === "practice"
                        ? navigate(`/student/practice/${exam.id}`)
                        : navigate(`/student/exams/${exam.id}`)
                    }
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition group"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-700 group-hover:text-blue-600">
                        {exam.title}
                      </h3>

                      <p className="text-sm text-slate-500 mt-1">
                        {exam.description}
                      </p>

                      <div className="flex gap-3 mt-2 text-xs text-slate-400">
                        <span>
                          {exam.type === "practice" ? "Luyện tập" : "Kiểm tra"}
                        </span>

                        <span>
                          ⏱{" "}
                          {exam.duration_minutes === 0
                            ? "Không giới hạn"
                            : `${exam.duration_minutes} phút`}
                        </span>

                        <span>
                          {exam.grading_method === "auto"
                            ? "Chấm tự động"
                            : "Chấm thủ công"}
                        </span>
                      </div>
                    </div>

                    <div className="text-blue-500 text-sm font-medium">
                      Làm bài →
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseLanding;
