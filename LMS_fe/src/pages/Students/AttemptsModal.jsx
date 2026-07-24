import React, { useState, useEffect } from "react";
import {
  Search,
  History,
  X,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../../services/api";

const AttemptsModal = ({
  isOpen,
  onClose,
  currentAttemptId,
  onSelectAttempt,
}) => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 5;

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1);
  };

  // 1. Lắng nghe phím ESC & Khóa cuộn trang khi Modal mở
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Khóa scroll màn hình chính
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset"; // Mở lại scroll khi đóng modal
    };
  }, [isOpen, onClose]);

  // 2. Gọi API lấy danh sách bài thi khi mở hoặc thay đổi bộ lọc
  useEffect(() => {
    if (isOpen) {
      const fetchAttempts = async () => {
        setLoading(true);
        try {
          const res = await api.get("/attempts", {
            params: { search, sortBy, limit: limit },
          });
          setAttempts(res.data.data);
        } catch (err) {
          console.error("Lỗi lấy danh sách bài thi:", err);
        } finally {
          setLoading(false);
        }
      };

      const timer = setTimeout(fetchAttempts, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, search, sortBy]);

  if (!isOpen) return null;

  return (
    // Backdrop: Bấm ra vùng đen mờ này sẽ đóng Modal
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Modal Container: Dùng e.stopPropagation() để bấm bên trong không bị đóng */}
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex justify-between items-center px-5 py-4 border-b">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <History size={18} /> Danh sách bài thi đã làm
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Thanh Tìm Kiếm & Sắp Xếp */}
        <div className="p-4 border-b bg-gray-50 flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Tìm theo tên bài thi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-1.5 pl-3 pr-8 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="score_desc">Điểm: Cao ➔ Thấp</option>
              <option value="score_asc">Điểm: Thấp ➔ Cao</option>
            </select>
            <ArrowUpDown
              className="absolute right-2.5 top-2.5 text-gray-400 pointer-events-none"
              size={14}
            />
          </div>
        </div>

        {/* Danh sách bài thi */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {loading ? (
            <p className="text-center text-sm text-gray-500 py-6">
              Đang tìm kiếm...
            </p>
          ) : attempts.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-6">
              Không tìm thấy bài thi phù hợp
            </p>
          ) : (
            attempts.map((item) => (
              <div
                key={item.attempt_id}
                onClick={() => {
                  onSelectAttempt(item.attempt_id);
                  onClose();
                }}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex justify-between items-center ${
                  item.attempt_id === Number(currentAttemptId)
                    ? "border-blue-500 bg-blue-50/60 font-medium"
                    : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"
                }`}
              >
                <div className="space-y-1">
                  <p className="text-sm text-gray-900 line-clamp-1">
                    {item.exam_title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(
                      item.submit_time || item.start_time,
                    ).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="text-right pl-3">
                  <span
                    className={`font-bold text-sm ${item.total_score >= 5 ? "text-green-600" : "text-red-500"}`}
                  >
                    {item.total_score != null
                      ? `${item.total_score}đ`
                      : "Chờ chấm"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Footer Phân Trang */}
        <div className="flex justify-between items-center px-5 py-3 border-t bg-gray-50 text-xs text-gray-600">
          <span>
            Trang <strong>{page}</strong> / <strong>{totalPages}</strong>
          </span>

          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((prev) => prev - 1)}
              className="p-1.5 rounded-md border bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((prev) => prev + 1)}
              className="p-1.5 rounded-md border bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttemptsModal;
