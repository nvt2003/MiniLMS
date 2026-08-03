import React, { useState } from "react";

// Danh sách màu Tailwind phổ biến
const PALETTE_BG = [
  {
    label: "Cơ bản",
    colors: [
      "bg-white",
      "bg-transparent",
      "bg-black",
      "bg-gray-100",
      "bg-gray-800",
    ],
  },
  {
    label: "Đỏ / Cam / Vàng",
    colors: [
      "bg-red-100",
      "bg-red-500",
      "bg-orange-500",
      "bg-amber-100",
      "bg-yellow-400",
    ],
  },
  {
    label: "Xanh Lá / Dương",
    colors: [
      "bg-green-100",
      "bg-green-500",
      "bg-blue-100",
      "bg-blue-500",
      "bg-indigo-600",
    ],
  },
  {
    label: "Tím / Hồng",
    colors: [
      "bg-purple-100",
      "bg-purple-500",
      "bg-pink-100",
      "bg-pink-500",
      "bg-rose-400",
    ],
  },
];

const PALETTE_TEXT = [
  {
    label: "Cơ bản",
    colors: [
      "text-white",
      "text-black",
      "text-gray-500",
      "text-gray-700",
      "text-gray-900",
    ],
  },
  {
    label: "Đỏ / Cam / Vàng",
    colors: [
      "text-red-500",
      "text-red-700",
      "text-orange-500",
      "text-amber-600",
      "text-yellow-600",
    ],
  },
  {
    label: "Xanh Lá / Dương",
    colors: [
      "text-green-600",
      "text-emerald-500",
      "text-blue-500",
      "text-blue-700",
      "text-indigo-600",
    ],
  },
  {
    label: "Tím / Hồng",
    colors: ["text-purple-600", "text-pink-500", "text-rose-600"],
  },
];

export const ColorPickerModal = ({
  value,
  onChange,
  label = "Màu sắc",
  isText = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const paletteGroups = isText ? PALETTE_TEXT : PALETTE_BG;
  const handleSelect = (colorClass) => {
    onChange(colorClass);
    setIsOpen(false);
  };

  // Màu đang chọn để preview trên nút
  const previewBg = isText
    ? value?.replace("text-", "bg-") || "bg-gray-800"
    : value || "bg-white";

  return (
    <div className="flex flex-col gap-1">
      <label className="font-semibold text-xs text-gray-700">{label}</label>

      {/* Nút bấm mở Modal */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-between w-full p-2 border rounded bg-white hover:bg-gray-50 text-xs shadow-sm"
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-5 h-5 rounded border shadow-inner ${previewBg}`}
          />
          <span className="font-mono text-gray-600">{value || "Mặc định"}</span>
        </div>
        <span className="text-gray-400 text-[10px]">Đổi màu 🎨</span>
      </button>

      {/* Modal Bảng Màu */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-80 p-4 max-h-[80vh] flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-sm text-gray-800">Chọn {label}</h4>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-base font-bold px-1"
              >
                ✕
              </button>
            </div>

            {/* Khung chứa các ô màu */}
            <div className="flex flex-col gap-3 overflow-y-auto pr-1">
              {paletteGroups.map((group, idx) => (
                <div key={idx}>
                  <span className="text-[10px] font-semibold text-gray-400 block mb-1">
                    {group.label}
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {group.colors.map((colorClass) => {
                      // Tạo lớp hiển thị ô màu trong modal
                      const displayBg = isText
                        ? colorClass.replace("text-", "bg-")
                        : colorClass;
                      const isSelected = value === colorClass;

                      return (
                        <button
                          key={colorClass}
                          type="button"
                          onClick={() => handleSelect(colorClass)}
                          className={`w-8 h-8 rounded border transition-transform hover:scale-110 relative ${colorClass} ${
                            isSelected
                              ? "ring-2 ring-blue-500 ring-offset-1 z-10"
                              : ""
                          }`}
                          title={colorClass}
                        >
                          {isText ? "a" : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
