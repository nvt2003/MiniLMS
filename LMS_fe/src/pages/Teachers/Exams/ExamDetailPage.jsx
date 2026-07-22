import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  BookOpen,
  HelpCircle,
  User,
  Award,
  FileText,
  Globe,
  Lock,
  Edit,
  Copy,
} from "lucide-react";
import ExamActionButtons from "./ExamActionButtons";
import api from "../../../services/api";
import QuestionDetailModal from "../Questions/QuestionDetailModal";
import useAlert from "../../../Components/Alert/useAlert";

const ExamDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [examDetail, setExamDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const { showAlert } = useAlert();

  useEffect(() => {
    const fetchExamDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const resData = await api.get(`/exams/${id}`);
        if (resData.data.success) {
          setExamDetail(resData.data.data);
        } else {
          setError(resData.data.message || "Không thể tải thông tin đề thi");
        }
      } catch (err) {
        console.error("Lỗi khi tải chi tiết đề thi:", err);
        setError("Lỗi kết nối máy chủ");
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetail();
  }, [id]);

  // Tính tổng điểm của đề thi
  const totalPoints =
    examDetail?.questions?.reduce(
      (sum, q) => sum + (parseFloat(q.points) || 0),
      0,
    ) || 0;
  const handleCopyExam = async (id) => {
    const res = await fetch(`/api/exams/${id}/copy`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const data = await res.json();
    if (data.success) {
      showAlert("success", "Sao chép thành công!");
      // Chuyển hướng tới đề thi mới vừa tạo nếu muốn
      navigate(`/teacher/exams/${data.data.id}`);
    }
  };
  const handleDeleteExam = async (id) => {
    const res = await api.delete(`/exams/${id}`);
    if (res.data.success) {
      showAlert("success", "Đã xóa đề thi");
      navigate("/teacher/exams");
    }
  };

  const handleOpenQuestion = (questionId) => {
    setSelectedQuestionId(questionId);
    setIsQuestionModalOpen(true);
  };

  const handleCloseQuestion = () => {
    setIsQuestionModalOpen(false);
    setSelectedQuestionId(null);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center text-gray-500 py-20">
        Đang tải thông tin đề thi...
      </div>
    );
  }

  if (error || !examDetail) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <button
          onClick={() => navigate("/teacher/exams")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} /> Quay lại danh sách
        </button>
        <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl border border-red-100">
          {error || "Không tìm thấy đề thi"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header & Điều hướng */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate("/teacher/exams")}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft size={18} />
          Quay lại danh sách đề thi
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/teacher/modify-exams/${id}`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-sm font-medium transition"
          >
            <Edit size={16} /> Chỉnh sửa
          </button>
          <ExamActionButtons
            examId={examDetail.id}
            examTitle={examDetail.title}
            onCopy={handleCopyExam}
            onDelete={handleDeleteExam}
          />
        </div>
      </div>

      {/* Thông tin chung Đề thi */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  examDetail.type === "test"
                    ? "bg-red-50 text-red-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {examDetail.type === "test" ? "Bài thi" : "Luyện tập"}
              </span>
              {examDetail.is_public === 1 ? (
                <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  <Globe size={12} /> Công khai
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                  <Lock size={12} /> Riêng tư
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {examDetail.title}
            </h1>
            {examDetail.description && (
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                {examDetail.description}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <BookOpen size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Khóa học</p>
              <p className="font-semibold text-gray-800">
                {examDetail.course_title || "Chưa gắn"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Thời gian làm bài</p>
              <p className="font-semibold text-gray-800">
                {examDetail.duration_minutes} phút
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <User size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Người tạo</p>
              <p className="font-semibold text-gray-800">
                {examDetail.creator_name || "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Award size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Tổng điểm</p>
              <p className="font-semibold text-blue-600">{totalPoints} điểm</p>
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách câu hỏi */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
            <HelpCircle size={18} className="text-blue-600" />
            Danh sách câu hỏi ({examDetail.questions?.length || 0} câu)
          </h2>
        </div>

        {!examDetail.questions || examDetail.questions.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-gray-200 rounded-xl text-center text-sm text-gray-400">
            Đề thi này chưa gắn câu hỏi nào.
          </div>
        ) : (
          <div className="space-y-4">
            {examDetail.questions.map((q, index) => (
              <div
                key={q.exam_question_id || index}
                className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition bg-gray-50/30 space-y-2"
                onClick={() => {
                  handleOpenQuestion(q.question_id);
                }}
              >
                <div className="flex justify-between items-start gap-4">
                  <span className="font-semibold text-sm text-gray-900 leading-relaxed">
                    Câu {q.position || index + 1}: {q.content}
                  </span>
                  <span className="shrink-0 text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-md font-medium border border-blue-100">
                    {q.points} điểm
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
                  <span className="bg-gray-100 px-2.5 py-1 rounded text-gray-600 font-medium">
                    Loại:{" "}
                    {q.question_type === "single"
                      ? "Trắc nghiệm 1 đáp án"
                      : q.question_type === "multiple"
                        ? "Nhiều đáp án"
                        : "Tự luận"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <QuestionDetailModal
        isOpen={isQuestionModalOpen}
        onClose={handleCloseQuestion}
        questionId={selectedQuestionId}
        onEdit={undefined}
      />
    </div>
  );
};

export default ExamDetailPage;
