import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  History,
  ArrowLeft,
  MessageSquare,
  FileText,
} from "lucide-react";
import Navbar from "../../Components/Navbar";
import AttemptsModal from "./AttemptsModal";
import useAlert from "../../Components/Alert/useAlert";

const ExamResultPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/attempts/result/${attemptId}`);
        if (res.data.success) {
          setResult(res.data.data);
        }
      } catch (err) {
        console.error("Lỗi lấy kết quả bài thi:", err);
        showAlert(
          "error",
          "Lỗi",
          err.response?.data?.message || "Không thể tải kết quả bài thi!",
        );
      } finally {
        setLoading(false);
      }
    };

    if (attemptId) fetchResult();
    if (!attemptId) setLoading(false);
  }, [attemptId]);
  // Xử lý khi học sinh chọn 1 bài thi từ Modal
  const handleSelectAttempt = (newAttemptId) => {
    if (newAttemptId !== Number(attemptId)) {
      navigate(`/student/exams/result/${newAttemptId}`);
    }
  };
  // Format thời gian
  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleString("vi-VN");
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Đang tải kết quả...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <p className="text-gray-600 text-lg mb-4">
            Không tìm thấy dữ liệu kết quả bài thi.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all"
          >
            <History size={16} /> Xem lại các bài thi
          </button>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            <ArrowLeft size={18} /> Quay lại
          </button>
        </div>

        <AttemptsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          currentAttemptId={attemptId}
          onSelectAttempt={handleSelectAttempt}
        />
      </div>
    );
  }

  const isGraded = result.status === "graded";

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 mt-6 space-y-6">
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-all"
            >
              <ArrowLeft size={20} /> Quay lại
            </button>
            <h1 className="text-lg font-bold text-gray-800 line-clamp-1">
              Kết quả: {result.exam_title}
            </h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all"
            >
              <History size={16} /> Các bài thi khác
            </button>
          </div>
        </div>
        {/* TỔNG QUAN KẾT QUẢ / TỔNG ĐIỂM */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {/* Cột 1: Điểm số */}
          <div className="flex flex-col items-center justify-center pt-4 md:pt-0">
            <Award
              className={`mb-2 ${isGraded ? "text-amber-500" : "text-gray-400"}`}
              size={36}
            />
            <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">
              Điểm tổng kết
            </span>
            {isGraded ? (
              <div className="text-4xl font-extrabold text-blue-600">
                {result.total_score !== null
                  ? Number(result.total_score).toFixed(1)
                  : 0}
              </div>
            ) : (
              <div className="text-lg font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Chờ giáo viên chấm
              </div>
            )}
          </div>

          {/* Cột 2: Trạng thái */}
          <div className="flex flex-col items-center justify-center pt-4 md:pt-0">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
              Trạng thái
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                isGraded
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {isGraded ? "Đã chấm điểm" : "Đã nộp (Chờ chấm tự luận)"}
            </span>
          </div>

          {/* Cột 3: Thời gian làm bài */}
          <div className="flex flex-col items-center justify-center pt-4 md:pt-0 space-y-1 text-xs text-gray-600">
            <Clock className="text-gray-400 mb-1" size={24} />
            <p>
              <span className="font-medium text-gray-800">Bắt đầu:</span>{" "}
              {formatDate(result.start_time)}
            </p>
            <p>
              <span className="font-medium text-gray-800">Nộp bài:</span>{" "}
              {formatDate(result.submit_time)}
            </p>
          </div>
        </div>

        {/* DANH SÁCH CHI TIẾT CÂU HỎI */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FileText size={20} /> Chi tiết bài làm
          </h2>

          {result.answers?.map((ans, idx) => {
            return (
              <div
                key={ans.question_id || idx}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4"
              >
                {/* Header câu hỏi */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-100 text-gray-800 font-bold px-3 py-1 rounded-md text-sm">
                      Câu {idx + 1}
                    </span>
                    <span className="bg-gray-100 text-gray-800 font-bold px-3 py-1 rounded-md text-sm">
                      {ans.content}
                    </span>
                    <span className="text-xs bg-gray-50 text-gray-500 border px-2 py-1 rounded capitalize">
                      {ans.question_type === "single"
                        ? "Trắc nghiệm 1 đáp án"
                        : ans.question_type === "multiple"
                          ? "Trắc nghiệm nhiều đáp án"
                          : "Tự luận"}
                    </span>
                  </div>

                  {/* Icon Đúng / Sai / Điểm số */}
                  <div className="flex items-center gap-2">
                    {ans.question_type !== "essay" && (
                      <>
                        {ans.is_correct === 1 && (
                          <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
                            <CheckCircle2 size={16} /> Chính xác (+
                            {ans.score_given || 0})
                          </span>
                        )}
                        {ans.is_correct === 0 && (
                          <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                            <XCircle size={16} /> Chưa đúng (0/{ans.max_points})
                          </span>
                        )}
                      </>
                    )}
                    {ans.question_type === "essay" && (
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                        {ans.score_given !== null
                          ? `Điểm: ${ans.score_given}/${ans.max_points}`
                          : `Tối đa ${ans.max_points} điểm`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Nội dung câu hỏi */}
                <div className="text-gray-800 font-medium leading-relaxed">
                  {ans.question_content}
                </div>

                {/* HIỂN THỊ CÂU TRẢ LỜI CHO CÂU TỰ LUẬN */}
                {ans.question_type === "essay" && (
                  <div className="space-y-3 pt-2">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 font-medium mb-1">
                        Bài làm của sinh viên:
                      </p>
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {ans.essay_answer || (
                          <span className="italic text-gray-400">
                            Không trả lời
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Nhận xét của Giáo viên */}
                    {ans.teacher_comment && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-3">
                        <MessageSquare
                          className="text-blue-600 mt-0.5 flex-shrink-0"
                          size={18}
                        />
                        <div>
                          <p className="text-xs font-bold text-blue-900">
                            Nhận xét từ giáo viên:
                          </p>
                          <p className="text-sm text-blue-800 mt-0.5">
                            {ans.teacher_comment}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* HIỂN THỊ CÂU TRẢ LỜI CHO TRẮC NGHIỆM (SINGLE & MULTIPLE) */}
                {ans.question_type !== "essay" && (
                  <div className="pt-2 text-sm space-y-2">
                    {ans.answers?.map((a) => (
                      <div
                        className={`p-3 bg-gray-50 rounded-lg border ${a.is_choice === 1 ? "border-blue-500" : "border-gray-200"} `}
                      >
                        <span
                          className={`font-semibold ${a.is_choice === 1 && a.is_correct !== 1 ? "text-red-500" : a.is_correct === 1 ? "text-green-700" : "text-gray-300"}`}
                        >
                          {a.content}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* TÍCH HỢP MODAL VÀO TRANG */}
      <AttemptsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentAttemptId={attemptId}
        onSelectAttempt={handleSelectAttempt}
      />
    </div>
  );
};

export default ExamResultPage;
