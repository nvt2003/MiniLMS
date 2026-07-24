import React, { useState, useEffect, useRef } from "react";
import api from "../../../services/api";
import useAlert from "../../../Components/Alert/useAlert";
import {
  CheckCircle,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  User,
  Save,
  X,
  Filter,
} from "lucide-react";
import Navbar from "../../../Components/Navbar";

const GradingPage = () => {
  const { showAlert } = useAlert();

  // --- States cho danh sách & bộ lọc ---
  const [attempts, setAttempts] = useState([]);
  const [exams, setExams] = useState([]); // Danh sách gốc đề thi
  const [loading, setLoading] = useState(false);

  // Filter & Pagination States
  const [selectedExamId, setSelectedExamId] = useState("");
  const [searchExamText, setSearchExamText] = useState(""); // Từ khóa tìm kiếm đề thi
  const [filteredExams, setFilteredExams] = useState([]); // Danh sách đề thi gợi ý
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  const [sortBy, setSortBy] = useState("submit_time_desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(5);

  // --- States cho Modal Chấm bài ---
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [attemptDetail, setAttemptDetail] = useState(null);
  const [grades, setGrades] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch danh sách bài nộp cần chấm
  const fetchPendingAttempts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/grading/pending", {
        params: {
          page,
          limit,
          exam_id: selectedExamId || undefined,
          sort: sortBy,
        },
      });

      if (res.data?.success) {
        setAttempts(res.data.data);
        setTotalPages(res.data.pagination?.total_pages || 1);
      }
    } catch (error) {
      console.error(error);
      showAlert("error", "Thất bại", "Không thể tải danh sách bài cần chấm!");
    } finally {
      setLoading(false);
    }
  };

  // Fetch danh sách tất cả đề thi
  const fetchExams = async () => {
    try {
      const res = await api.get("/exams");
      if (res.data?.success) {
        setExams(res.data.data || []);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách đề thi", error);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    fetchPendingAttempts();
  }, [page, selectedExamId, sortBy]);

  // Xử lý sự kiện click ngoài khung tìm kiếm để ẩn gợi ý
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Xử lý khi gõ tên tìm kiếm đề thi
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchExamText(value);

    if (value.trim() === "") {
      setFilteredExams([]);
      setShowSuggestions(false);
      if (selectedExamId !== "") {
        setSelectedExamId(""); // Reset lọc đề thi nếu xóa trắng
        setPage(1);
      }
    } else {
      const matches = exams.filter((exam) =>
        exam.title.toLowerCase().includes(value.toLowerCase()),
      );
      setFilteredExams(matches);
      setShowSuggestions(true);
    }
  };

  // Bấm chọn 1 đề thi từ danh sách gợi ý
  const handleSelectExam = (exam) => {
    setSelectedExamId(exam.id);
    setSearchExamText(exam.title);
    setShowSuggestions(false);
    setPage(1);
  };

  // Xóa đề thi đã chọn trong bộ lọc
  const handleClearExamFilter = () => {
    setSelectedExamId("");
    setSearchExamText("");
    setFilteredExams([]);
    setShowSuggestions(false);
    setPage(1);
  };

  // Bấm chọn bài làm để chấm điểm
  const handleOpenGradeModal = async (attempt) => {
    setSelectedAttempt(attempt);
    try {
      const res = await api.get(`/grading/attempts/${attempt.attempt_id}`);
      if (res.data?.success) {
        const detail = res.data.data;
        setAttemptDetail(detail);

        const initialGrades = {};
        detail.answers?.forEach((ans) => {
          if (ans.question_type === "essay") {
            initialGrades[ans.answer_id] = {
              score: ans.score_given || 0,
              comment: ans.teacher_comment || "",
            };
          }
        });
        setGrades(initialGrades);
      }
    } catch (error) {
      console.error(error);
      showAlert("error", "Lỗi", "Không thể lấy chi tiết bài làm!");
    }
  };

  // Cập nhật điểm/nhận xét
  const handleGradeChange = (answerId, field, value) => {
    setGrades((prev) => ({
      ...prev,
      [answerId]: {
        ...prev[answerId],
        [field]: value,
      },
    }));
  };

  // Nộp điểm bài thi
  const handleSubmitGrade = async () => {
    setSubmitting(true);
    try {
      const payload = {
        attempt_id: selectedAttempt.attempt_id,
        grades: Object.keys(grades).map((ansId) => ({
          answer_id: Number(ansId),
          score: Number(grades[ansId].score),
          comment: grades[ansId].comment,
        })),
      };

      const res = await api.post("/grading/grade-essay", payload);
      if (res.data?.success) {
        showAlert("success", "Thành công", "Đã hoàn tất chấm bài!");
        setSelectedAttempt(null);
        fetchPendingAttempts();
      }
    } catch (error) {
      console.error(error);
      showAlert("error", "Thất bại", "Lỗi khi lưu điểm bài thi!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Navbar />

      <div className="p-6 bg-slate-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            Danh sách bài cần chấm
          </h1>
          <p className="text-slate-500 text-sm">
            Chấm điểm các bài thi tự luận đang chờ kết quả
          </p>
        </div>

        {/* Bộ lọc (Filter & Sort) */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-4">
            {/* Ô tìm kiếm đề thi kèm gợi ý (Autocomplete) */}
            <div className="relative" ref={searchRef}>
              <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 w-72 focus-within:ring-2 focus-within:ring-blue-500 bg-white">
                <Search size={18} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Nhập tên đề thi để lọc..."
                  value={searchExamText}
                  onChange={handleSearchChange}
                  onFocus={() => {
                    if (searchExamText.trim() !== "") setShowSuggestions(true);
                  }}
                  className="w-full text-sm outline-none bg-transparent"
                />
                {searchExamText && (
                  <button
                    onClick={handleClearExamFilter}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Menu danh sách gợi ý đề thi */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
                  {filteredExams.length > 0 ? (
                    filteredExams.map((exam) => (
                      <div
                        key={exam.id}
                        onClick={() => handleSelectExam(exam)}
                        className="px-4 py-2.5 hover:bg-blue-50 text-sm text-slate-700 cursor-pointer border-b border-slate-100 last:border-b-0 flex items-center justify-between"
                      >
                        <span>{exam.title}</span>
                        <Filter
                          size={14}
                          className="text-blue-500 opacity-0 group-hover:opacity-100"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-400 text-center">
                      Không tìm thấy đề thi phù hợp
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chọn kiểu Sắp xếp */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="submit_time_desc">
                  Thời gian nộp (Mới nhất)
                </option>
                <option value="submit_time_asc">Thời gian nộp (Cũ nhất)</option>
                <option value="start_time_desc">Giờ bắt đầu (Mới nhất)</option>
                <option value="start_time_asc">Giờ bắt đầu (Cũ nhất)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Danh sách bài làm */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">
            Đang tải danh sách...
          </div>
        ) : attempts.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-500">
            Không có bài thi nào đang chờ chấm!
          </div>
        ) : (
          <div className="space-y-3">
            {attempts.map((item) => (
              <div
                key={item.attempt_id}
                onClick={() => handleOpenGradeModal(item)}
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">
                      {item.exam_title}
                    </span>
                    <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">
                      Chờ chấm
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <User size={14} /> {item.student_name} (
                      {item.student_email})
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> Nộp lúc:{" "}
                      {new Date(item.submit_time).toLocaleString("vi-VN")}
                    </span>
                    <span>
                      Bắt đầu:{" "}
                      {new Date(item.start_time).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>

                <button className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-medium text-sm hover:bg-blue-100">
                  <FileText size={16} /> Chấm bài
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Phân trang (5 bài / 1 trang) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-sm text-slate-500">
              Trang {page} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 border rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 border rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Modal Chấm điểm bài làm */}
        {selectedAttempt && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="font-bold text-lg text-slate-800">
                    {selectedAttempt.exam_title}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Học sinh: {selectedAttempt.student_name}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAttempt(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-full transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {!attemptDetail ? (
                  <div className="text-center py-8 text-slate-500">
                    Đang lấy câu hỏi...
                  </div>
                ) : (
                  attemptDetail.answers?.map((ans, idx) => (
                    <div
                      key={ans.answer_id}
                      className="border border-slate-200 rounded-xl p-4 bg-slate-50/50"
                    >
                      <div className="font-medium text-slate-800 mb-2 flex gap-1">
                        <span>Câu {idx + 1}: </span>
                        <div
                          className="prose max-w-none text-slate-800"
                          dangerouslySetInnerHTML={{
                            __html: ans?.question_content,
                          }}
                        />
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-700 mb-4">
                        <span className="font-semibold text-slate-500 block text-xs mb-1">
                          Bài làm của học sinh:
                        </span>
                        {ans?.essay_answer ? (
                          <div
                            className="prose max-w-none text-slate-800"
                            dangerouslySetInnerHTML={{
                              __html: ans.essay_answer,
                            }}
                          />
                        ) : (
                          <i className="text-slate-400">Không có câu trả lời</i>
                        )}
                      </div>

                      {ans.question_type === "essay" ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Điểm số (Tối đa: {ans.max_score || 10})
                            </label>
                            <input
                              type="number"
                              step="0.25"
                              value={grades[ans.answer_id]?.score || 0}
                              onChange={(e) =>
                                handleGradeChange(
                                  ans.answer_id,
                                  "score",
                                  e.target.value,
                                )
                              }
                              className="w-full border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Nhận xét của giáo viên
                            </label>
                            <input
                              type="text"
                              placeholder="Nhập nhận xét..."
                              value={grades[ans.answer_id]?.comment || ""}
                              onChange={(e) =>
                                handleGradeChange(
                                  ans.answer_id,
                                  "comment",
                                  e.target.value,
                                )
                              }
                              className="w-full border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 italic">
                          (Câu trắc nghiệm - Tự động chấm: {ans.score_given}{" "}
                          điểm)
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t flex justify-end gap-3 bg-slate-50">
                <button
                  onClick={() => setSelectedAttempt(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  disabled={submitting}
                  onClick={handleSubmitGrade}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save size={16} />
                  {submitting ? "Đang lưu..." : "Hoàn tất chấm bài"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradingPage;
