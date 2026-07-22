import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useNavigate as useNav,
  useParams as useParamsRoute,
} from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Search,
  Eye,
  Trash2,
  Check,
  Save,
  HelpCircle,
  FileText,
  Clock,
  Layers,
} from "lucide-react";

import api from "../../../services/api";
import QuestionDetailModal from "./../Questions/QuestionDetailModal";
import QuestionFormModal from "./../Questions/QuestionFormModal";
import Navbar from "../../../Components/Navbar";

export default function ExamFormPage({ showAlert }) {
  const { id } = useParamsRoute(); // id đề thi (nếu đang chỉnh sửa)
  const navigate = useNav();

  // 1. State Thông tin chung đề thi
  const [examData, setExamData] = useState({
    title: "",
    description: "",
    duration_minutes: 45,
    type: "practice",
    grading_method: "manual",
    is_public: 1,
    course_id: null,
  });

  // Danh sách câu hỏi ĐÃ CHỌN vào đề thi
  // Mỗi phần tử dạng: { id, content, question_type, points: 1 }
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingExam, setLoadingExam] = useState(false);

  // 2. State Ngân hàng câu hỏi
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [search, setSearch] = useState("");
  const [questionType, setQuestionType] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // 3. State Modals
  const [detailModalId, setDetailModalId] = useState(null);
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);

  // --- API FETCHES ---

  // Lấy chi tiết đề thi nếu đang ở chế độ Chỉnh sửa
  useEffect(() => {
    if (!id) return;
    setLoadingExam(true);
    api
      .get(`/exams/${id}`)
      .then((res) => {
        if (res.data.success) {
          const exam = res.data.data;
          setExamData({
            title: exam.title || "",
            description: exam.description || "",
            duration_minutes: exam.duration_minutes || 45,
            type: exam.type || "practice",
            grading_method: exam.grading_method || "latest",
            is_public: exam.is_public ?? 1,
            course_id: exam.course_id || null,
          });
          if (exam.questions && Array.isArray(exam.questions)) {
            // CHUẨN HÓA: Đảm bảo item.id luôn là ID của Câu hỏi (question_id)
            const normalizedQuestions = exam.questions.map((q) => ({
              ...q,
              id: q.question_id || q.id, // Ưu tiên question_id nếu backend gửi cả 2
              points: parseFloat(q.points) || 1,
            }));
            setSelectedQuestions(normalizedQuestions);
          }
        }
      })
      .catch((err) => {
        console.error("Lỗi tải thông tin đề thi:", err);
        if (showAlert)
          showAlert("error", "Lỗi", "Không thể tải chi tiết đề thi");
      })
      .finally(() => setLoadingExam(false));
  }, [id]);

  // Lấy ngân hàng câu hỏi
  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const res = await api.get("/questions", {
        params: {
          search,
          question_type: questionType,
          page: currentPage,
          limit: 5,
        },
      });
      if (res.data.success) {
        setQuestions(res.data.data || []);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách câu hỏi:", err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [search, questionType, currentPage]);

  // --- XỬ LÝ CÂU HỎI ĐÃ CHỌN ---

  //   const handleSelectQuestion = (q) => {
  //     const isExist = selectedQuestions.some((item) => item.id === q.id);
  //     if (isExist) {
  //       setSelectedQuestions(
  //         selectedQuestions.filter((item) => item.id !== q.id),
  //       );
  //     } else {
  //       setSelectedQuestions([...selectedQuestions, { ...q, points: 1 }]);
  //     }
  //   };
  const handleSelectQuestion = (q) => {
    const targetId = q.question_id || q.id;
    const isExist = selectedQuestions.some(
      (item) => (item.question_id || item.id) === targetId,
    );

    if (isExist) {
      setSelectedQuestions((prev) =>
        prev.filter((item) => (item.question_id || item.id) !== targetId),
      );
    } else {
      setSelectedQuestions((prev) => [
        ...prev,
        { ...q, id: targetId, points: 1 },
      ]);
    }
  };
  const handleRemoveSelected = (qIdToRemove) => {
    setSelectedQuestions((prevQuestions) =>
      prevQuestions.filter((q) => (q.question_id || q.id) !== qIdToRemove),
    );
  };
  const handlePointChange = (qId, points) => {
    setSelectedQuestions(
      selectedQuestions.map((q) =>
        q.id === qId ? { ...q, points: parseFloat(points) || 0 } : q,
      ),
    );
  };

  //   const handleRemoveSelected = (qId) => {
  //     setSelectedQuestions(selectedQuestions.filter((q) => q.id !== qId));
  //   };

  // Tự động gắn câu hỏi vừa tạo thành công từ QuestionFormModal vào đề
  const handleQuestionCreatedSuccess = async (createdQuestion) => {
    await fetchQuestions();

    if (createdQuestion && createdQuestion.id) {
      const isExist = selectedQuestions.some(
        (q) => q.id === createdQuestion.id,
      );
      if (!isExist) {
        setSelectedQuestions((prev) => [
          ...prev,
          { ...createdQuestion, points: 1 },
        ]);
      }
    }
  };

  // --- LƯU ĐỀ THI (XỬ LÝ ĐỦ 2 BƯỚC THEO API BACKEND) ---
  const handleSubmitExam = async (e) => {
    e.preventDefault();

    if (!examData.title.trim()) {
      if (showAlert)
        showAlert("warning", "Cảnh báo", "Vui lòng nhập tiêu đề đề thi!");
      return;
    }

    if (selectedQuestions.length === 0) {
      if (showAlert)
        showAlert("warning", "Cảnh báo", "Đề thi phải có ít nhất 1 câu hỏi!");
      return;
    }

    setSaving(true);

    try {
      let currentExamId = id;
      const computedGradingMethod = getCalculatedGradingMethod();
      const payload = {
        ...examData,
        grading_method: computedGradingMethod,
      };
      // BƯỚC 1: Nếu là Tạo mới -> Gọi API createExam trước
      if (!currentExamId) {
        const createRes = await api.post("/exams", examData);
        if (createRes.data.success && createRes.data.data?.id) {
          currentExamId = createRes.data.data.id;
        } else {
          throw new Error("Không thể khởi tạo đề thi mới");
        }
      } else {
        // Nếu là Chỉnh sửa -> Gọi API cập nhật thông tin chung (nếu backend có PUT /exams/:id)
        await api.put(`/exams/${currentExamId}`, examData).catch(() => {});
      }

      // BƯỚC 2: Gọi API addQuestionsToExam để lưu toàn bộ danh sách câu hỏi
      const questionsPayload = {
        questions: selectedQuestions.map((q, idx) => ({
          question_id: q.id,
          position: idx + 1,
          points: parseFloat(q.points) || 1,
        })),
      };

      const questionsRes = await api.post(
        `/exams/${currentExamId}/questions`,
        questionsPayload,
      );

      if (questionsRes.data.success) {
        if (showAlert) {
          showAlert(
            "success",
            "Thành công",
            id
              ? "Cập nhật đề thi thành công!"
              : "Tạo đề thi và thêm câu hỏi thành công!",
          );
        }
        navigate("/teacher/exams");
      }
    } catch (err) {
      console.error("Lỗi khi lưu đề thi:", err);
      if (showAlert) {
        showAlert(
          "error",
          "Thất bại",
          err.response?.data?.message || "Lỗi trong quá trình lưu đề thi",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const totalPoints = selectedQuestions.reduce(
    (sum, q) => sum + (parseFloat(q.points) || 0),
    0,
  );

  if (loadingExam) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium">
        Đang tải đề thi...
      </div>
    );
  }
  const getCalculatedGradingMethod = () => {
    if (selectedQuestions.length === 0) return "auto"; // Mặc định khi chưa chọn câu hỏi nào

    const hasEssay = selectedQuestions.some((q) => q.question_type === "essay");
    const hasChoice = selectedQuestions.some(
      (q) => q.question_type === "single" || q.question_type === "multiple",
    );

    if (hasChoice && hasEssay) return "hybrid";
    if (hasEssay) return "manual";
    return "auto";
  };
  return (
    <div>
      <Navbar />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/teacher/exams")}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                {id ? "Chỉnh Sửa Đề Thi" : "Tạo Đề Thi Mới"}
              </h1>
              <p className="text-xs text-slate-500">
                Đã chọn: {selectedQuestions.length} câu hỏi • Tổng:{" "}
                {totalPoints} điểm
              </p>
            </div>
          </div>

          <button
            onClick={handleSubmitExam}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition shadow-sm disabled:opacity-50"
          >
            <Save size={18} />
            <span>{saving ? "Đang lưu..." : "Lưu đề thi"}</span>
          </button>
        </div>

        {/* Main Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CỘT TRÁI (5 Cols): Form Thông tin chung + Danh sách đã chọn */}
          <div className="lg:col-span-5 space-y-6">
            {/* Thông tin đề thi */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-3">
                <FileText size={16} className="text-blue-600" /> Thông tin cơ
                bản
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu đề đề thi *
                </label>
                <input
                  type="text"
                  value={examData.title}
                  onChange={(e) =>
                    setExamData({ ...examData, title: e.target.value })
                  }
                  placeholder="VD: Kiểm tra cuối kỳ 1 Môn Toán"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Thời gian (phút)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={examData.duration_minutes}
                      onChange={(e) =>
                        setExamData({
                          ...examData,
                          duration_minutes: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Clock
                      size={14}
                      className="absolute left-2.5 top-3 text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Loại đề thi
                  </label>
                  <select
                    value={examData.type}
                    onChange={(e) =>
                      setExamData({ ...examData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="practice">Luyện tập</option>
                    <option value="test">Bài thi chính thức</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  rows={2}
                  value={examData.description}
                  onChange={(e) =>
                    setExamData({ ...examData, description: e.target.value })
                  }
                  placeholder="Mô tả hoặc ghi chú đề thi..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Thêm ô này vào phần Form "Thông tin cơ bản" */}
              {/* Ô hiển thị Hình thức chấm điểm + Tooltip giải thích */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Hình thức chấm điểm
                  </label>

                  {/* Icon Dấu ? và Tooltip khi Hover */}
                  <div className="relative group flex items-center">
                    <HelpCircle
                      size={15}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer transition"
                    />

                    {/* Khung nội dung Tooltip */}
                    <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-slate-800 text-white text-[11px] rounded-xl shadow-xl z-50 pointer-events-none space-y-1.5 leading-relaxed">
                      <p className="font-semibold text-slate-200 border-b border-slate-700 pb-1">
                        Quy tắc xác định hình thức chấm:
                      </p>
                      <p>
                        <strong className="text-emerald-400">
                          Tự động (auto):
                        </strong>{" "}
                        Áp dụng khi 100% câu hỏi trong đề là trắc nghiệm. Hệ
                        thống sẽ tự động chấm điểm ngay sau khi nộp bài.
                      </p>
                      <p>
                        <strong className="text-amber-400">
                          Thủ công (manual):
                        </strong>{" "}
                        Áp dụng khi 100% câu hỏi là tự luận. Giáo viên cần vào
                        chấm điểm thủ công.
                      </p>
                      <p>
                        <strong className="text-indigo-400">
                          Hỗn hợp (hybrid):
                        </strong>{" "}
                        Áp dụng khi đề có cả trắc nghiệm và tự luận. Hệ thống tự
                        chấm trắc nghiệm, giáo viên chấm phần tự luận.
                      </p>
                      {/* Mũi tên chỉ xuống của Tooltip */}
                      <div className="absolute top-full right-1 border-4 border-transparent border-t-slate-800"></div>
                    </div>
                  </div>
                </div>

                {/* Khung hiển thị Trạng thái */}
                <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 rounded-xl border border-slate-200 select-none">
                  {getCalculatedGradingMethod() === "auto" && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Tự động (100% Trắc nghiệm)
                    </span>
                  )}
                  {getCalculatedGradingMethod() === "manual" && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Thủ công (100% Tự luận)
                    </span>
                  )}
                  {getCalculatedGradingMethod() === "hybrid" && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      Hỗn hợp (Trắc nghiệm + Tự luận)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Danh sách câu hỏi đã chọn */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Layers size={16} className="text-blue-600" /> Câu hỏi trong
                  đề ({selectedQuestions.length})
                </h3>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                  {totalPoints} Điểm
                </span>
              </div>

              {selectedQuestions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 border-2 border-dashed rounded-xl">
                  Chưa có câu hỏi nào trong đề. <br /> Tích chọn câu hỏi ở ngân
                  hàng câu hỏi!
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {selectedQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          Câu {idx + 1}: {q.content?.replace(/<[^>]*>/g, "")}
                        </p>
                        <span className="text-[10px] text-slate-500 capitalize">
                          {q.question_type === "single"
                            ? "1 đáp án"
                            : q.question_type === "multiple"
                              ? "Nhiều đáp án"
                              : "Tự luận"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          value={q.points}
                          onChange={(e) =>
                            handlePointChange(q.id, e.target.value)
                          }
                          className="w-14 px-2 py-1 text-xs text-center rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 font-semibold"
                        />
                        <span className="text-xs text-slate-500">đ</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSelected(q.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI (7 Cols): Ngân hàng câu hỏi */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <HelpCircle size={16} className="text-blue-600" /> Ngân hàng câu
                hỏi
              </h3>

              <button
                type="button"
                onClick={() => setIsQuestionFormOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition"
              >
                <Plus size={14} /> Tạo câu hỏi mới
              </button>
            </div>

            {/* Bộ lọc */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <input
                  type="text"
                  placeholder="Tìm nội dung câu hỏi..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search
                  size={15}
                  className="absolute left-3 top-2.5 text-slate-400"
                />
              </div>

              <select
                value={questionType}
                onChange={(e) => {
                  setQuestionType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Tất cả loại câu</option>
                <option value="single">1 đáp án</option>
                <option value="multiple">Nhiều đáp án</option>
                <option value="essay">Tự luận</option>
              </select>
            </div>

            {/* Danh sách câu hỏi từ Ngân hàng */}
            {loadingQuestions ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Đang tải câu hỏi...
              </div>
            ) : questions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Không tìm thấy câu hỏi phù hợp.
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {questions.map((q) => {
                  const isSelected = selectedQuestions.some(
                    (item) => item.id === q.id,
                  );
                  return (
                    <div
                      key={q.id}
                      className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-blue-50/50 border-blue-200"
                          : "bg-white border-slate-200/80 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        {/* <p className="text-xs font-medium text-slate-800 line-clamp-2">
                          {q.content?.replace(/<[^>]*>/g, "")}
                        </p> */}
                        <div
                          dangerouslySetInnerHTML={{
                            __html: q?.content,
                          }}
                        />
                        <span className="inline-block text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                          {q.question_type === "single"
                            ? "Trắc nghiệm (1 đáp án)"
                            : q.question_type === "multiple"
                              ? "Trắc nghiệm (Nhiều)"
                              : "Tự luận"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setDetailModalId(q.id)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectQuestion(q)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            isSelected
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check size={14} /> Đã chọn
                            </>
                          ) : (
                            <>
                              <Plus size={14} /> Chọn
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-2 border-t text-xs text-slate-500">
                <span>
                  Trang {currentPage} / {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    className="px-2.5 py-1 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-40"
                  >
                    Trước
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className="px-2.5 py-1 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-40"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODALS */}
        <QuestionDetailModal
          isOpen={!!detailModalId}
          onClose={() => setDetailModalId(null)}
          questionId={detailModalId}
        />

        <QuestionFormModal
          isOpen={isQuestionFormOpen}
          onClose={() => setIsQuestionFormOpen(false)}
          questionId={null}
          onSuccess={handleQuestionCreatedSuccess}
          showAlert={showAlert}
        />
      </div>
    </div>
  );
}
