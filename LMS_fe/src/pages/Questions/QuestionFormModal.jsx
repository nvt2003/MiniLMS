import React, { useState, useEffect } from "react";
import { X, Image as ImageIcon, Type, AlertTriangle } from "lucide-react";
import api from "../../services/api";
import TextEditor from "../../Components/TextEditor";

export default function QuestionFormModal({
  isOpen,
  onClose,
  questionId,
  onSuccess,
  showAlert,
}) {
  const [useRichText, setUseRichText] = useState(false);
  const [content, setContent] = useState("");
  const [formType, setFormType] = useState("single");
  const [answers, setAnswers] = useState([
    { content: "", is_correct: false },
    { content: "", is_correct: false },
  ]);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load thông tin câu hỏi khi sửa
  useEffect(() => {
    setErrorMessage("");
    if (questionId && isOpen) {
      setLoading(true);
      api
        .get(`/questions/${questionId}`)
        .then((res) => {
          const q = res.data.data;
          setContent(q.content || "");
          setFormType(q.question_type || "single");
          setAnswers(
            q.answers?.length > 0
              ? q.answers
              : [
                  { content: "", is_correct: false },
                  { content: "", is_correct: false },
                ],
          );

          // Nếu câu hỏi cũ có chứa thẻ <img> hoặc HTML thì tự động bật RichText
          const hasHtml = /<[a-z][\s\S]*>/i.test(q.content || "");
          setUseRichText(hasHtml);

          // Lưu danh sách ảnh đã liên kết trước đó
          setUploadedImages(q.images || []);
        })
        .catch((err) => {
          console.error("Lỗi lấy chi tiết câu hỏi:", err);
          if (showAlert) showAlert("error", "Lỗi", "Không thể tải câu hỏi");
        })
        .finally(() => setLoading(false));
    } else if (isOpen) {
      // Reset khi mở form thêm mới
      setContent("");
      setFormType("single");
      setUseRichText(false);
      setAnswers([
        { content: "", is_correct: false },
        { content: "", is_correct: false },
      ]);
      setUploadedImages([]);
    }
  }, [questionId, isOpen]);

  // Nhận callback khi TextEditor upload thành công 1 ảnh
  const handleImageUploaded = (imageData) => {
    // imageData format: { id, url }
    if (imageData?.id) {
      setUploadedImages((prev) => [...prev, imageData]);
    }
  };

  // Quản lý danh sách đáp án trắc nghiệm
  const handleAnswerChange = (index, field, value) => {
    const newAnswers = [...answers];
    if (field === "is_correct" && formType === "single") {
      newAnswers.forEach((ans, i) => {
        ans.is_correct = i === index ? value : false;
      });
    } else {
      newAnswers[index][field] = value;
    }
    setAnswers(newAnswers);
  };

  const handleAddAnswer = () => {
    setAnswers([...answers, { content: "", is_correct: false }]);
  };

  const handleRemoveAnswer = (index) => {
    setAnswers(answers.filter((_, i) => i !== index));
  };

  // Submit Form - Xử lý lọc ảnh rác Cloudinary
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!content.trim()) {
      if (showAlert)
        // showAlert("warning", "Cảnh báo", "Vui lòng nhập nội dung câu hỏi!");
        setErrorMessage("Vui lòng nhập nội dung câu hỏi!");
      return;
    }
    //KIỂM TRA ĐÁP ÁN ĐÚNG (Dành cho Trắc nghiệm)
    if (formType !== "essay") {
      const hasCorrectAnswer = answers.some((ans) => ans.is_correct === true);

      if (!hasCorrectAnswer) {
        setErrorMessage(
          "Vui lòng tích chọn ít nhất một đáp án đúng trước khi lưu!",
        );
        if (showAlert) {
          showAlert(
            "error",
            "Chưa chọn đáp án đúng",
            "Vui lòng tích chọn đáp án đúng cho câu hỏi!",
          );
        }
        return;
      }
    }
    setSubmitting(true);

    try {
      let keepImageIds = [];
      let deletedImages = [];

      // Nếu đang bật chế độ RichText, tiến hành lọc ảnh trong HTML
      if (useRichText) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "text/html");

        // Lấy tất cả src của thẻ <img> còn nằm trong Editor
        const currentUrls = [...doc.querySelectorAll("img")].map(
          (img) => img.src,
        );

        // Ảnh thực sự còn dùng trong Editor
        keepImageIds = uploadedImages
          .filter((img) => currentUrls.includes(img.url))
          .map((img) => img.id);

        // Ảnh đã chèn vào nhưng sau đó bị bấm xóa khỏi Editor
        deletedImages = uploadedImages.filter(
          (img) => !currentUrls.includes(img.url),
        );
      }

      const payload = {
        content,
        question_type: formType,
        answers: formType === "essay" ? [] : answers,
        imageIds: keepImageIds, // Chỉ gửi các ID ảnh còn thực sự tồn tại
      };

      if (questionId) {
        // Cập nhật câu hỏi
        await api.put(`/questions/${questionId}`, payload);
      } else {
        // Tạo mới câu hỏi
        await api.post("/questions", payload);
      }

      // Xóa các ảnh rác đã bị người dùng xóa khỏi Editor
      for (const image of deletedImages) {
        try {
          await api.delete(`/images/${image.id}`);
        } catch (err) {
          console.warn(`Không thể xóa ảnh thừa ID ${image.id}:`, err);
        }
      }

      if (showAlert) {
        showAlert(
          "success",
          "Thành công",
          questionId
            ? "Cập nhật câu hỏi thành công!"
            : "Tạo câu hỏi mới thành công!",
        );
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Lỗi khi lưu câu hỏi:", err);
      if (showAlert) {
        showAlert(
          "error",
          "Thất bại",
          err.response?.data?.message || "Có lỗi xảy ra!",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6">
        {/* Header Modal */}
        <div className="flex justify-between items-center pb-4 mb-4 border-b">
          <h3 className="text-xl font-bold text-slate-800">
            {questionId ? "Chỉnh Sửa Câu Hỏi" : "Tạo Câu Hỏi Mới"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <X size={20} />
          </button>
        </div>
        {/* KHUNG CẢNH BÁO LỖI (Hiển thị khi thiếu thông tin/chưa chọn đáp án đúng) */}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm font-medium animate-shake">
            <AlertTriangle size={20} className="shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}
        {loading ? (
          <div className="py-12 text-center text-slate-500 font-medium">
            Đang tải dữ liệu câu hỏi...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Loại câu hỏi */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Loại câu hỏi
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="single">Trắc nghiệm (1 đáp án)</option>
                <option value="multiple">Trắc nghiệm (Nhiều đáp án)</option>
                <option value="essay">Tự luận</option>
              </select>
            </div>

            {/* Nội dung câu hỏi + Nút toggle UI */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-bold text-slate-700">
                  Nội dung câu hỏi *
                </label>

                {/* Nút bấm chuyển chế độ nhập văn bản / ảnh */}
                <button
                  type="button"
                  onClick={() => setUseRichText(!useRichText)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all"
                >
                  {useRichText ? (
                    <>
                      <Type size={14} /> Chuyển về ô nhập gọn
                    </>
                  ) : (
                    <>
                      <ImageIcon size={14} /> Bật chèn ảnh / định dạng Rich Text
                    </>
                  )}
                </button>
              </div>

              {/* Chuyển đổi linh hoạt giữa Input thường & TinyMCE */}
              {useRichText ? (
                <div className="border rounded-xl overflow-hidden">
                  <TextEditor
                    value={content}
                    onChange={setContent}
                    onImageUploaded={handleImageUploaded}
                  />
                </div>
              ) : (
                <input
                  type="text"
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập câu hỏi ngắn gọn..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* Danh sách đáp án */}
            {formType !== "essay" && (
              <div className="space-y-3 pt-2">
                <label className="block text-sm font-bold text-slate-700">
                  Danh sách lựa chọn
                </label>

                {answers.map((ans, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type={formType === "single" ? "radio" : "checkbox"}
                      name="correct_answer"
                      checked={ans.is_correct}
                      onChange={(e) =>
                        handleAnswerChange(idx, "is_correct", e.target.checked)
                      }
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <input
                      type="text"
                      required
                      value={ans.content}
                      onChange={(e) =>
                        handleAnswerChange(idx, "content", e.target.value)
                      }
                      placeholder={`Lựa chọn ${idx + 1}`}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {answers.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAnswer(idx)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddAnswer}
                  className="mt-2 text-xs font-semibold text-blue-600 hover:underline inline-block"
                >
                  + Thêm đáp án khác
                </button>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition-all text-sm"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-all text-sm"
              >
                {submitting
                  ? "Đang lưu..."
                  : questionId
                    ? "Cập nhật câu hỏi"
                    : "Tạo câu hỏi"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
