import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Navbar from "../../Components/Navbar";
import useAlert from "../../Components/Alert/useAlert";
import ImageModal from "../../Components/ImageModal";

const CreateCourse = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  // Hàm xử lý khi thay đổi dữ liệu trong ô input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Hàm xử lý khi bấm nút Tạo Khóa Học
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();

      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("thumbnail", formData.thumbnail);

      await api.post("/courses", data);

      showAlert("success", "Thành công", "Tạo khóa học thành công!");
      navigate(-1);
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setFormData((prev) => ({
      ...prev,
      thumbnail: file,
    }));
    setPreview(URL.createObjectURL(file));
  };

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
            Tạo Khóa Học Mới
          </h2>
          <p className="text-slate-500 mb-6 text-sm">
            Điền đầy đủ các thông tin bên dưới để bắt đầu xây dựng bài giảng của
            bạn.
          </p>

          {error && (
            <div className="mb-4 text-sm text-red-500 bg-red-50 p-4 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tên khóa học */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Tên khóa học *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Ví dụ: Lập trình Node.js thực chiến từ số 0"
              />
            </div>

            {/* Ảnh nền hiển thị (Thumbnail) */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Ảnh bìa (Thumbnail URL)
              </label>
              <input
                type="file"
                name="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200
               file:mr-4 file:px-4 file:py-2 file:border-0
               file:rounded-lg file:bg-blue-600 file:text-white
               hover:file:bg-blue-700"
              />
              {preview && (
                <div className="mt-4">
                  <ImageModal
                    src={preview}
                    alt="Preview"
                    className="w-64 h-40 object-cover rounded-xl border shadow"
                  />
                </div>
              )}
            </div>

            {/* Mô tả khóa học */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Mô tả chi tiết *
              </label>
              <textarea
                name="description"
                required
                rows="4"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Tóm tắt nội dung khóa học, học viên sẽ nhận được gì sau khi hoàn thành..."
              ></textarea>
            </div>

            {/* Thanh tác vụ gửi dữ liệu */}
            <div className="flex gap-4 justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="px-6 py-3 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl text-white bg-blue-600 hover:bg-blue-700 font-medium transition shadow-lg shadow-blue-200 disabled:opacity-50"
              >
                {loading ? "Đang khởi tạo..." : "Xuất bản khóa học"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCourse;
