import React, { useState } from "react";
import { useEditor } from "@craftjs/core";
import { Settings, X } from "lucide-react";

export const SettingsPanel = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { selected } = useEditor((state) => {
    const [currentNodeId] = state.events.selected;
    let selected;

    if (currentNodeId) {
      selected = {
        id: currentNodeId,
        name: state.nodes[currentNodeId].data.name,
        settings:
          state.nodes[currentNodeId].related &&
          state.nodes[currentNodeId].related.settings,
      };
    }

    return { selected };
  });

  return (
    <div className="fixed right-0 top-20 z-50 flex items-start">
      {/* NÚT BẤM MỞ PANEL (Khi Panel đang đóng) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-white border border-r-0 p-2.5 rounded-l-lg shadow-md hover:bg-gray-50 text-gray-700 transition-all"
          title="Mở bảng cài đặt"
        >
          <Settings className="w-5 h-5 animate-spin-slow" />
        </button>
      )}

      {/* BẢNG BÊN PHẢI (SETTINGS PANEL) */}
      {isOpen && (
        <div className="w-72 bg-white border-l shadow-2xl h-[calc(100vh-80px)] flex flex-col transition-all">
          {/* Header Panel chứa nút Đóng X */}
          <div className="p-3 border-b flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-2 font-semibold text-sm text-gray-700">
              <Settings className="w-4 h-4 text-blue-600" />
              <span>
                {selected ? `Chỉnh sửa: ${selected.name}` : "Thành phần"}
              </span>
            </div>

            {/* Nút Đóng X */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-all"
              title="Đóng panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nội dung cài đặt */}
          <div className="flex-1 overflow-y-auto p-4">
            {selected && selected.settings ? (
              React.createElement(selected.settings)
            ) : (
              <div className="text-center text-xs text-gray-400 mt-10">
                Click vào một phần tử trên màn hình để tùy chỉnh thuộc tính.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
