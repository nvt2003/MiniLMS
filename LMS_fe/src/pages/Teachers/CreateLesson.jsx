import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import useAlert from "../../Components/Alert/useAlert";
import ImageModal from "../../Components/ImageModal";
import TextEditor from "../../Components/TextEditor";

const CreateLesson = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [position, setPosition] = useState(1);
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  // const [imageIds, setImageIds] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { showAlert } = useAlert();

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setVideoFile(e.target.files[0]);
    }
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!title) return setError("Vui lòng nhập tiêu đề bài học!");

  //   setLoading(true);
  //   setError("");

  //   try {
  //     const formData = new FormData();
  //     formData.append("courseId", courseId);
  //     formData.append("title", title);
  //     formData.append("content", content);
  //     formData.append("position", position);
  //     formData.append("imageIds", JSON.stringify(imageIds));
  //     if (thumbnail) {
  //       formData.append("thumbnail", thumbnail);
  //     }
  //     if (videoFile) {
  //       formData.append("video", videoFile);
  //     }

  //     //Xóa ảnh bị xóa trong quá trình viết bài
  //     const parser = new DOMParser();

  //     const doc = parser.parseFromString(content, "text/html");

  //     const currentUrls = [...doc.querySelectorAll("img")].map(
  //       (img) => img.src,
  //     );
  //     const imageIds = uploadedImages
  //       .filter((image) => currentUrls.includes(image.url))
  //       .map((image) => image.id);
  //     const deletedImages = uploadedImages.filter(
  //       (img) => !currentUrls.includes(img.url),
  //     );
  //     for (const img of deletedImages) {
  //       await api.delete(`/lesson-images/${img.id}`);
  //     }

  //     await api.post("/lessons", formData, {
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //       },
  //     });

  //     showAlert(
  //       "success",
  //       "Thành công",
  //       "Tạo bài học và tải video lên thành công!",
  //     );
  //     navigate(-1);
  //   } catch (err) {
  //     setError(
  //       err.response?.data?.message ||
  //         "Có lỗi xảy ra trong quá trình upload video.",
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title) return setError("Vui lòng nhập tiêu đề bài học!");

    setLoading(true);
    setError("");

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, "text/html");

      // Lấy các URL ảnh còn tồn tại trong editor
      const currentUrls = [...doc.querySelectorAll("img")].map(
        (img) => img.src,
      );

      // Ảnh còn dùng
      const keepImageIds = uploadedImages
        .filter((image) => currentUrls.includes(image.url))
        .map((image) => image.id);

      // Ảnh đã bị xóa khỏi editor
      const deletedImages = uploadedImages.filter(
        (image) => !currentUrls.includes(image.url),
      );

      const formData = new FormData();

      formData.append("courseId", courseId);
      formData.append("title", title);
      formData.append("content", content);
      formData.append("position", position);

      // chỉ gửi ảnh còn tồn tại
      formData.append("imageIds", JSON.stringify(keepImageIds));

      if (thumbnail) {
        formData.append("thumbnail", thumbnail);
      }

      if (videoFile) {
        formData.append("video", videoFile);
      }

      // 1. Tạo lesson trước
      await api.post("/lessons", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // 2. Xóa ảnh không còn sử dụng
      for (const image of deletedImages) {
        try {
          await api.delete(`/lessonImages/${image.id}`);
        } catch (err) {
          const errorMessage =
            err?.response?.data?.message || err?.data?.message;

          if (errorMessage === "Không tìm thấy ảnh") {
            // Ảnh không tồn tại thì ghi log cảnh báo nhẹ và bỏ qua để chạy tiếp
            console.warn(
              `Ảnh ID ${image.id} không tồn tại trên hệ thống, bỏ qua.`,
            );
          } else {
            // Với các lỗi khác (lỗi mạng, lỗi server 500...), ta vẫn ghi log lỗi nhưng không throw để vòng lặp tiếp tục
            console.error(`Lỗi khác khi xóa ảnh ID ${image.id}:`, err);
          }
        }
      }

      showAlert("success", "Thành công", "Tạo bài học thành công!");

      navigate(`/teacher/course/${courseId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra khi tạo bài học.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <button
          onClick={() => navigate(`/teacher/course/${courseId}`)}
          className="mb-6 text-sm font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition"
        >
          ← Quay lại
        </button>

        <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
          Thêm Bài Học Mới
        </h2>
        <p className="text-slate-500 mb-6 text-sm">
          Tải lên video bài giảng và điền thông tin mô tả chi tiết.
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-500 bg-red-50 p-4 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tiêu đề bài học */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Tiêu đề bài học *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ví dụ: Bài 1: Tổng quan về kiến trúc MVC"
            />
          </div>
          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Ảnh bìa
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files[0])}
            />
            {thumbnail && <p>{thumbnail.name}</p>}
            {thumbnail && (
              <ImageModal
                src={URL.createObjectURL(thumbnail)}
                alt="preview"
                style={{
                  width: 200,
                  borderRadius: 8,
                }}
              />
            )}
          </div>
          {/* Chọn File Video */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Video bài giảng (MP4, MKV, MOV)
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            {videoFile && (
              <p className="mt-2 text-xs text-slate-500">
                File đã chọn:{" "}
                <span className="font-medium text-slate-700">
                  {videoFile.name}
                </span>{" "}
                ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Thứ tự hiển thị */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Thứ tự hiển thị (Vị trí)
            </label>
            <input
              type="number"
              min="1"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Nội dung / Ghi chú bài học */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Nội dung văn bản
            </label>
            {/* <TextEditor
              value={content}
              onChange={setContent}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Các ghi chú chính, link tài liệu hoặc bài tập về nhà cho học viên..."
            ></TextEditor> */}
            <TextEditor
              value={content}
              onChange={setContent}
              onImageUploaded={(image) => {
                setUploadedImages((prev) => [...prev, image]);
              }}
            />
          </div>

          {/* Thanh nút bấm */}
          <div className="flex gap-4 justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate(`/teacher/course/${courseId}`)}
              className="px-6 py-3 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl text-white bg-blue-600 hover:bg-blue-700 font-medium transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Đang tải video lên Cloudinary...
                </>
              ) : (
                "Thêm bài học"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLesson;
