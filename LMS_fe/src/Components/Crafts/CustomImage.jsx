import React, { useState } from "react";
import { useNode } from "@craftjs/core";
import { uploadImage } from "../../services/imageApi";
import useAlert from "../Alert/useAlert";

export const CustomImage = ({ src, alt, width, height, objectFit }) => {
  const { showAlert } = useAlert();
  const {
    connectors: { connect, drag },
    actions,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));
  const [isHoveredingFile, setIsHoveredingFile] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Xử lý khi kéo file máy tính đè lên ô
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHoveredingFile(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHoveredingFile(false);
  };

  // Xử lý khi thả file ảnh từ máy tính vào
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHoveredingFile(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith("image/")) {
        showAlert("warning", "", "Vui lòng chỉ thả tệp hình ảnh!");
        return;
      }

      try {
        setUploading(true);
        const res = await uploadImage(file);
        // Trích xuất URL tùy theo cấu trúc dữ liệu trả về từ Controller của bạn
        const imageUrl = res.url || res.data?.url || res.secure_url;

        // Cập nhật URL ảnh mới vào State của Craft.js
        actions.setProp((props) => (props.src = imageUrl));
      } catch (err) {
        console.error("Lỗi upload ảnh:", err);
        showAlert("error", "Lỗi", "Upload ảnh thất bại!");
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative group border-2 transition-all ${
        isHoveredingFile
          ? "border-dashed border-blue-500 bg-blue-50"
          : "border-transparent"
      }`}
      style={{ width, height }}
    >
      {uploading && (
        <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-xs z-10 rounded">
          Đang tải lên Cloudinary...
        </div>
      )}

      {src ? (
        <img
          src={src}
          alt={alt || "Image"}
          className="w-full h-full"
          style={{ objectFit }}
        />
      ) : (
        /* Khung hiển thị mặc định khi chưa có ảnh */
        <div className="w-full h-40 bg-gray-100 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center p-4 text-center">
          <p className="text-sm font-medium text-gray-600">
            Kéo & thả tệp ảnh vào đây
          </p>
          <p className="text-xs text-gray-400 mt-1">
            hoặc chọn file ở bảng thuộc tính bên phải
          </p>
        </div>
      )}
    </div>
  );
};

// --- BẢNG CÀI ĐẶT THUỘC TÍNH (SETTINGS PANEL) ---
function ImageSettings() {
  const { showAlert } = useAlert();
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props,
  }));

  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const res = await uploadImage(file);
      const imageUrl = res.url || res.data?.url || res.secure_url;
      setProp((p) => (p.src = imageUrl));
    } catch (error) {
      showAlert("error", "Lỗi", "Upload ảnh thất bại!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-4 text-sm">
      <div>
        <label className="font-semibold block mb-1">Tải ảnh mới</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="w-full text-xs"
        />
        {uploading && (
          <span className="text-xs text-blue-600">Đang tải...</span>
        )}
      </div>

      <div>
        <label className="font-semibold block mb-1">Đường dẫn URL ảnh</label>
        <input
          type="text"
          value={props.src || ""}
          onChange={(e) => setProp((p) => (p.src = e.target.value))}
          placeholder="https://..."
          className="w-full p-2 border rounded text-xs"
        />
      </div>

      <div>
        <label className="font-semibold block mb-1">Độ rộng (Width)</label>
        <select
          value={props.width}
          onChange={(e) => setProp((p) => (p.width = e.target.value))}
          className="w-full p-2 border rounded"
        >
          <option value="100%">Tự động dãn (100%)</option>
          <option value="300px">Cố định (300px)</option>
          <option value="150px">Cố định (150px)</option>
        </select>
      </div>

      <div>
        <label className="font-semibold block mb-1">
          Kiểu hiển thị (Object Fit)
        </label>
        <select
          value={props.objectFit}
          onChange={(e) => setProp((p) => (p.objectFit = e.target.value))}
          className="w-full p-2 border rounded"
        >
          <option value="cover">Cover (Cắt vừa khung)</option>
          <option value="contain">Contain (Giữ nguyên tỉ lệ)</option>
          <option value="fill">Fill (Làm đầy)</option>
        </select>
      </div>
    </div>
  );
}

CustomImage.craft = {
  displayName: "CustomImage",
  defaultProps: {
    src: "",
    alt: "Uploaded Image",
    width: "100%",
    height: "auto",
    objectFit: "cover",
  },
  related: {
    settings: ImageSettings,
  },
};
