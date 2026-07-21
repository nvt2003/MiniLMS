import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import useAlert from "../../Components/Alert/useAlert";
import ImageModal from "../../Components/ImageModal";
import TextEditor from "../../Components/TextEditor";

const EditLesson = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [courseId, setCoureId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [position, setPosition] = useState(1);
  const [currentVideoUrl, setCurrentVideoUrl] = useState("");
  const [newVideoFile, setNewVideoFile] = useState(null);
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState("");
  const [newThumbnailFile, setNewThumbnailFile] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const previewUrl = newThumbnailFile
    ? URL.createObjectURL(newThumbnailFile)
    : null;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const { showAlert } = useAlert();

  // Tải thông tin cũ của bài học lên form
  useEffect(() => {
    const fetchLessonDetail = async () => {
      try {
        const res = await api.get(`/lessons/${id}`);
        const lesson = res.data.data;
        setCoureId(lesson.course_id);
        setTitle(lesson.title);
        setContent(lesson.content || "");
        setPosition(lesson.position);
        setCurrentVideoUrl(lesson.video_url || "");
        setCurrentThumbnailUrl(lesson.thumbnail_url || "");
        setUploadedImages(lesson.images || []);
      } catch (err) {
        setError("Không thể tải thông tin bài học này.");
        console.log(err);
      } finally {
        setFetching(false);
      }
    };
    fetchLessonDetail();
  }, [id]);

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   setError("");

  //   try {
  //     const formData = new FormData();
  //     formData.append("title", title);
  //     formData.append("content", content);
  //     formData.append("position", position);

  //     if (newVideoFile) {
  //       formData.append("video", newVideoFile);
  //     }
  //     if (newThumbnailFile) {
  //       formData.append("thumbnail", newThumbnailFile);
  //     }

  //     await api.put(`/lessons/${id}`, formData, {
  //       headers: { "Content-Type": "multipart/form-data" },
  //     });

  //     showAlert("success", "Thành công", "Cập nhật bài học thành công!");
  //     navigate(`/teacher/course/${id}`);
  //   } catch (err) {
  //     setError(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật.");
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

      // Lấy các URL ảnh còn trong editor
      const currentUrls = [...doc.querySelectorAll("img")].map(
        (img) => img.src,
      );

      // Danh sách ảnh còn sử dụng
      const keepImageIds = uploadedImages
        .filter((image) => currentUrls.includes(image.url))
        .map((image) => image.id);

      // Danh sách ảnh đã bị xóa khỏi editor
      const deletedImages = uploadedImages.filter(
        (image) => !currentUrls.includes(image.url),
      );

      const formData = new FormData();

      formData.append("title", title);
      formData.append("content", content);
      formData.append("position", position);

      // Gửi danh sách ảnh còn sử dụng
      formData.append("imageIds", JSON.stringify(keepImageIds));

      if (newVideoFile) {
        formData.append("video", newVideoFile);
      }

      if (newThumbnailFile) {
        formData.append("thumbnail", newThumbnailFile);
      }

      // Cập nhật lesson
      await api.put(`/lessons/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Xóa các ảnh không còn sử dụng
      for (const image of deletedImages) {
        try {
          await api.delete(`/lessonImages/${image.id}`);
        } catch (err) {
          const errorMessage =
            err?.response?.data?.message || err?.data?.message;

          if (errorMessage === "Không tìm thấy ảnh") {
            console.warn(
              `Ảnh ID ${image.id} không tồn tại trên hệ thống, bỏ qua.`,
            );
          } else {
            console.error(`Lỗi khi xóa ảnh ID ${image.id}:`, err);
          }
        }
      }

      showAlert("success", "Thành công", "Cập nhật bài học thành công!");

      navigate(`/teacher/course/${courseId}`);
    } catch (err) {
      setError(
        err.response?.data?.message || "Có lỗi xảy ra khi cập nhật bài học.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching)
    return <div className="text-center p-10">Đang tải dữ liệu bài học...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <button
          onClick={() => navigate(`/teacher/course/${courseId}`)}
          className="mb-6 text-sm font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1"
        >
          ← Quay lại
        </button>

        <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
          Chỉnh Sửa Bài Học
        </h2>

        {error && (
          <div className="mb-4 text-sm text-red-500 bg-red-50 p-4 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Video hiện tại
            </label>
            {currentVideoUrl ? (
              <video
                src={currentVideoUrl}
                controls
                className="w-full max-h-48 rounded-xl bg-black mb-2"
              />
            ) : (
              <p className="text-sm text-slate-400 mb-2">
                Bài học này chưa có video giảng dạy.
              </p>
            )}

            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Thay đổi video bài giảng mới (Tùy chọn)
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setNewVideoFile(e.target.files[0])}
              className="w-full px-4 py-2 border rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Ảnh bìa hiện tại
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

            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Thay đổi ảnh bìa mới (Tùy chọn)
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewThumbnailFile(e.target.files[0])}
              className="w-full px-4 py-2 border rounded-xl"
            />
            {previewUrl ? (
              <ImageModal
                src={previewUrl}
                alt="Ảnh bìa"
                className="w-full max-h-48 object-cover rounded-xl border mb-2"
              />
            ) : (
              <p className="text-sm text-slate-400 mb-2">Chọn ảnh để xem</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Thứ tự hiển thị
            </label>
            <input
              type="number"
              min="1"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Nội dung văn bản
            </label>
            {/* <textarea
              rows="4"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200"
            /> */}
            <TextEditor
              value={content}
              onChange={setContent}
              onImageUploaded={(image) => {
                setUploadedImages((prev) => [...prev, image]);
              }}
            />
          </div>

          <div className="flex gap-4 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate(`/teacher/course/${courseId}`)}
              className="px-6 py-3 rounded-xl bg-slate-100 font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl text-white bg-blue-600 font-medium disabled:opacity-50"
            >
              {loading ? "Đang lưu thay đổi..." : "Cập nhật bài học"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLesson;
