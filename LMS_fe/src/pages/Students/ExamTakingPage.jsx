import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  FileText,
  ChevronLeft,
} from "lucide-react";
import useAlert from "../../Components/Alert/useAlert";
import singleChoiceQuestion from "../../Components/Question/SingleChoiceQuestion";
import multipleChoiceQuestion from "../../Components/Question/MultipleChoiceQuestion";
import essayQuestion from "../../Components/Question/EssayQuestion";
import SingleChoiceQuestion from "../../Components/Question/SingleChoiceQuestion";
import MultipleChoiceQuestion from "../../Components/Question/MultipleChoiceQuestion";
import EssayQuestion from "../../Components/Question/EssayQuestion";

const ExamTakingPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { showAlert, confirm } = useAlert();

  // States dữ liệu
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});

  // States UI & Đếm thời gian
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);

  //auto save
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Khởi tạo bài thi & Load danh sách câu hỏi
  useEffect(() => {
    const initExam = async () => {
      try {
        setLoading(true);

        // Bắt đầu / Tiếp tục lượt làm bài
        const startRes = await api.post(`/attemps/${examId}/start`);
        const attemptData = startRes.data.data;
        if (attemptData.status !== "in_progress") {
          navigate(`/student/result/${attemptData.id}`, {
            replace: true,
          });
          return;
        }
        setAttemptId(attemptData.id);

        // Tải danh sách câu hỏi của đề thi...
        const examRes = await api.get(`/exams/${examId}/student`);
        const fetchedExam = examRes.data.data;
        const questionList = fetchedExam.questions || [];

        setExam(fetchedExam);
        setQuestions(questionList);

        if (fetchedExam.duration_minutes && fetchedExam.duration_minutes > 0) {
          const startTime = new Date(attemptData.start_time).getTime();
          const durationMs = fetchedExam.duration_minutes * 60 * 1000;
          const endTime = startTime + durationMs;
          const now = new Date().getTime();

          // Số giây còn lại (đảm bảo không âm)
          const remainingSeconds = Math.max(
            0,
            Math.floor((endTime - now) / 1000),
          );
          setTimeLeft(remainingSeconds);
        }

        if (
          Array.isArray(attemptData.saved_answers) &&
          attemptData.saved_answers.length > 0
        ) {
          console.log(attemptData);
          const restoredAnswers = {};

          attemptData.saved_answers.forEach((item) => {
            const rawOpt = item.selected_option_id;

            restoredAnswers[item.question_id] = {
              selected_option_id: rawOpt ? Number(rawOpt) : null,
              selected_option_ids: rawOpt
                ? String(rawOpt).split(",").map(Number)
                : [],
              essay_answer: item.essay_answer || "",
            };
          });

          setAnswers(restoredAnswers);
        }
      } catch (err) {
        console.error("Lỗi khởi tạo bài thi:", err);
        showAlert(
          "error",
          "Lỗi",
          err.response?.data?.message || "Không thể tải bài kiểm tra!",
        );
      } finally {
        setLoading(false);
      }
    };

    if (examId) initExam();
  }, [examId, navigate]);

  // Format số giây thành hh:mm:ss
  const formatTime = (seconds) => {
    if (seconds === null) return "--:--";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    }
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSingleAnswer = (qId, optionId) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], selected_option_id: optionId },
    }));
  };

  const handleMultipleAnswer = (qId, optionIdsArray) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], selected_option_ids: optionIdsArray },
    }));
  };

  const handleEssayAnswer = (qId, text) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], essay_answer: text },
    }));
  };
  const isQuestionAnswered = (q) => {
    const ans = answers[q.question_id];
    if (!ans) return false;

    if (q.question_type === "single") {
      return !!ans.selected_option_id;
    }
    if (q.question_type === "multiple") {
      return (
        Array.isArray(ans.selected_option_ids) &&
        ans.selected_option_ids.length > 0
      );
    }
    if (q.question_type === "essay") {
      return (
        typeof ans.essay_answer === "string" && ans.essay_answer.trim() !== ""
      );
    }
    return false;
  };
  // Tạo Ref để lưu state answers mới nhất cho setInterval dùng
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  const handleAutoSave = async () => {
    if (!attemptId) return;

    try {
      setIsSaving(true);
      const currentAnswers = answersRef.current;
      // Format dữ liệu gửi lên
      const formattedAnswers = Object.keys(currentAnswers).map((qId) => {
        const ans = currentAnswers[qId] || {};
        const hasMultiple = Array.isArray(ans.selected_option_ids);
        return {
          question_id: Number(qId),
          selected_option_id: ans.selected_option_id
            ? Number(ans.selected_option_id)
            : null,
          selected_option_ids:
            hasMultiple && !ans.selected_option_id
              ? ans.selected_option_ids.map(Number)
              : [],
          essay_answer: ans.essay_answer || null,
        };
      });

      if (formattedAnswers.length === 0) {
        setIsSaving(false);
        return;
      }

      await api.post("/attempts/auto-save", {
        attemptId,
        answers: formattedAnswers,
      });

      const now = new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setLastSavedTime(now);
      console.log(`[Auto-save] Đã lưu bản nháp lúc ${now}`);
    } catch (err) {
      console.error("[Auto-save Error] Không thể tự động lưu:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Tự động chạy Auto-save mỗi 5 phút (300,000ms)
  useEffect(() => {
    if (!attemptId) return;

    const FIVE_MINUTES = 5 * 60 * 1000;
    const intervalId = setInterval(() => {
      handleAutoSave();
    }, FIVE_MINUTES);

    // Hủy interval khi component unmount hoặc bài thi kết thúc
    return () => clearInterval(intervalId);
  }, [attemptId]);

  const submitExam = async () => {
    try {
      setSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);
      const formattedAnswers = questions.map((q) => {
        const qId = q.question_id;
        const ans = answers[qId] || {};

        return {
          question_id: Number(qId),
          selected_option_id: ans.selected_option_id
            ? Number(ans.selected_option_id)
            : null,
          selected_option_ids: Array.isArray(ans.selected_option_ids)
            ? ans.selected_option_ids.map(Number)
            : [],
          essay_answer: ans.essay_answer || null,
        };
      });
      const res = await api.post("/attemps/submit", {
        attemptId,
        answers: formattedAnswers,
      });

      if (res.data.success) {
        showAlert(
          "success",
          "Thành công",
          res.data.message || "Nộp bài thành công!",
        );
        // Chuyển sang trang xem kết quả
        navigate(`/student/exams/result/${attemptId}`, { replace: true });
      }
    } catch (err) {
      console.error("Lỗi nộp bài:", err);
      showAlert(
        "error",
        "Lỗi nộp bài",
        err.response?.data?.message || "Đã xảy ra lỗi khi nộp bài!",
      );
    } finally {
      setSubmitting(false);
    }
  };
  // 4. Xử lý nộp bài
  const handleSubmitExam = async (isAutoSubmit = false) => {
    if (submitting) return;

    if (isAutoSubmit) {
      return submitExam();
    }
    if (!isAutoSubmit) {
      const answeredCount = questions.filter(isQuestionAnswered).length;
      confirm(
        `Bạn đã trả lời ${answeredCount}/${questions.length} câu hỏi.`,
        "Bạn có chắc chắn muốn nộp bài?",
        () => {
          console.log("submit");
          submitExam();
        },
      );
    }
  };

  // 2. Logic đếm ngược thời gian
  useEffect(() => {
    if (timeLeft === null) return;

    if (timeLeft <= 0) {
      showAlert(
        "info",
        "Đã hết thời gian làm bài!",
        "Hệ thống sẽ tự động nộp bài.",
      );
      handleSubmitExam(true);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft]);
  // Cuộn mượt tới câu hỏi tương ứng
  const scrollToQuestion = (index) => {
    const el = document.getElementById(`question-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải bài kiểm tra...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* HEADER TỐC ĐỘ / THỜI GIAN LÀM BÀI */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-600"
            title="Quay lại"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800 line-clamp-1">
              {exam?.title || "Bài kiểm tra"}
            </h1>
            <p className="text-xs text-gray-500">
              Tổng số câu hỏi: {questions.length} câu
            </p>
          </div>
        </div>

        {/* Đếm ngược thời gian */}
        <div className="flex items-center gap-4">
          {timeLeft !== null && (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${
                timeLeft < 300
                  ? "bg-red-50 text-red-600 border border-red-200 animate-pulse"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              <Clock size={20} />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {isSaving ? (
              <span className="text-amber-600 animate-pulse">
                Đang tự động lưu...
              </span>
            ) : lastSavedTime ? (
              <span className="text-green-600">
                ✓ Đã tự động lưu lúc {lastSavedTime}
              </span>
            ) : (
              <span>Tự động lưu mỗi 5 phút</span>
            )}
          </div>
          <button
            onClick={handleAutoSave}
            disabled={isSaving}
            className="text-xs text-blue-600 hover:underline"
          >
            Lưu bản nháp ngay
          </button>
          <button
            onClick={() => handleSubmitExam(false)}
            disabled={submitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium shadow transition-all disabled:opacity-50"
          >
            <Send size={18} />
            {submitting ? "Đang nộp..." : "Nộp bài"}
          </button>
        </div>
      </header>

      {/* BODY CHÍNH */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* CỘT TRÁI: DANH SÁCH CÂU HỎI */}
        <div className="lg:col-span-3 space-y-6">
          {questions.map((q, idx) => {
            const qId = q.question_id;
            const currentAns = answers[qId] || {};

            return (
              <div
                key={q.id}
                id={`question-${idx}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 scroll-mt-24"
              >
                {/* Tiêu đề câu hỏi */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-md text-sm">
                      Câu {idx + 1}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded capitalize">
                      {q.question_type === "single"
                        ? "Trắc nghiệm (1 đáp án)"
                        : q.question_type === "multiple"
                          ? "Trắc nghiệm (Nhiều đáp án)"
                          : "Tự luận"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    ({q.points || 1} điểm)
                  </span>
                </div>

                {/* Nội dung câu hỏi */}
                <div className="text-gray-800 font-medium mb-6 leading-relaxed">
                  {/* {q.content} */}
                  <div
                    dangerouslySetInnerHTML={{
                      __html: q?.content,
                    }}
                  />
                </div>
                {/* RENDER COMPONENT THEO DẠNG CÂU HỎI */}
                {q.question_type === "single" && (
                  <SingleChoiceQuestion
                    question={q}
                    currentAnswer={currentAns}
                    onAnswerChange={(optId) => handleSingleAnswer(qId, optId)}
                  />
                )}

                {q.question_type === "multiple" && (
                  <MultipleChoiceQuestion
                    question={q}
                    currentAnswer={currentAns}
                    onAnswerChange={(optIds) =>
                      handleMultipleAnswer(qId, optIds)
                    }
                  />
                )}

                {q.question_type === "essay" && (
                  <EssayQuestion
                    question={q}
                    currentAnswer={currentAns}
                    onAnswerChange={(text) => handleEssayAnswer(qId, text)}
                  />
                )}
              </div>
            );
          })}
        </div>
        {/* THANH ĐIỀU HƯỚNG CÂU HỎI BÊN PHẢI */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-24">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText size={18} /> Danh mục câu hỏi
            </h3>
            <div className="grid grid-cols-5 gap-2 mb-6">
              {questions.map((q, idx) => {
                const answered = isQuestionAnswered(q);
                return (
                  <button
                    key={q.question_id}
                    onClick={() => {
                      document
                        .getElementById(`question-${idx}`)
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`h-10 rounded-lg text-sm font-semibold flex items-center justify-center border ${
                      answered
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamTakingPage;
