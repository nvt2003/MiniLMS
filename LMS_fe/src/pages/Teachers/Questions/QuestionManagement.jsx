import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import api from "../../../services/api";
import QuestionFormModal from "./QuestionFormModal";
import QuestionDetailModal from "./QuestionDetailModal";
import useAlert from "../../../Components/Alert/useAlert";
import { data } from "react-router-dom";
import Navbar from "../../../Components/Navbar";

export default function QuestionManagement() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [questionType, setQuestionType] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailQuestionId, setDetailQuestionId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 20;

  const { showAlert, confirm } = useAlert();

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/questions", {
        params: { search, question_type: questionType },
      });
      if (res.data.success) {
        setQuestions(res.data.data);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalItems(res.data.pagination.totalItems || 0);
        }
      }
    } catch (err) {
      if (err.response.status === 401) {
        showAlert(
          "error",
          "Hãy kiểm tra lại đăng nhập",
          "Tài khoản không thể dùng chức năng này",
        );
      }
      console.error("Lỗi lấy danh sách câu hỏi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [currentPage, search, questionType]);
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };
  const handleTypeChange = (e) => {
    setQuestionType(e.target.value);
    setCurrentPage(1);
  };
  const handleCreate = () => {
    setSelectedQuestionId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (id, e) => {
    if (e) e.stopPropagation();
    setSelectedQuestionId(id);
    setIsModalOpen(true);
    console.log("detail:", isDetailOpen);
  };
  const handleViewDetail = (id) => {
    setDetailQuestionId(id);
    setIsDetailOpen(true);
  };
  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) return;
    try {
      await api.delete(`/questions/${id}`);
      showAlert("success", "Xóa thành công!", "Câu hỏi đã được xóa");
      fetchQuestions();
    } catch (err) {
      showAlert("error", "Lỗi khi xóa câu hỏi", err?.response?.data?.message);
    }
  };

  return (
    <div>
      <Navbar />
      <h2>Quản lý câu hỏi</h2>

      {/* Filter & Actions */}
      <div className="flex gap-3 mb-6">
        <div className="flex items-center border border-slate-200 rounded-xl px-3 py-2 flex-1 bg-white focus-within:ring-2 focus-within:ring-blue-500">
          <Search size={18} className="text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Tìm kiếm nội dung câu hỏi..."
            value={search}
            onChange={handleSearchChange}
            className="w-full border-none outline-none text-sm"
          />
        </div>

        <select
          value={questionType}
          onChange={handleTypeChange}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả loại câu hỏi</option>
          <option value="single">Trắc nghiệm (1 đáp án)</option>
          <option value="multiple">Trắc nghiệm (Nhiều đáp án)</option>
          <option value="essay">Tự luận</option>
        </select>

        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all"
        >
          <Plus size={18} /> Tạo câu hỏi
        </button>
      </div>

      {/* Danh sách */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium">
          Đang tải câu hỏi...
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          Không tìm thấy câu hỏi nào.
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div
              key={q.id}
              onClick={() => handleViewDetail(q.id)}
              className="p-4 bg-white border border-slate-200 hover:border-blue-300 rounded-2xl cursor-pointer transition-all hover:shadow-md"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <span className="inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-slate-100 text-slate-600 uppercase mb-2">
                    {q.question_type}
                  </span>
                  <div
                    dangerouslySetInnerHTML={{ __html: q.content }}
                    className="text-slate-800 font-medium text-sm line-clamp-2"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetail(q.id);
                    }}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Xem chi tiết"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={(e) => handleEdit(q.id, e)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Sửa"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(q.id, e)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* THANH PHÂN TRANG (PAGINATION BAR) */}
      {!loading && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-slate-200 text-sm text-slate-600">
          <div>
            Hiển thị{" "}
            <span className="font-semibold text-slate-800">
              {(currentPage - 1) * limit + 1}
            </span>{" "}
            -{" "}
            <span className="font-semibold text-slate-800">
              {Math.min(currentPage * limit, totalItems)}
            </span>{" "}
            trên tổng số{" "}
            <span className="font-semibold text-slate-800">{totalItems}</span>{" "}
            câu hỏi
          </div>

          <div className="flex items-center gap-1">
            {/* Về trang đầu */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Trang đầu"
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Trang trước */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Trang trước"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Số trang */}
            <span className="px-3 py-1 font-medium text-slate-700">
              Trang {currentPage} / {totalPages}
            </span>

            {/* Trang sau */}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Trang sau"
            >
              <ChevronRight size={16} />
            </button>

            {/* Đến trang cuối */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Trang cuối"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
      {/* Component Modal Form */}
      <QuestionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        questionId={selectedQuestionId}
        onSuccess={fetchQuestions}
      />
      {/* Modal Xem chi tiết */}
      <QuestionDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        questionId={detailQuestionId}
        onEdit={(id) => {
          setSelectedQuestionId(id);
          setIsModalOpen(true);
        }}
      />
    </div>
  );
}
