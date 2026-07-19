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
  const [submittingId, setSubmittingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { showAlert } = useAlert();

  const navigate = useNavigate();

  // Hàm gọi API lấy dữ liệu
  const fetchCoursesData = async (searchQuery = "") => {
    setError("");
    try {
      // 1. Lấy khóa học hệ thống (kèm query search nếu có)
      const coursesRes = await api.get(`/courses?search=${searchQuery}`);
      setCourses(coursesRes?.data?.data || []);

      const token = localStorage.getItem("token");
      //kiem tra dang nhap
      if (token) {
        try {
          // 2. Lấy danh sách khóa học đã đăng ký của học viên này để đối chiếu cụm nút bấm
          const myCoursesRes = await api.get("/student/dashboard");
          const myEnrolledCourses = myCoursesRes.data.data || [];
          const enrolledIds = new Set(myEnrolledCourses.map((c) => c.id));

          setEnrolledCourseIds(enrolledIds);
        } catch (err) {
          // Token hết hạn hoặc API lỗi thì vẫn cho xem danh sách khóa học
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
    // Hàm gọi API lấy dữ liệu
    const fetchAllData = async () => {
      try {
        const coursesRes = await api.get(`/courses`);
        setCourses(coursesRes?.data?.data || []);

        const token = localStorage.getItem("token");

        if (token) {
          try {
            const myCoursesRes = await api.get("/student/dashboard");
            const myEnrolledCourses = myCoursesRes?.data?.data || [];
            const enrolledIds = new Set(myEnrolledCourses.map((c) => c.id));

            setEnrolledCourseIds(enrolledIds);
          } catch (err) {
            // Token hết hạn hoặc API lỗi thì vẫn cho xem danh sách khóa học
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
    fetchAllData();
  }, []);

  // Xử lý khi nhấn nút Tìm kiếm hoặc nhấn Enter
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchCoursesData(searchTerm);
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
                    {isEnrolled ? (
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
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default BrowseCourses;
