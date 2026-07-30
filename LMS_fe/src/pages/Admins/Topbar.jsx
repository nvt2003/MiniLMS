import React from "react";
import { useEditor } from "@craftjs/core";
import { SearchablePageSelect } from "./SearchablePageSelect";
import { savePageLayout } from "../../services/settingApi";

export const Topbar = ({ activeSlug, setActiveSlug }) => {
  const { query } = useEditor();

  const handleSave = async () => {
    try {
      const jsonContent = query.serialize();
      await savePageLayout(jsonContent, activeSlug);

      alert(`Đã lưu trang "${activeSlug}" thành công!`);
    } catch (error) {
      console.error("Lỗi khi lưu:", error);
    }
  };

  return (
    <div className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-3">
        <span className="font-bold text-gray-700 text-xs">Đang chỉnh sửa:</span>

        <SearchablePageSelect
          activeSlug={activeSlug}
          onSelectPage={(slug) => setActiveSlug(slug)}
        />
      </div>

      <button
        onClick={handleSave}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
      >
        Lưu cấu hình
      </button>
    </div>
  );
};
