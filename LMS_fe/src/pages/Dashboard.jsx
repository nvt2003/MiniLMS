import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../Components/Navbar";
import useAlert from "../Components/Alert/useAlert";
import ImageModal from "../Components/ImageModal";

const Dashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { showAlert, confirm } = useAlert();

  // Lấy vai trò của người dùng từ localStorage
  const userRole = localStorage.getItem("userRole");
  const userData = JSON.parse(localStorage.getItem("userData"));

  const fetchDashboardData = async () => {
    try {
      if (userRole === "teacher") {
        // Giáo viên: Lấy toàn bộ danh sách khóa học hệ thống công khai để quản lý
        console.log("/courses?teacherId=", userData.id);
        const res = await api.get("/courses", {
          params: {
            teacherId: userData.id,
          },
        });
        setCourses(res?.data?.data || []);
      } else {
        if (userRole === "student") {
          // Học sinh: Lấy danh sách khóa học ĐÃ ĐĂNG KÝ kèm tiến độ (%)
          const res = await api.get("/student/dashboard");
          setCourses(res?.data?.data || []);
        } else {
          setError("Chưa đăng nhập! Hãy đăng nhập để tải dữ liệu");
        }
      }
    } catch (err) {
      setError("Không thể tải dữ liệu. Vui lòng đăng nhập lại!");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDashboardData();
  }, [userRole]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Đang tải dữ liệu...
      </div>
    );
  if (error)
    return (
      <div>
        <Navbar />
        <div className="text-4xl font-bold m-3">Khóa học của tôi</div>
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center justify-center text-red-500 my-5">
            {error}
          </div>
          <h5 className="m-3">hoặc</h5>
          <Link className="text-blue-600 font-bold my-5" to={"/browse-courses"}>
            Khám phá khóa học
          </Link>
        </div>
      </div>
    );

  const handleDeleteCourse = async (courseId, courseTitle) => {
    try {
      // Gọi API xóa dữ liệu
      confirm(
        "Xóa khóa học",
        `Bạn có chắc chắn muốn xóa khóa học "${courseTitle}"`,
        async () => {
          (await api.delete(`/courses/${courseId}`),
            showAlert("success", "Thành công", "Xóa khóa học thành công!"));
          setCourses(courses.filter((course) => course.id !== courseId));
        },
      );
    } catch (err) {
      showAlert(
        "error",
        "Lỗi",
        `err.response?.data?.message || "Không thể xóa khóa học này.`,
      );
      setError(`err.response?.data?.message || "Không thể xóa khóa học này.`);
    }
  };
  const handleUnenroll = async (courseId, courseTitle) => {
    try {
      confirm(
        "Hủy tham gia khóa học",
        `Tiến trình sẽ bị mất, bạn có chắc chắn muốn bỏ tham gia khóa học "${courseTitle}"`,
        async () => {
          const res = await api.delete(`/enrollments/${courseId}/unenroll`);
          showAlert("success", "Thành công", res.data.message);
          fetchDashboardData();
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
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* 2. NỘI DUNG CHÍNH */}
      <main className="p-6 max-w-7xl mx-auto">
        {/* ================= GIAO DIỆN GIÁO VIÊN ================= */}
        {userRole === "teacher" && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-800">
                  Bảng điều khiển Giáo viên
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  Quản lý và cập nhật nội dung bài giảng của bạn tại đây.
                </p>
              </div>
              <button
                onClick={() => navigate("/teacher/create-course")}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition shadow-lg shadow-blue-100 text-sm"
              >
                + Tạo khóa học mới
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-700 mb-4">
              Danh sách khóa học trên hệ thống
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between"
                >
                  <div>
                    <ImageModal
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <h4 className="font-bold text-slate-800 text-lg mb-2 line-clamp-1">
                      {course.title}
                    </h4>
                    <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                      {course.description}
                    </p>
                  </div>

                  {/* HÀNG NÚT ĐIỀU KHIỂN MỚI */}
                  <div className="space-y-2 mt-2">
                    <button
                      onClick={() => navigate(`/teacher/course/${course.id}`)}
                      className="w-full py-2 bg-blue-50 text-blue-600 font-semibold rounded-xl text-xs transition hover:bg-blue-100"
                    >
                      Quản lý bài học →
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          navigate(`/teacher/edit-course/${course.id}`)
                        }
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs transition"
                      >
                        Sửa thông tin
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteCourse(course.id, course.title)
                        }
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl text-xs transition"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= GIAO DIỆN HỌC SINH ================= */}
        {userRole !== "teacher" && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-slate-800">
                Khóa học của tôi
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Theo dõi tiến độ học tập và tiếp tục các bài giảng dở dang.
              </p>
            </div>

            {courses.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500">
                  Bạn chưa tham gia khóa học nào.
                </p>
                <button
                  onClick={() => navigate("/browse-courses")}
                  className="mt-4 text-sm font-bold text-blue-600 hover:underline"
                >
                  Khám phá các khóa học ngay
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between"
                  >
                    <div>
                      <ImageModal
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <h4
                        className="font-bold text-slate-800 text-lg mb-2 line-clamp-1"
                        onClick={() => navigate(`/course/${course.id}`)}
                      >
                        {course.title}
                      </h4>

                      {/* Thanh Tiến Độ Học Tập (%) */}
                      <div className="mt-4 mb-5">
                        <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                          <span>Tiến độ</span>
                          <span className="text-blue-600 font-bold">
                            {course.progress_percentage || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full transition-all duration-500"
                            style={{
                              width: `${course.progress_percentage || 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/course/${course.id}`)}
                      className="w-full py-2.5 m-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-md shadow-blue-100"
                    >
                      Vào học ngay
                    </button>
                    <button
                      onClick={() => handleUnenroll(course.id, course.title)}
                      className="w-full py-2.5 m-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition shadow-md shadow-blue-100"
                    >
                      Hủy tham gia
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
