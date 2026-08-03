import React, { useState, useEffect } from "react";
import { useNode, useEditor, Element } from "@craftjs/core";

// --- 1. Component con: SlideItem ---
export const SlideItem = ({ children }) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className="w-full h-full flex flex-col justify-center items-center p-4 border-2 border-dashed border-gray-300 bg-gray-50/50 hover:border-blue-400 transition-colors relative min-h-[250px]"
    >
      {/* Khung hướng dẫn hiển thị khi Slide trống */}
      {React.Children.count(children) === 0 && (
        <div className="text-center text-gray-400 select-none pointer-events-none p-6">
          <div className="text-3xl mb-2">📥</div>
          <p className="text-sm font-medium">Slide rỗng</p>
          <p className="text-xs text-gray-400 mt-1">
            Kéo CustomImage, Text hoặc Container từ Toolbox thả vào đây
          </p>
        </div>
      )}
      {children}
    </div>
  );
};

SlideItem.craft = {
  displayName: "SlideItem",
  rules: {
    canDrag: () => true,
  },
};

// --- 2. Bảng Cài Đặt (Settings Panel) ---
export const SliderSettings = () => {
  const {
    actions: { setProp },
    height,
    maxWidth,
    slideIds,
    autoplay,
    interval,
  } = useNode((node) => ({
    height: node.data.props.height,
    maxWidth: node.data.props.maxWidth,
    slideIds: node.data.props.slideIds,
    autoplay: node.data.props.autoplay,
    interval: node.data.props.interval,
  }));

  const handleAddSlide = () => {
    setProp((props) => {
      const newId = `slide_${Date.now()}`;
      props.slideIds.push(newId);
    });
  };

  const handleRemoveSlide = (idToRemove) => {
    setProp((props) => {
      props.slideIds = props.slideIds.filter((id) => id !== idToRemove);
    });
  };

  const handleClearAllSlides = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ Slide không?")) {
      setProp((props) => {
        props.slideIds = [];
      });
    }
  };

  return (
    <div className="space-y-5 p-4 text-sm text-gray-700">
      <h3 className="font-bold text-gray-900 pb-2 border-b">
        Cấu hình Banner Slider
      </h3>

      {/* 1. Kích thước Slider */}
      <div className="space-y-3">
        <h4 className="font-semibold text-xs text-gray-500 uppercase">
          Kích thước Banner
        </h4>
        <div>
          <label className="block text-xs mb-1">Chiều cao (px):</label>
          <input
            type="number"
            value={height}
            onChange={(e) =>
              setProp((props) => (props.height = Number(e.target.value)))
            }
            className="w-full p-2 border rounded text-xs"
            min={100}
            max={1000}
          />
        </div>
        <div>
          <label className="block text-xs mb-1">
            Chiều rộng tối đa (Max Width):
          </label>
          <select
            value={maxWidth}
            onChange={(e) =>
              setProp((props) => (props.maxWidth = e.target.value))
            }
            className="w-full p-2 border rounded text-xs bg-white"
          >
            <option value="max-w-full">Tràn màn hình (100%)</option>
            <option value="max-w-6xl">Rộng (1152px / max-w-6xl)</option>
            <option value="max-w-4xl">Trung bình (896px / max-w-4xl)</option>
            <option value="max-w-2xl">Nhỏ (672px / max-w-2xl)</option>
          </select>
        </div>
      </div>

      {/* 2. Cấu hình Chuyển Slide (Autoplay & Timing) */}
      <div className="space-y-3 border-t pt-3">
        <h4 className="font-semibold text-xs text-gray-500 uppercase">
          Tự động chuyển Slide
        </h4>

        <div className="flex items-center justify-between">
          <label htmlFor="autoplay-toggle" className="text-xs cursor-pointer">
            Bật tự động chuyển:
          </label>
          <input
            id="autoplay-toggle"
            type="checkbox"
            checked={autoplay}
            onChange={(e) =>
              setProp((props) => (props.autoplay = e.target.checked))
            }
            className="w-4 h-4 cursor-pointer accent-blue-600"
          />
        </div>

        {autoplay && (
          <div>
            <label className="block text-xs mb-1">
              Thời gian chuyển slide:
            </label>
            <select
              value={interval}
              onChange={(e) =>
                setProp((props) => (props.interval = Number(e.target.value)))
              }
              className="w-full p-2 border rounded text-xs bg-white"
            >
              <option value={1000}>1 giây</option>
              <option value={2000}>2 giây</option>
              <option value={3000}>3 giây (Mặc định)</option>
              <option value={5000}>5 giây</option>
              <option value={7000}>7 giây</option>
              <option value={10000}>10 giây</option>
            </select>
          </div>
        )}
      </div>

      {/* 3. Quản lý danh sách Slide */}
      <div className="space-y-3 border-t pt-3">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-xs text-gray-500 uppercase">
            Danh sách Slide ({slideIds.length})
          </h4>
          {slideIds.length > 0 && (
            <button
              onClick={handleClearAllSlides}
              className="text-xs text-red-600 hover:underline font-medium"
            >
              Xóa tất cả
            </button>
          )}
        </div>

        {slideIds.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-2">
            Chưa có slide nào. Hãy bấm nút thêm ở dưới.
          </p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {slideIds.map((id, index) => (
              <div
                key={id}
                className="flex justify-between items-center p-2 bg-gray-50 border rounded text-xs"
              >
                <span className="font-medium text-gray-700">
                  Slide #{index + 1}
                </span>
                <button
                  onClick={() => handleRemoveSlide(id)}
                  className="text-red-500 hover:text-red-700 px-1 font-bold"
                  title="Xóa slide này"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleAddSlide}
          className="w-full py-2 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition"
        >
          + Thêm Slide mới
        </button>
      </div>
    </div>
  );
};

// --- 3. Component CHÍNH: Slider Banner ---
export const Slider = ({
  height = 400,
  maxWidth = "max-w-full",
  slideIds = ["slide_default_1", "slide_default_2"],
  autoplay = false,
  interval = 3000,
}) => {
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const [activeTab, setActiveTab] = useState(0);

  // Xử lý tự động chuyển slide (Autoplay)
  useEffect(() => {
    // Không tự động chạy nếu bị tắt Autoplay, hoặc không đủ slide, hoặc đang thao tác trong Editor
    if (!autoplay || slideIds.length <= 1 || enabled) return;

    const timer = setInterval(() => {
      setActiveTab((prevTab) => (prevTab + 1) % slideIds.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoplay, interval, slideIds.length, enabled]);

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`relative w-full mx-auto my-4 bg-white rounded-lg border shadow-sm transition-all overflow-hidden ${maxWidth} ${
        selected ? "ring-2 ring-blue-500" : ""
      }`}
    >
      {/* Thanh tab chuyển slide khi dùng trong Editor */}
      <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b border-gray-200 z-10 relative">
        <div className="flex items-center space-x-2 overflow-x-auto py-1">
          <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">
            Danh sách Slide:
          </span>
          {slideIds.length === 0 && (
            <span className="text-xs text-red-500 italic">
              Trống - Bấm cài đặt để thêm slide
            </span>
          )}
          {slideIds.map((id, idx) => (
            <button
              key={id}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab(idx);
              }}
              className={`px-3 py-1 text-xs rounded transition-all whitespace-nowrap ${
                activeTab === idx
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Slide {idx + 1}
            </button>
          ))}
        </div>

        {/* Cảnh báo trạng thái Autoplay trên thanh Tab */}
        <div className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">
          {autoplay ? `Tự động: ${interval / 1000}s` : "Tắt tự động"}
        </div>
      </div>

      {/* Vùng hiển thị nội dung các Slide */}
      <div
        style={{ height: `${height}px` }}
        className="relative w-full overflow-hidden"
      >
        {slideIds.map((id, idx) => (
          <div
            key={id}
            className={`w-full h-full ${idx === activeTab ? "block" : "hidden"}`}
          >
            <Element id={id} is={SlideItem} canvas />
          </div>
        ))}
      </div>
    </div>
  );
};

Slider.craft = {
  displayName: "Slider Banner",
  props: {
    height: 400,
    maxWidth: "max-w-full",
    slideIds: ["slide_default_1", "slide_default_2"],
    autoplay: false,
    interval: 3000,
  },
  related: {
    settings: SliderSettings,
  },
};
