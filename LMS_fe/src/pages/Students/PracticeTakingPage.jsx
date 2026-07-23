import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { ChevronLeft, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import useAlert from "../../Components/Alert/useAlert";

const PracticeTakingPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lưu đáp án học sinh đang chọn/nhập
  // Format: { [questionId]: { selected_option_id, selected_option_ids, essay_answer } }
  const [userAnswers, setUserAnswers] = useState({});

  // Lưu trạng thái đã "Kiểm tra" câu hỏi nào để hiện đáp án Đúng/Sai
  // Format: { [questionId]: true }
  const [checkedQuestions, setCheckedQuestions] = useState({});

  useEffect(() => {
    const fetchPracticeExam = async () => {
      try {
        setLoading(true);
        // Lấy chi tiết đề luyện tập (bao gồm câu hỏi & các options)
        const res = await api.get(`/exams/${examId}/practice`);
        const examData = res.data.data;

        setExam(examData);
        setQuestions(examData.questions || []);
      } catch (err) {
        console.error("Lỗi lấy đề luyện tập:", err);
        showAlert(
          "error",
          "Lỗi lấy đề luyện tập",
          err.response?.data?.message || "Không thể tải bài luyện tập!",
        );
      } finally {
        setLoading(false);
      }
    };

    if (examId) fetchPracticeExam();
  }, [examId, navigate]);

  // CÁC HÀM CẬP NHẬT ĐÁP ÁN
  const handleSingleSelect = (qId, optionId) => {
    if (checkedQuestions[qId]) return; // Đã bấm kiểm tra thì không cho sửa
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], selected_option_id: Number(optionId) },
    }));
  };

  const handleMultipleSelect = (qId, optionId) => {
    if (checkedQuestions[qId]) return;
    const currentList = userAnswers[qId]?.selected_option_ids || [];
    const numOptId = Number(optionId);

    const updatedList = currentList.includes(numOptId)
      ? currentList.filter((id) => id !== numOptId)
      : [...currentList, numOptId];

    setUserAnswers((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], selected_option_ids: updatedList },
    }));
  };

  const handleEssayInput = (qId, text) => {
    if (checkedQuestions[qId]) return;
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], essay_answer: text },
    }));
  };

  // Nút "Kiểm tra câu này"
  const toggleCheckQuestion = (qId) => {
    setCheckedQuestions((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Nút "Làm lại câu này"
  const handleResetQuestion = (qId) => {
    setCheckedQuestions((prev) => ({ ...prev, [qId]: false }));
    setUserAnswers((prev) => {
      const newAns = { ...prev };
      delete newAns[qId];
      return newAns;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải bài luyện tập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col pb-12">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded">
                LUYỆN TẬP
              </span>
              <h1 className="text-lg font-bold text-gray-800 line-clamp-1">
                {exam?.title || "Bài luyện tập"}
              </h1>
            </div>
            <p className="text-xs text-gray-500">
              Chế độ luyện tập: Kiểm tra đáp án trực tiếp & Không tính điểm
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setUserAnswers({});
            setCheckedQuestions({});
          }}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-all"
        >
          <RotateCcw size={16} /> Làm lại toàn bộ
        </button>
      </header>

      {/* BODY */}
      <div className="max-w-4xl w-full mx-auto p-6 space-y-6">
        {questions.map((q, idx) => {
          const qId = q.question_id;
          const ans = userAnswers[qId] || {};
          const isChecked = !!checkedQuestions[qId];

          // Tìm danh sách ID đáp án đúng trong options
          const correctOptions =
            q.options?.filter((opt) => opt.is_correct) || [];
          const correctOptionIds = correctOptions.map((opt) => Number(opt.id));

          // KẾT QUẢ ĐÚNG / SAI
          let isCorrect = false;
          if (q.question_type === "single") {
            isCorrect = Number(ans.selected_option_id) === correctOptionIds[0];
          } else if (q.question_type === "multiple") {
            const userOpts = (ans.selected_option_ids || []).map(Number).sort();
            const correctOpts = [...correctOptionIds].sort();
            isCorrect =
              userOpts.length === correctOpts.length &&
              userOpts.every((val, index) => val === correctOpts[index]);
          }

          return (
            <div
              key={qId}
              className={`bg-white rounded-xl shadow-sm border p-6 transition-all ${
                isChecked
                  ? isCorrect
                    ? "border-green-300 bg-green-50/20"
                    : q.question_type === "essay"
                      ? "border-blue-300 bg-blue-50/20"
                      : "border-red-300 bg-red-50/20"
                  : "border-gray-200"
              }`}
            >
              {/* Header câu hỏi */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-600 text-white font-bold px-3 py-1 rounded-md text-sm">
                    Câu {idx + 1}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded capitalize">
                    {q.question_type === "single"
                      ? "Trắc nghiệm 1 đáp án"
                      : q.question_type === "multiple"
                        ? "Trắc nghiệm nhiều đáp án"
                        : "Tự luận"}
                  </span>
                </div>

                {/* Trạng thái Đúng/Sai khi bấm Kiểm tra */}
                {isChecked && q.question_type !== "essay" && (
                  <div>
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                        <CheckCircle2 size={16} /> Đúng rồi!
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-3 py-1 rounded-full">
                        <XCircle size={16} /> Chưa chính xác
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Nội dung câu hỏi */}
              <div className="text-gray-800 font-medium mb-5 leading-relaxed">
                {q.content}
              </div>

              {/* ----------------- DẠNG 1: SINGLE ----------------- */}
              {q.question_type === "single" && (
                <div className="space-y-3">
                  {q.options?.map((opt) => {
                    const optIdNum = Number(opt.id);
                    const isSelected =
                      Number(ans.selected_option_id) === optIdNum;
                    const isOptCorrect = opt.is_correct;

                    let optionStyle =
                      "border-gray-200 hover:bg-gray-50 text-gray-700";

                    if (isChecked) {
                      if (isOptCorrect) {
                        optionStyle =
                          "border-green-500 bg-green-100/70 text-green-900 font-semibold"; // Đáp án đúng
                      } else if (isSelected && !isOptCorrect) {
                        optionStyle =
                          "border-red-500 bg-red-100/70 text-red-900 line-through"; // Chọn sai
                      }
                    } else if (isSelected) {
                      optionStyle =
                        "border-emerald-600 bg-emerald-50 text-emerald-900 font-medium";
                    }

                    return (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-3 p-4 rounded-lg border transition-all cursor-pointer select-none ${optionStyle}`}
                      >
                        <input
                          type="radio"
                          name={`practice-single-${qId}`}
                          checked={isSelected}
                          disabled={isChecked}
                          onChange={() => handleSingleSelect(qId, opt.id)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="flex-1">{opt.content}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* ----------------- DẠNG 2: MULTIPLE ----------------- */}
              {q.question_type === "multiple" && (
                <div className="space-y-3">
                  <p className="text-xs text-emerald-700 italic mb-2">
                    * Chọn một hoặc nhiều đáp án đúng
                  </p>
                  {q.options?.map((opt) => {
                    const optIdNum = Number(opt.id);
                    const selectedList = (ans.selected_option_ids || []).map(
                      Number,
                    );
                    const isSelected = selectedList.includes(optIdNum);
                    const isOptCorrect = opt.is_correct;

                    let optionStyle =
                      "border-gray-200 hover:bg-gray-50 text-gray-700";

                    if (isChecked) {
                      if (isOptCorrect) {
                        optionStyle =
                          "border-green-500 bg-green-100/70 text-green-900 font-semibold";
                      } else if (isSelected && !isOptCorrect) {
                        optionStyle =
                          "border-red-500 bg-red-100/70 text-red-900 line-through";
                      }
                    } else if (isSelected) {
                      optionStyle =
                        "border-emerald-600 bg-emerald-50 text-emerald-900 font-medium";
                    }

                    return (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-3 p-4 rounded-lg border transition-all cursor-pointer select-none ${optionStyle}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isChecked}
                          onChange={() => handleMultipleSelect(qId, opt.id)}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="flex-1">{opt.content}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* ----------------- DẠNG 3: ESSAY ----------------- */}
              {q.question_type === "essay" && (
                <div className="space-y-3">
                  <textarea
                    rows={4}
                    disabled={isChecked}
                    value={ans.essay_answer || ""}
                    onChange={(e) => handleEssayInput(qId, e.target.value)}
                    placeholder="Nhập câu trả lời tự luận của bạn..."
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-gray-800 disabled:bg-gray-50"
                  />
                  {isChecked && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
                      <p className="font-bold mb-1">
                        Gợi ý / Đáp án tham khảo:
                      </p>
                      <p>
                        {q.explanation ||
                          "Không có gợi ý chi tiết cho câu hỏi này."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* FOOTER CÂU HỎI: NÚT KIỂM TRA / LÀM LẠI */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
                {isChecked ? (
                  <button
                    onClick={() => handleResetQuestion(qId)}
                    className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium"
                  >
                    <RotateCcw size={14} /> Làm lại câu này
                  </button>
                ) : (
                  <div />
                )}

                <button
                  onClick={() => toggleCheckQuestion(qId)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm ${
                    isChecked
                      ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {isChecked ? "Ẩn đáp án" : "Kiểm tra đáp án"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PracticeTakingPage;
