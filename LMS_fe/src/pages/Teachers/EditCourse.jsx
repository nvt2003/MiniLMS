import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import useAlert from "../../Components/Alert/useAlert";
import ImageModal from "../../Components/ImageModal";

const EditCourse = () => {
  const { id } = useParams(); // Lấy ID khóa học từ URL
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState("");
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState(null);
  const [error, setError] = useState("");
  const { showAlert } = useAlert();

  // 1. Tự động tải dữ liệu cũ của khóa học lên Form
  useEffect(() => {
    const fetchCourseDetail = async () => {
      try {
        const res = await api.get(`/courses/${id}`);
        // Giả định API trả về object chứa thông tin khóa học trực tiếp hoặc qua res.data.data
        const course = res.data.data || res.data;
        setFormData({
          title: course.title || "",
          description: course.description || "",
        });
        setCurrentThumbnailUrl(course?.thumbnail_url);
      } catch (err) {
        setError("Không thể lấy thông tin khóa học này.");
        console.log(err?.response?.data?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCourseDetail();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  // 2. Gửi dữ liệu cập nhật lên Server
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      if (formData.thumbnail) data.append("thumbnail", formData.thumbnail);
      await api.put(`/courses/${id}`, data);
      showAlert(
        "success",
        "Thành công",
        "Cập nhật thông tin khóa học thành công!",
      );
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Cập nhật thất bại, vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Đang tải thông tin khóa học...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 shadow-xl border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-slate-800">
            Chỉnh sửa khóa học
          </h2>
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-semibold text-slate-500 hover:text-slate-800"
          >
            ← Quay lại
          </button>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">
              Tên khóa học
            </label>
            <input
              type="text"
              name="title"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">
              Mô tả ngắn khóa học
            </label>
            <textarea
              name="description"
              rows="4"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">
              Ảnh bìa (Thumbnail URL)
            </label>
            {currentThumbnailUrl ? (
              <ImageModal
                src={currentThumbnailUrl}
                alt="Ảnh bìa bài học"
                className="w-full max-h-48 object-cover rounded-xl border mb-2"
              />
            ) : (
              <p className="text-sm text-slate-400 mb-2">
                Bài học này chưa có ảnh bìa.
              </p>
            )}
            <input
              type="file"
              name="image/*"
              className="w-full px-4 py-3 rounded-xl border border-slate-200
               file:mr-4 file:px-4 file:py-2 file:border-0
               file:rounded-lg file:bg-blue-600 file:text-white
               hover:file:bg-blue-700"
              onChange={handleImageChange}
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

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-xl transition text-center"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition shadow-lg shadow-blue-100 disabled:opacity-50"
            >
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCourse;
