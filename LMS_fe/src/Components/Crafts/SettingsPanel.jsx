import React, { useState } from "react";
import { useEditor } from "@craftjs/core";
import { Settings, X } from "lucide-react";

export const SettingsPanel = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { selectedNode } = useEditor((state) => {
    const [currentNodeId] = state.events.selected;
    let selectedNode;

    if (currentNodeId && state.nodes[currentNodeId]) {
      const node = state.nodes[currentNodeId];
      selectedNode = {
        id: currentNodeId,
        name: node.data.name || node.data.displayName,
        settings: node.related && node.related.settings,
        isDeletable: node.data.isDeletable,
      };
    }

    return { selectedNode };
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
                <span>
                  {selectedNode ? `Sửa: ${selectedNode.name}` : "Thành phần"}
                </span>
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
            {selectedNode && selectedNode.settings ? (
              React.createElement(selectedNode.settings)
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
