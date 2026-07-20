import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import Navbar from "../../Components/Navbar";
import useAlert from "../../Components/Alert/useAlert";
import ImageModal from "../../Components/ImageModal";

const CourseView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const { showAlert } = useAlert();
  const [isCurrentSubmitting, SetIsCurrentSubmitting] = useState(false);

  const checkEnroll = async (courseId) => {
    try {
      const res = await api.get(`/enrollments/status/${courseId}`);
      if (res.data.enrolled)
        navigate(`../../course/${courseId}`, { replace: true });
    } catch (err) {
      showAlert("error", "Lỗi", err.data.message);
    }
  };
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const res = await api.get(`/courses/${id}`);
        setCourse(res.data.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Không thể tải thông tin khóa học.",
        );
      } finally {
        setLoading(false);
      }
    };
    checkEnroll(id);
    fetchCourseData();
  }, [id]);
  const handleClick = () => {
    showAlert(
      "info",
      "Hãy đăng ký học",
      "Đăng ký học để có thể tiếp tục xem nội dung",
    );
  };
  const handleEnroll = async (courseId) => {
    try {
      await api.post("/student/enroll", { courseId });
      showAlert("success", "Thành công", "Đăng ký khóa học thành công!");
      navigate(`/course/${course.id}`, { replace: true });
    } catch (err) {
      if (err.response?.status === 401) {
        showAlert(
          "error",
          "Chưa đăng nhập",
          "Vui lòng đăng nhập để thực hiện chức năng này.",
        );
      } else {
        showAlert(
          "error",
          "Có lỗi xảy ra",
          err.response?.data?.message || "Đăng ký thất bại.",
        );
      }
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

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />
      {/* Hero Banner Section */}
      <div className="from-slate-900 to-slate-800 py-12 px-6 md:px-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="flex flex-col gap-3">
            <span
              onClick={() => navigate(-1)}
              className="cursor-pointer text-blue-500 hover:text-blue-700 transition text-sm font-medium"
            >
              ← Khám phá tiếp
            </span>
            <ImageModal
              src={course.thumbnail_url || "https://placehold.co/600x400"}
              alt={course.title}
              className="w-full md:w-64 aspect-video object-cover rounded-xl shadow-lg bg-slate-700"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-4xl font-extrabold mb-4">
              {course?.title}
            </h1>
            <p className="text-slate-700 text-sm md:text-base max-w-2xl leading-relaxed">
              {course?.description}
            </p>
          </div>
          {isStudent ? (
            <button
              disabled={isCurrentSubmitting}
              onClick={() => handleEnroll(course.id)}
              className={`p-2 font-bold rounded-xl text-sm transition text-white ${isCurrentSubmitting ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {isCurrentSubmitting ? "Đang đăng ký..." : "Đăng ký học"}
            </button>
          ) : (
            ""
          )}
        </div>
      </div>

      {/* Curriculum Section */}
      <div className="max-w-3xl mx-auto mt-10 px-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          Nội dung khóa học
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
          {course?.lessons?.length === 0 ? (
            <p className="p-6 text-center text-slate-400 text-sm">
              Nội dung bài giảng đang được biên soạn.
            </p>
          ) : (
            course?.lessons?.map((lesson, idx) => {
              return (
                <div
                  key={lesson.id}
                  onClick={() => handleClick()}
                  className={`flex items-center gap-4 p-4 cursor-pointer transition group hover:bg-slate-50`}
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
                  </div>

                  {/* Thông tin */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-sm font-semibold truncate text-slate-700 group-hover:text-blue-600`}
                    >
                      {lesson.title}
                    </h3>

                    <p className="text-xs text-slate-500 mt-1">
                      {lesson.video_url ? "🎥 Video" : ""}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseView;
