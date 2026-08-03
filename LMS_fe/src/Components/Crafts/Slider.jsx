import React, { useState } from "react";
import { useNode } from "@craftjs/core";

export const Slider = ({ slides = [] }) => {
  const {
    connectors: { connect, drag },
    selected,
    actions: { setProp },
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    if (slides.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    if (slides.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const current = slides[currentIndex] || {
    image: "https://via.placeholder.com/1200x400?text=Banner+Slide",
    title: "Tiêu đề Slide mặc định",
    description: "Nhập mô tả cho slide của bạn ở phần cài đặt bên phải.",
  };

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`relative w-full h-[400px] overflow-hidden rounded-lg shadow-md bg-gray-900 group ${
        selected ? "ring-2 ring-blue-500" : ""
      }`}
    >
      {/* Hình nền Slide */}
      <img
        src={current.image}
        alt="Slide Banner"
        className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
      />

      {/* Lớp phủ tối (Overlay) */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Nội dung Text trên Banner */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white z-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-3 drop-shadow-md">
          {current.title}
        </h2>
        <p className="text-lg max-w-xl drop-shadow-sm text-gray-200">
          {current.description}
        </p>
      </div>

      {/* Nút điều hướng Trái / Phải (Hiển thị khi hover) */}
      {slides.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 z-20"
          >
            ◀
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 z-20"
          >
            ▶
          </button>
        </>
      )}

      {/* Chấm tròn chỉ số slide (Dots) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(idx);
            }}
            className={`w-3 h-3 rounded-full transition-all ${
              idx === currentIndex ? "bg-white w-6" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Bảng tùy chỉnh (Settings Panel) cho Slider trong Craft.js
const SliderSettings = () => {
  const {
    actions: { setProp },
    slides,
  } = useNode((node) => ({
    slides: node.data.props.slides,
  }));

  const handleAddSlide = () => {
    setProp((props) => {
      props.slides.push({
        image:
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200",
        title: "Slide mới",
        description: "Mô tả cho slide mới thêm vào.",
      });
    });
  };

  const handleUpdateSlide = (index, field, value) => {
    setProp((props) => {
      props.slides[index][field] = value;
    });
  };

  const handleRemoveSlide = (index) => {
    setProp((props) => {
      props.slides.splice(index, 1);
    });
  };

  return (
    <div className="space-y-4 p-4">
      <h3 className="font-bold text-gray-700">Cấu hình Banner Slideshow</h3>

      {slides.map((slide, index) => (
        <div
          key={index}
          className="p-3 border rounded bg-gray-50 space-y-2 relative"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500">
              Slide #{index + 1}
            </span>
            <button
              onClick={() => handleRemoveSlide(index)}
              className="text-red-500 text-xs hover:underline"
            >
              Xóa
            </button>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Link Ảnh (URL):
            </label>
            <input
              type="text"
              value={slide.image}
              onChange={(e) =>
                handleUpdateSlide(index, "image", e.target.value)
              }
              className="w-full text-xs p-1.5 border rounded"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Tiêu đề:</label>
            <input
              type="text"
              value={slide.title}
              onChange={(e) =>
                handleUpdateSlide(index, "title", e.target.value)
              }
              className="w-full text-xs p-1.5 border rounded"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Mô tả:</label>
            <textarea
              value={slide.description}
              onChange={(e) =>
                handleUpdateSlide(index, "description", e.target.value)
              }
              className="w-full text-xs p-1.5 border rounded resize-none"
              rows={2}
            />
          </div>
        </div>
      ))}

      <button
        onClick={handleAddSlide}
        className="w-full py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
      >
        + Thêm Slide mới
      </button>
    </div>
  );
};

Slider.craft = {
  displayName: "Slider Banner",
  props: {
    slides: [
      {
        image:
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200",
        title: "Chào mừng đến với Website",
        description: "Kéo thả và tùy chỉnh giao diện",
      },
      {
        image:
          "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200",
        title: "Khám phá các sản phẩm mới",
        description: "Ưu đãi cực lớn trong tháng này dành cho bạn.",
      },
    ],
  },
  related: {
    toolbar: SliderSettings,
  },
};
