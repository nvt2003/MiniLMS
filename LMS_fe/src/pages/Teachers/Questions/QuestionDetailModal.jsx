import React, { useState, useEffect } from "react";
import { X, CheckCircle2, Circle, HelpCircle, Edit3 } from "lucide-react";
import api from "../../../services/api";

export default function QuestionDetailModal({
  isOpen,
  onClose,
  questionId,
  onEdit,
}) {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (questionId && isOpen) {
      setLoading(true);
      api
        .get(`/questions/${questionId}`)
        .then((res) => {
          setQuestion(res.data.data);
        })
        .catch((err) => {
          console.error("Lỗi lấy chi tiết câu hỏi:", err);
        })
        .finally(() => setLoading(false));
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    } else {
      setQuestion(null);
    }
  }, [questionId, isOpen]);

  if (!isOpen) return null;

  // Helper hiển thị nhãn loại câu hỏi
  const renderTypeBadge = (type) => {
    switch (type) {
      case "single":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            Trắc nghiệm (1 đáp án)
          </span>
        );
      case "multiple":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
            Trắc nghiệm (Nhiều đáp án)
          </span>
        );
      case "essay":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
            Tự luận
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6">
          {/* Header Modal */}
          <div className="flex justify-between items-center pb-4 mb-4 border-b">
            <div className="flex items-center gap-2">
              <HelpCircle size={20} className="text-blue-600" />
              <h3 className="text-lg font-bold text-slate-800">
                Chi Tiết Câu Hỏi
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 font-medium">
              Đang tải dữ liệu câu hỏi...
            </div>
          ) : !question ? (
            <div className="py-8 text-center text-red-500">
              Không tìm thấy thông tin câu hỏi.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tag Loại câu hỏi */}
              <div>{renderTypeBadge(question.question_type)}</div>

              {/* Nội dung câu hỏi (Render HTML để hiển thị cả ảnh nếu có) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Nội dung đề bài
                </span>
                <div
                  className="text-slate-800 font-medium text-base prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: question.content }}
                />
              </div>

              {/* Danh sách đáp án */}
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  {question.question_type === "essay"
                    ? "Hướng dẫn / Đáp án tự luận"
                    : "Danh sách lựa chọn"}
                </span>

                {question.question_type === "essay" ? (
                  <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 text-slate-700 text-sm">
                    {question.essay_guide ||
                      "Không có gợi ý đáp án cho câu tự luận này."}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {question.answers?.map((ans, idx) => {
                      const isCorrect = ans.is_correct;
                      return (
                        <div
                          key={ans.id || idx}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm transition-all ${
                            isCorrect
                              ? "bg-emerald-50/70 border-emerald-300 text-emerald-900 font-medium"
                              : "bg-white border-slate-200 text-slate-700"
                          }`}
                        >
                          {/* Icon trạng thái đúng / sai */}
                          <div className="mt-0.5 shrink-0">
                            {isCorrect ? (
                              <CheckCircle2
                                size={18}
                                className="text-emerald-600"
                              />
                            ) : (
                              <Circle size={18} className="text-slate-300" />
                            )}
                          </div>

                          {/* Nội dung đáp án */}
                          <div className="flex-1 leading-relaxed">
                            {ans.content}
                          </div>

                          {/* Badge đáp án đúng */}
                          {isCorrect && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 shrink-0">
                              Đáp án đúng
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition-all text-sm"
                >
                  Đóng
                </button>

                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEdit(question.id);
                    }}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all text-sm"
                  >
                    <Edit3 size={16} /> Chỉnh sửa
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
