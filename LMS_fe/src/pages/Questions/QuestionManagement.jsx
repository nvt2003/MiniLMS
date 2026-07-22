import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, Edit, Eye } from "lucide-react";
import api from "../services/api";
import QuestionFormModal from "./QuestionFormModal";
import QuestionDetailModal from "./QuestionDetailModal";
import useAlert from "../../Components/Alert/useAlert";
import { data } from "react-router-dom";
import Navbar from "../../Components/Navbar";

export default function QuestionManagement() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [questionType, setQuestionType] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const { showAlert, confirm } = useAlert();

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailQuestionId, setDetailQuestionId] = useState(null);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/questions", {
        params: { search, question_type: questionType },
      });
      if (res.data.success) {
        setQuestions(res.data.data);
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
  }, [search, questionType]);

  const handleCreate = () => {
    setSelectedQuestionId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (id) => {
    setSelectedQuestionId(id);
    setIsModalOpen(true);
  };
  const handleViewDetail = (id) => {
    setDetailQuestionId(id);
    setIsDetailOpen(true);
  };
  const handleDelete = async (id) => {
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
    <div
      style={{
        padding: "24px",
        maxWidth: "1000px",
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >
      <Navbar />
      <h2>Quản lý câu hỏi</h2>

      {/* Filter & Actions */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            border: "1px solid #ccc",
            borderRadius: "6px",
            padding: "0 8px",
            flex: 1,
          }}
        >
          <Search size={18} color="#666" />
          <input
            type="text"
            placeholder="Tìm kiếm nội dung..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              padding: "8px",
              width: "100%",
            }}
          />
        </div>

        <select
          value={questionType}
          onChange={(e) => setQuestionType(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        >
          <option value="">Tất cả loại câu hỏi</option>
          <option value="single">Trắc nghiệm (1 đáp án)</option>
          <option value="multiple">Trắc nghiệm (Nhiều đáp án)</option>
          <option value="essay">Tự luận</option>
        </select>

        <button
          onClick={handleCreate}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            backgroundColor: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          <Plus size={18} /> Tạo câu hỏi
        </button>
      </div>

      {/* Danh sách */}
      {loading ? (
        <p>Đang tải...</p>
      ) : questions.length === 0 ? (
        <p>Không có câu hỏi nào.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {questions.map((q) => (
            <div
              key={q.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "16px",
                backgroundColor: "#fff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <span
                    style={{
                      fontSize: "12px",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      backgroundColor: "#e0e7ff",
                      color: "#3730a3",
                      fontWeight: "bold",
                    }}
                  >
                    {q.question_type}
                  </span>
                  <div
                    dangerouslySetInnerHTML={{ __html: q.content }}
                    style={{ marginTop: "8px" }}
                  />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
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
                    onClick={() => handleEdit(q.id)}
                    style={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: "#4f46e5",
                    }}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    style={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: "#ef4444",
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
          setEditingQuestionId(id);
          setIsFormOpen(true);
        }}
      />
    </div>
  );
}
