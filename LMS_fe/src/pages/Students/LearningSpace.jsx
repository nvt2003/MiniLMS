import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import Navbar from "../../Components/Navbar";
import useAlert from "../../Components/Alert/useAlert";
const LearningSpace = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  const [loadingComplete, setLoadingComplete] = useState(false);
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set());

  // 1. Lấy dữ liệu toàn bộ cấu trúc khóa học và bài học hiện tại
  // useEffect(() => {
  //   const fetchLearningData = async () => {
  //     try {
  //       // Tận dụng API chi tiết khóa học để lấy đồng thời danh sách bài học
  //       const res = await api.get(`/courses/${courseId}`);
  //       setCourse(res.data.data);

  //       // Tìm bài học cụ thể mà học sinh đang chọn trên URL
  //       const lessonsList = res.data.data.lessons || [];
  //       const activeLesson = lessonsList.find(
  //         (l) => String(l.id) === String(lessonId),
  //       );

  //       setCurrentLesson(activeLesson || lessonsList[0]);
  //     } catch (err) {
  //       console.error("Lỗi tải không gian học tập", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   const fetchCompletedLessons = async () => {
  //     try {
  //       const res = await api.get(`/student/completed-lessons/${courseId}`);
  //       setCompletedLessonIds(new Set(res.data.data));
  //       console.log(res.data);
  //       console.log(completedLessonIds);
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   };
  //   fetchLearningData();
  //   fetchCompletedLessons();
  // }, [courseId, lessonId]);
  useEffect(() => {
    // 1. Gọi API lấy thông tin khóa học (chỉ cần chạy lại khi courseId thay đổi)
    const fetchCourseData = async () => {
      try {
        const res = await api.get(`/courses/${courseId}`);
        setCourse(res.data.data);
      } catch (err) {
        console.error("Lỗi tải thông tin khóa học", err);
      }
    };

    // 2. Gọi API lấy danh sách bài học đã hoàn thành (chỉ cần chạy lại khi courseId thay đổi)
    const fetchCompletedLessons = async () => {
      try {
        const res = await api.get(`/student/completed-lessons/${courseId}`);
        setCompletedLessonIds(new Set(res.data.data));
      } catch (err) {
        console.error("Lỗi tải bài học đã hoàn thành", err);
      }
    };

    if (courseId) {
      fetchCourseData();
      fetchCompletedLessons();
    }
  }, [courseId]); // Hook này chỉ chạy khi courseId thay đổi

  useEffect(() => {
    // 3. Mỗi khi lessonId thay đổi, gọi API chi tiết của lesson đó
    const fetchActiveLesson = async () => {
      if (!lessonId) return;

      setLoading(true);
      try {
        const res = await api.get(`/lessons/${lessonId}`);
        setCurrentLesson(res.data.data);
      } catch (err) {
        console.error("Lỗi tải chi tiết bài học", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveLesson();
  }, [lessonId]); // Hook này chỉ chạy khi lessonId thay đổi
  const handleCompleteLesson = async (lessonId) => {
    try {
      setLoadingComplete(true);

      const res = await api.post("/student/complete-lesson", {
        lessonId,
        courseId: course.id,
      });

      setCompletedLessonIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(lessonId);
        return newSet;
      });

      showAlert("success", "Thành công", res.data.message);
    } catch (err) {
      showAlert(
        "error",
        "Lỗi",
        err.response?.data?.message || "Không thể đánh dấu hoàn thành.",
      );
    } finally {
      setLoadingComplete(false);
    }
  };
  if (loading)
    return (
      <div className="text-center p-10 font-medium text-slate-600">
        Đang tải không gian học tập...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Navbar />

      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to={`/course/${courseId}`}
            className="text-slate-500 hover:text-blue-600 transition text-sm font-medium"
          >
            ← Rời khỏi phòng học
          </Link>

          <span className="text-slate-300">|</span>

          <h1 className="text-sm font-bold truncate max-w-md text-slate-800">
            {course?.title}
          </h1>
        </div>

        <div className="text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full">
          Chế độ học viên
        </div>
      </div>

      {/* Main Workspace Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* KHU VỰC BÊN TRÁI: VIDEO PLAYER & NỘI DUNG VĂN BẢN */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-6 space-y-4">
          <div className="max-w-4xl mx-auto">
            {currentLesson?.video_url ? (
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-2xl border border-slate-800">
                <video
                  src={currentLesson.video_url}
                  controls
                  controlsList="nodownload"
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="aspect-video w-full rounded-xl bg-slate-900 flex flex-col items-center justify-center border border-slate-800 p-6 text-center text-slate-400">
                <span className="text-3xl mb-2">💡</span>
                <p className="text-sm">Bài học này không có nội dung video.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Vui lòng đọc hướng dẫn hoặc tài liệu đính kèm bên dưới.
                </p>
              </div>
            )}

            {/* Tiêu đề & nội dung bài học */}
            <div className="mt-6 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">
                {currentLesson?.title}
              </h2>

              <hr className="border-slate-200 mb-4" />

              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {/* {currentLesson?.content ||
                  "Không có nội dung văn bản ghi chú thêm cho bài học này."} */}
                {(
                  <div
                    dangerouslySetInnerHTML={{
                      __html: currentLesson?.content,
                    }}
                  />
                ) || "Không có nội dung văn bản ghi chú thêm cho bài học này."}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => handleCompleteLesson(currentLesson.id)}
                  disabled={
                    loadingComplete || completedLessonIds.has(currentLesson.id)
                  }
                  className={`px-5 py-2 rounded-lg font-medium transition ${
                    completedLessonIds.has(currentLesson.id)
                      ? "bg-green-500 text-white cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {loadingComplete
                    ? "Đang xử lý..."
                    : completedLessonIds.has(currentLesson.id)
                      ? "✓ Đã hoàn thành"
                      : "Đánh dấu hoàn thành"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* KHU VỰC BÊN PHẢI: DANH SÁCH BÀI HỌC (SIDEBAR) */}
        <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-slate-700 flex flex-col flex-shrink-0 overflow-y-auto shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-white sticky top-0">
            <h3 className="font-bold text-sm text-slate-800">
              Nội dung bài học
            </h3>
          </div>

          <div className="divide-y divide-slate-200">
            {course?.lessons?.map((lesson, idx) => {
              const isActive = String(lesson.id) === String(lessonId);
              const isCompleted = completedLessonIds.has(lesson.id);

              return (
                <div
                  key={lesson.id}
                  onClick={() =>
                    navigate(`/learning/${courseId}/lesson/${lesson.id}`)
                  }
                  className={`p-4 flex items-start gap-3 cursor-pointer transition border-l-4
          ${
            isActive
              ? "bg-blue-50 border-blue-500"
              : isCompleted
                ? "bg-green-50 border-green-500 hover:bg-green-100"
                : "bg-white border-transparent hover:bg-slate-50"
          }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
            ${
              isActive
                ? "bg-blue-600 text-white"
                : isCompleted
                  ? "bg-green-600 text-white"
                  : "bg-slate-200 text-slate-600"
            }`}
                  >
                    {isCompleted ? "✓" : idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate
              ${
                isActive
                  ? "text-blue-700"
                  : isCompleted
                    ? "text-green-700"
                    : "text-slate-800"
              }`}
                    >
                      {lesson.title}
                    </p>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">
                        {lesson.video_url ? "▶ Video" : ""}
                      </span>

                      {isCompleted && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                          Đã hoàn thành
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningSpace;
