import React, { useState, useEffect, useRef } from "react";
import { searchSettings, createSetting } from "../../services/settingApi";
import useDebounce from "../../hooks/useDebounce";

export const SearchablePageSelect = ({ activeSlug, onSelectPage }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const debouncedSearch = useDebounce(searchTerm);

  // 1. Gọi API tìm kiếm tên các Group/Page
  const fetchGroups = async (parent = "custom_page", group, key) => {
    setLoading(true);
    try {
      const res = await searchSettings(parent, group, key);

      setOptions(res || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách trang /group:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups("custom_page", searchTerm, "page_layout_config");
  }, [debouncedSearch]);
  const groupExists = options.some(
    (item) =>
      item.setting_group.toLowerCase() === searchTerm.trim().toLowerCase(),
  );
  const handleCreateGroup = async () => {
    if (!searchTerm.trim()) return;

    const newGroup = searchTerm.trim();

    try {
      await createSetting({
        parent_group: "custom_page",
        setting_key: "page_layout_config",
        setting_group: newGroup,
        setting_value: "{}",
        description: "",
      });

      await fetchGroups("");

      onSelectPage(newGroup);
      setSearchTerm("");
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    }
  };
  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // Tên hiển thị của slug hiện tại
  const selectedLabel =
    options.find((opt) => opt.setting_group === activeSlug)?.setting_group ||
    activeSlug;

  return (
    <div className="relative w-72" ref={dropdownRef}>
      {/* Ô nhập thông tin / Hiển thị lựa chọn */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-2 border rounded-md bg-gray-50 text-xs font-semibold text-gray-800 shadow-sm hover:bg-gray-100"
      >
        <span className="truncate">
          {selectedLabel || "Chọn trang/group..."}
        </span>
        <span className="text-gray-400 text-[10px] ml-1">▼</span>
      </button>

      {/* Menu thả xuống chứa thanh tìm kiếm */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50 p-2 flex flex-col gap-2 max-h-64 animate-in fade-in zoom-in-95 duration-100">
          {/* Ô Input tìm kiếm */}
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm tên trang, group..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Danh sách kết quả */}
          <div className="overflow-y-auto flex-1 flex flex-col gap-1 pr-1">
            {loading ? (
              <div className="text-center py-3 text-xs text-gray-400">
                Đang tìm kiếm...
              </div>
            ) : options.length > 0 ? (
              options.map((item) => (
                <button
                  key={item.setting_group}
                  type="button"
                  onClick={() => {
                    onSelectPage(item.setting_group);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded text-xs transition-colors flex justify-between items-center ${
                    activeSlug === item.setting_group
                      ? "bg-blue-50 text-blue-600 font-bold"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span>{item.name}</span>
                  <span className="text-[10px] font-mono text-gray-400">
                    {item.setting_group}
                  </span>
                </button>
              ))
            ) : (
              <div className="text-center py-3 text-xs text-gray-400">
                Không tìm thấy trang nào
                {searchTerm.trim() && !groupExists && (
                  <button
                    type="button"
                    onClick={handleCreateGroup}
                    className="w-full p-2 mt-1 rounded bg-green-500 text-white text-xs hover:bg-green-600"
                  >
                    Tạo trang "{searchTerm}"
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
