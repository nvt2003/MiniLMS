import React, { useState } from "react";
import { Copy, Trash2, AlertTriangle, X, Check } from "lucide-react";

const ExamActionButtons = ({ examId, examTitle, onCopy, onDelete }) => {
  // State quản lý Modal xác nhận
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'COPY' hoặc 'DELETE'
  });

  const [loading, setLoading] = useState(false);

  // Mở modal xác nhận
  const openConfirm = (type) => {
    setConfirmModal({ isOpen: true, type });
  };

  // Đóng modal
  const closeModal = () => {
    if (loading) return;
    setConfirmModal({ isOpen: false, type: null });
  };

  // Xử lý thực thi hành động sau khi người dùng bấm "Xác nhận"
  const handleExecute = async () => {
    setLoading(true);
    try {
      if (confirmModal.type === "COPY") {
        await onCopy(examId);
      } else if (confirmModal.type === "DELETE") {
        await onDelete(examId);
      }
      closeModal();
    } catch (error) {
      console.error(`Lỗi khi ${confirmModal.type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const isDelete = confirmModal.type === "DELETE";

  return (
    <>
      {/* Cặp nút hành động */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => openConfirm("COPY")}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition"
          title="Sao chép đề thi"
        >
          <Copy size={16} />
          <span>Sao chép</span>
        </button>

        <button
          onClick={() => openConfirm("DELETE")}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition"
          title="Xóa đề thi"
        >
          <Trash2 size={16} />
          <span>Xóa</span>
        </button>
      </div>

      {/* Modal xác nhận trước khi thực hiện */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 space-y-4">
            {/* Header / Icon cảnh báo */}
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-full shrink-0 ${
                  isDelete
                    ? "bg-red-100 text-red-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {isDelete ? <Trash2 size={24} /> : <Copy size={24} />}
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900">
                  {isDelete
                    ? "Xác nhận xóa đề thi?"
                    : "Xác nhận sao chép đề thi?"}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {isDelete ? (
                    <>
                      Bạn có chắc chắn muốn xóa đề thi{" "}
                      <b className="text-gray-800">
                        "{examTitle || `#${examId}`}"
                      </b>
                      ? Thao tác này không thể hoàn tác.
                    </>
                  ) : (
                    <>
                      Tạo bản sao mới cho đề thi{" "}
                      <b className="text-gray-800">
                        "{examTitle || `#${examId}`}"
                      </b>{" "}
                      bao gồm đầy đủ danh sách câu hỏi?
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Các nút bấm trong Modal */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleExecute}
                disabled={loading}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-white rounded-lg text-sm font-medium transition shadow-sm ${
                  isDelete
                    ? "bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500/20"
                    : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20"
                } disabled:opacity-50`}
              >
                {loading ? (
                  <span>Đang xử lý...</span>
                ) : (
                  <>
                    <Check size={16} />
                    <span>{isDelete ? "Xóa ngay" : "Sao chép"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExamActionButtons;
