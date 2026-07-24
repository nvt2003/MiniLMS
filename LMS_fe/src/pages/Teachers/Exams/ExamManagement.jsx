import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  RotateCcw,
  Eye,
  Edit,
  Copy,
  Trash2,
  Clock,
  BookOpen,
  Globe,
  Lock,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ExamActionButtons from "./ExamActionButtons";
import Navbar from "../../../Components/Navbar";
import api from "../../../services/api";
import useAlert from "../../../Components/Alert/useAlert";

const ExamManagement = () => {
  const navigate = useNavigate();
  // State quản lý danh sách & phân trang
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0,
  });

  // State bộ lọc (Filter)
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    is_public: "",
    course_id: "",
  });

  // Gọi API lấy danh sách đề thi
  const fetchExams = async (page = 1) => {
    setLoading(true);
    try {
      const resData = await api.get(`/exams`, {
        params: {
          page,
          limit: pagination.limit,
          ...(filters.search && { search: filters.search }),
          ...(filters.type && { type: filters.type }),
          ...(filters.is_public !== "" && { is_public: filters.is_public }),
          ...(filters.course_id && { course_id: filters.course_id }),
        },
      });
      setExams(resData.data.data);
      setPagination(resData.data.pagination);
    } catch (error) {
      console.error("Lỗi khi tải danh sách đề thi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams(pagination.page);
  }, [pagination.page]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchExams(1);
  };

  const handleResetFilter = () => {
    setFilters({ search: "", type: "", is_public: "", course_id: "" });
  };

  const handleCopyExam = async (id) => {
    const res = await api.post(`/exams/${id}/copy`);
    if (res.data.success) {
      showAlert("success", "Sao chép thành công!");
      // Chuyển hướng tới đề thi mới vừa tạo nếu muốn
      navigate(`/teacher/exams/${res.data.data.id}`);
    }
  };
  const handleDeleteExam = async (id) => {
    const res = await api.delete(`/exams/${id}`);
    if (res.data.success) {
      showAlert("success", "Đã xóa đề thi");
      fetchExams(pagination.page);
    }
  };
  return (
    <div>
      <Navbar />
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header & Nút Tạo mới */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quản lý Đề thi</h1>
            <p className="text-sm text-gray-500 mt-1">
              Danh sách đề thi do bạn tạo và các đề thi công khai
            </p>
          </div>
          <button
            onClick={() => navigate(`/teacher/modify-exams`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition flex items-center gap-2 text-sm"
          >
            <Plus size={18} />
            Tạo đề thi mới
          </button>
        </div>

        {/* Bộ lọc (Filter) */}
        <form
          onSubmit={handleFilterSubmit}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Tên đề thi..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
              Loại đề
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Tất cả</option>
              <option value="practice">Luyện tập (Practice)</option>
              <option value="test">Bài thi (Test)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
              Chế độ chia sẻ
            </label>
            <select
              value={filters.is_public}
              onChange={(e) =>
                setFilters({ ...filters, is_public: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Tất cả</option>
              <option value="1">Công khai</option>
              <option value="0">Riêng tư</option>
            </select>
          </div>

          <div className="flex gap-2 col-span-2 md:col-span-2">
            <button
              type="submit"
              className="flex-1 bg-gray-900 hover:bg-black text-white py-2 rounded-lg font-medium text-sm transition flex items-center justify-center gap-1.5"
            >
              <Search size={16} /> Lọc
            </button>
            <button
              type="button"
              onClick={handleResetFilter}
              className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-medium text-sm transition flex items-center gap-1"
              title="Đặt lại"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </form>

        {/* Bảng Danh sách Đề thi */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">STT</th>
                  <th className="py-3.5 px-4">Tiêu đề đề thi</th>
                  <th className="py-3.5 px-4">Khóa học</th>
                  <th className="py-3.5 px-4">Loại</th>
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-4">Chế độ</th>
                  <th className="py-3.5 px-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : exams.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      Không tìm thấy đề thi nào
                    </td>
                  </tr>
                ) : (
                  exams.map((exam, index) => (
                    <tr
                      key={exam.id}
                      className="hover:bg-gray-50/80 transition"
                    >
                      <td className="py-4 px-4 text-center text-gray-400 font-medium">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </td>
                      <td className="py-4 px-4 font-medium text-gray-900">
                        <div className="line-clamp-1">{exam.title}</div>
                        {exam.creator_name && (
                          <span className="text-xs text-gray-400 font-normal">
                            Tác giả: {exam.creator_name}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 px-2.5 py-1 rounded-md text-gray-700">
                          <BookOpen size={13} className="text-gray-400" />
                          {exam.course_title || "Chưa gắn"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            exam.type === "test"
                              ? "bg-red-50 text-red-700 border border-red-100"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          }`}
                        >
                          {exam.type === "test" ? "Bài thi" : "Luyện tập"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Clock size={14} className="text-gray-400" />
                          {exam.duration_minutes} phút
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {exam.is_public === 1 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            <Globe size={12} /> Công khai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                            <Lock size={12} /> Riêng tư
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-center items-center gap-1">
                          <button
                            onClick={() =>
                              navigate(`/teacher/exams/${exam.id}`)
                            }
                            className="p-1.5 hover:bg-gray-100 text-gray-600 hover:text-gray-900 rounded-lg transition"
                            title="Xem chi tiết"
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            onClick={() =>
                              navigate(`/teacher/modify-exams/${exam.id}`)
                            }
                            className="p-1.5 hover:bg-amber-50 text-amber-600 hover:text-amber-800 rounded-lg transition"
                            title="Chỉnh sửa"
                          >
                            <Edit size={17} />
                          </button>
                          <ExamActionButtons
                            examId={exam.id}
                            examTitle={exam.title}
                            onCopy={handleCopyExam}
                            onDelete={handleDeleteExam}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang (Pagination) */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t border-gray-200 text-sm">
              <span className="text-gray-500">
                Trang{" "}
                <span className="font-semibold text-gray-700">
                  {pagination.page}
                </span>{" "}
                / {pagination.totalPages} (Tổng {pagination.total} đề)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page === 1}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  className="p-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  className="p-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamManagement;
