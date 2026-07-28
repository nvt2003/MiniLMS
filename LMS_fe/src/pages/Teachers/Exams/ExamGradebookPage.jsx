import React, { useState, useEffect, useRef } from "react";
import api from "../../../services/api";
import useAlert from "../../../Components/Alert/useAlert";
import { Search, X, Users, CheckCircle2, Award, BookOpen } from "lucide-react";
import Navbar from "../../../Components/Navbar";
import { data, useParams } from "react-router-dom";

const ExamGradebookPage = () => {
  const { examId } = useParams();
  const { showAlert } = useAlert();

  // --- States cho Lọc Khóa Học (Autocomplete) ---
  const [searchCourseText, setSearchCourseText] = useState("");
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseSuggestions, setShowCourseSuggestions] = useState(false);
  const courseSearchRef = useRef(null);

  // --- States cho Lọc Đề Thi (Autocomplete) ---
  const [searchExamText, setSearchExamText] = useState("");
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showExamSuggestions, setShowExamSuggestions] = useState(false);
  const examSearchRef = useRef(null);

  // --- States cho Bảng điểm & Thống kê ---
  const [loading, setLoading] = useState(false);
  const [gradebookData, setGradebookData] = useState({
    summary: { total_students: 0, total_submitted: 0, average_score: 0 },
    students: [],
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("userData") || "{}");
        const teacherId = user?.id;

        const res = await api.get(
          `/courses${teacherId ? `?teacherId=${teacherId}` : ""}`,
        );
        if (res?.status === 200) {
          setCourses(res.data.data.data || []);
        }
      } catch (err) {
        console.error("Lỗi tải khóa học", err);
      }
    };
    fetchCourses();
  }, []);

  // 2. Tải danh sách đề thi dựa trên khóa học đã chọn
  useEffect(() => {
    const fetchExams = async () => {
      if (!selectedCourse) {
        setExams([]);
        return;
      }
      try {
        const res = await api.get(`/exams?course_id=${selectedCourse.id}`);
        if (res.data?.success) {
          setExams(res.data.data || []);
        }
      } catch (err) {
        console.error("Lỗi tải danh sách đề thi", err);
      }
    };
    fetchExams();
  }, [selectedCourse]);

  // Xử lý click ra ngoài để ẩn danh sách gợi ý
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        courseSearchRef.current &&
        !courseSearchRef.current.contains(e.target)
      ) {
        setShowCourseSuggestions(false);
      }
      if (examSearchRef.current && !examSearchRef.current.contains(e.target)) {
        setShowExamSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- XỬ LÝ TÌM KIẾM KHÓA HỌC ---
  const handleSearchCourseChange = (e) => {
    const val = e.target.value;
    setSearchCourseText(val);

    if (val.trim() === "") {
      setFilteredCourses([]);
      setShowCourseSuggestions(false);
      handleClearCourse();
    } else {
      const matches = courses.filter((c) =>
        c.title.toLowerCase().includes(val.toLowerCase()),
      );
      setFilteredCourses(matches);
      setShowCourseSuggestions(true);
    }
  };

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setSearchCourseText(course.title);
    setShowCourseSuggestions(false);

    // Reset bộ lọc đề thi và bảng điểm cũ khi đổi khóa học
    handleClearExam();
  };

  const handleClearCourse = () => {
    setSelectedCourse(null);
    setSearchCourseText("");
    setFilteredCourses([]);
    setShowCourseSuggestions(false);
    handleClearExam();
  };

  // --- XỬ LÝ TÌM KIẾM ĐỀ THI ---
  const handleSearchExamChange = (e) => {
    const val = e.target.value;
    setSearchExamText(val);

    if (val.trim() === "") {
      setFilteredExams([]);
      setShowExamSuggestions(false);
      setSelectedExam(null);
    } else {
      const matches = exams.filter((exam) =>
        exam.title.toLowerCase().includes(val.toLowerCase()),
      );
      setFilteredExams(matches);
      setShowExamSuggestions(true);
    }
  };

  const handleSelectExam = (exam) => {
    setSelectedExam(exam);
    setSearchExamText(exam.title);
    setShowExamSuggestions(false);
    fetchGradebook(selectedCourse?.id, exam.id);
  };

  const handleClearExam = () => {
    setSelectedExam(null);
    setSearchExamText("");
    setFilteredExams([]);
    setShowExamSuggestions(false);
    setGradebookData({
      summary: { total_students: 0, total_submitted: 0, average_score: 0 },
      students: [],
    });
  };

  // Gọi API lấy bảng điểm
  const fetchGradebook = async (courseId, examId) => {
    if (!courseId || !examId) return;
    setLoading(true);
    try {
      const res = await api.get(
        `grading/courses/${courseId}/exams/${examId}/gradebook`,
      );
      if (res.data?.success) {
        setGradebookData(res.data.data);
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Thất bại", "Không thể tải bảng điểm!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // bo qua buoc gan tieu de filter neu khong có id
    if (!examId) return;
    const getExam = async () => {
      const res = await api.get(`/exams/${examId}`);
      setSelectedExam(res?.data?.data);
      setSearchExamText(res?.data?.data?.title);
      setSearchCourseText(res?.data?.data?.course_title);
      fetchGradebook(res.data?.data?.course_id, res.data?.data?.id);
    };
    getExam();
  }, []);
  return (
    <>
      <Navbar />

      <div className="p-6 bg-slate-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            Tổng hợp điểm theo bài thi
          </h1>
          <p className="text-slate-500 text-sm">
            Xem chi tiết điểm số và thống kê kết quả học sinh
          </p>
        </div>

        {/* Thanh bộ lọc kép (Khóa học + Đề thi) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
          {/* 1. Tìm kiếm Khóa học với gợi ý Autocomplete */}
          <div className="flex-1 min-w-[250px] relative" ref={courseSearchRef}>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Tìm khóa học
            </label>
            <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-blue-500">
              <BookOpen size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Nhập tên khóa học..."
                value={searchCourseText}
                onChange={handleSearchCourseChange}
                onFocus={() => {
                  if (searchCourseText.trim()) setShowCourseSuggestions(true);
                }}
                className="w-full text-sm outline-none bg-transparent"
              />
              {searchCourseText && (
                <button
                  onClick={handleClearCourse}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Autocomplete Suggestions cho Khóa học */}
            {showCourseSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCourse(c)}
                      className="px-4 py-2.5 hover:bg-blue-50 text-sm text-slate-700 cursor-pointer border-b border-slate-100 last:border-b-0"
                    >
                      <div className="font-medium text-slate-800">
                        {c.title}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-400 text-center">
                    Không tìm thấy khóa học
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Tìm kiếm Đề thi với gợi ý Autocomplete */}
          <div className="flex-1 min-w-[250px] relative" ref={examSearchRef}>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Tìm đề thi
            </label>
            <div
              className={`flex items-center gap-2 border rounded-lg px-3 py-2 bg-white ${!selectedCourse ? "bg-slate-100 opacity-60 cursor-not-allowed" : "focus-within:ring-2 focus-within:ring-blue-500"}`}
            >
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                disabled={!selectedCourse}
                placeholder={
                  selectedCourse
                    ? "Nhập tên đề thi..."
                    : "Vui lòng chọn khóa học trước"
                }
                value={searchExamText}
                onChange={handleSearchExamChange}
                onFocus={() => {
                  if (searchExamText.trim()) setShowExamSuggestions(true);
                }}
                className="w-full text-sm outline-none bg-transparent disabled:cursor-not-allowed"
              />
              {searchExamText && (
                <button
                  onClick={handleClearExam}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Autocomplete Suggestions cho Đề thi */}
            {showExamSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
                {filteredExams.length > 0 ? (
                  filteredExams.map((exam) => (
                    <div
                      key={exam.id}
                      onClick={() => handleSelectExam(exam)}
                      className="px-4 py-2.5 hover:bg-blue-50 text-sm text-slate-700 cursor-pointer border-b border-slate-100 last:border-b-0"
                    >
                      <div className="font-medium">{exam.title}</div>
                      <div className="text-xs text-slate-400">
                        Thời gian: {exam.duration_minutes} phút
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-400 text-center">
                    Không tìm thấy đề thi
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cards Thống kê */}
        {selectedExam && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  Tổng số bài làm
                </p>
                <h3 className="text-xl font-bold text-slate-800">
                  {gradebookData.summary.total_students}
                </h3>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Đã nộp bài</p>
                <h3 className="text-xl font-bold text-slate-800">
                  {gradebookData.summary.total_submitted} /{" "}
                  {gradebookData.summary.total_students}
                </h3>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Award size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  Điểm trung bình lớp
                </p>
                <h3 className="text-xl font-bold text-amber-600">
                  {gradebookData.summary.average_score || 0}
                </h3>
              </div>
            </div>
          </div>
        )}

        {/* Bảng Điểm */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {!selectedExam ? (
            <div className="p-12 text-center text-slate-400">
              Vui lòng chọn khóa học và đề thi để xem bảng điểm
            </div>
          ) : loading ? (
            <div className="p-12 text-center text-slate-500">
              Đang tải bảng điểm...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                    <th className="p-4">STT</th>
                    <th className="p-4">Họ và tên</th>
                    <th className="p-4">Email</th>
                    <th className="p-4 text-center">Trạng thái</th>
                    <th className="p-4 text-center">Thời gian nộp</th>
                    <th className="p-4 text-right">Điểm số</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {gradebookData.students.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="p-6 text-center text-slate-400"
                      >
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    gradebookData.students.map((student, idx) => (
                      <tr
                        key={student.student_id}
                        className="hover:bg-slate-50/80 transition"
                      >
                        <td className="p-4 font-medium text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="p-4 font-semibold text-slate-800">
                          {student.student_name}
                        </td>
                        <td className="p-4 text-slate-500">
                          {student.student_email}
                        </td>
                        <td className="p-4 text-center">
                          {student.status === "graded" && (
                            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                              Đã chấm
                            </span>
                          )}
                          {student.status === "submitted" && (
                            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                              Chờ chấm
                            </span>
                          )}
                          {student.status === "not_started" && (
                            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-500">
                              Chưa làm
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center text-xs text-slate-500">
                          {student.submit_time
                            ? new Date(student.submit_time).toLocaleString(
                                "vi-VN",
                              )
                            : "-"}
                        </td>
                        <td className="p-4 text-right font-bold text-slate-800">
                          {student.total_score !== null &&
                          student.total_score !== undefined
                            ? Number(student.total_score).toFixed(2)
                            : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ExamGradebookPage;
