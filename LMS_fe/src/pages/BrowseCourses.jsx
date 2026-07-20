// src/pages/BrowseCourses.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../Components/Navbar";
import useAlert from "../Components/Alert/useAlert";
import ImageModal from "../Components/ImageModal";

const BrowseCourses = () => {
  const [courses, setCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isStudent, setIsStudent] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [submittingId, setSubmittingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const { showAlert } = useAlert();

  const navigate = useNavigate();

  const fetchCoursesData = async (searchQuery = "", currentPage = 1) => {
    setError("");

    try {
      const coursesRes = await api.get(
        `/courses?search=${searchQuery}&page=${currentPage}&limit=${limit}`,
      );

      setCourses(coursesRes.data.data.data || []);
      setTotalPages(coursesRes.data.data.totalPages || 1);

      const token = localStorage.getItem("token");
      const role = localStorage.getItem("userRole");
      setIsStudent(role === "student");

      if (token) {
        try {
          const myCoursesRes = await api.get("/student/dashboard");
          const enrolledIds = new Set(
            (myCoursesRes.data.data || []).map((c) => c.id),
          );

          setEnrolledCourseIds(new Set(enrolledIds));
        } catch (err) {
          console.log("Không lấy được khóa học đã đăng ký:", err);
          setEnrolledCourseIds(new Set());
        }
      } else {
        setEnrolledCourseIds(new Set());
      }
    } catch (err) {
      setError("Không thể tải danh sách khóa học.");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // Chạy lần đầu tiên khi vào trang
  useEffect(() => {
    fetchCoursesData(searchTerm, page);
  }, [page, searchTerm]);

  // Xử lý khi nhấn nút Tìm kiếm hoặc nhấn Enter
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setPage(1);
  };

  const handleEnroll = async (courseId) => {
    setSubmittingId(courseId);
    try {
      await api.post("/student/enroll", { courseId });
      showAlert("success", "Thành công", "Đăng ký khóa học thành công!");
      setEnrolledCourseIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(courseId);
        return newSet;
      });
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
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading && courses.length === 0)
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Đang tải dữ liệu...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800">
              Thư viện khóa học
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Tìm kiếm khóa học phù hợp với định hướng của bạn.
            </p>
          </div>

          {/* THANH TÌM KIẾM (SEARCH BAR) */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex gap-2 w-full md:w-96"
          >
            <input
              type="text"
              placeholder="Nhập tên khóa học, mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition shadow-sm"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition"
            >
              Tìm
            </button>
          </form>
        </div>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        {/* DANH SÁCH KHÓA HỌC */}
        {courses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
            <p className="text-slate-500">
              Không tìm thấy khóa học nào phù hợp với từ khóa của bạn.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
                className="px-4 py-2 bg-white border rounded-xl hover:bg-slate-100 text-sm"
              >
                {viewMode === "grid" ? "🔲 Lưới" : "📋 Danh sách"}
              </button>
            </div>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => {
                  const isEnrolled = enrolledCourseIds.has(course.id);
                  const isCurrentSubmitting = submittingId === course.id;

                  return (
                    <div
                      key={course.id}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition"
                    >
                      <div>
                        <ImageModal
                          src={
                            course.thumbnail_url ||
                            "https://images.unsplash.com/photo-1516321318423-f06f85e504b3"
                          }
                          alt={course.title}
                          className="w-full h-44 object-cover rounded-xl mb-4 bg-slate-100"
                        />
                        <h4
                          className="font-bold text-slate-800 text-lg mb-2 line-clamp-1 hover:text-blue-700"
                          onClick={() => navigate(`/view-course/${course.id}`)}
                        >
                          {course.title}
                        </h4>
                        <p className="text-slate-500 text-sm line-clamp-2 mb-6">
                          {course.description || "Chưa có mô tả."}
                        </p>
                      </div>

                      <div>
                        {isStudent ? (
                          isEnrolled ? (
                            <button
                              onClick={() => navigate(`/course/${course.id}`)}
                              className="w-full py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold rounded-xl text-sm transition"
                            >
                              Vào học ngay →
                            </button>
                          ) : (
                            <button
                              disabled={isCurrentSubmitting}
                              onClick={() => handleEnroll(course.id)}
                              className={`w-full py-2.5 font-bold rounded-xl text-sm transition text-white ${isCurrentSubmitting ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"}`}
                            >
                              {isCurrentSubmitting
                                ? "Đang đăng ký..."
                                : "Đăng ký học"}
                            </button>
                          )
                        ) : (
                          ""
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {courses.map((course) => {
                  const isEnrolled = enrolledCourseIds.has(course.id);
                  const isCurrentSubmitting = submittingId === course.id;

                  return (
                    <div
                      key={course.id}
                      className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-5 py-4 hover:bg-slate-50 transition"
                    >
                      <div className="flex-1">
                        <h4
                          className="font-semibold text-lg text-slate-800 cursor-pointer hover:text-blue-600"
                          onClick={() => navigate(`/view-course/${course.id}`)}
                        >
                          {course.title}
                        </h4>

                        <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                          {course.description || "Chưa có mô tả."}
                        </p>
                      </div>

                      {isStudent && (
                        <div className="ml-6">
                          {isEnrolled ? (
                            <button
                              onClick={() => navigate(`/course/${course.id}`)}
                              className="px-5 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg font-semibold"
                            >
                              Vào học
                            </button>
                          ) : (
                            <button
                              disabled={isCurrentSubmitting}
                              onClick={() => handleEnroll(course.id)}
                              className={`px-5 py-2 rounded-lg font-semibold text-white ${
                                isCurrentSubmitting
                                  ? "bg-blue-300"
                                  : "bg-blue-600 hover:bg-blue-700"
                              }`}
                            >
                              {isCurrentSubmitting
                                ? "Đang đăng ký..."
                                : "Đăng ký"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              disabled={page === 1}
              onClick={() => {
                setPage(page - 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-4 py-2 rounded-lg border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              ← Trước
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => {
                  setPage(i + 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`w-10 h-10 rounded-lg ${
                  page === i + 1
                    ? "bg-blue-600 text-white"
                    : "bg-white border hover:bg-slate-100"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={page === totalPages}
              onClick={() => {
                setPage(page + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-4 py-2 rounded-lg border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              Sau →
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default BrowseCourses;
