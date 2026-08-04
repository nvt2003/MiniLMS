import React, { useEffect, useState } from "react";
import {
  searchSettings,
  createSetting,
  updateSettingValueApi,
  getPageLayout,
} from "../../services/settingApi";
import useAlert from "../../Components/Alert/useAlert";
import Navbar from "../../Components/Navbar";
import { Link } from "react-router-dom";
import { ArrowUp, ArrowDown } from "lucide-react";

export default function NavbarSettingManager() {
  const [availablePages, setAvailablePages] = useState([]);
  const [navConfig, setNavConfig] = useState([]);
  const { showAlert, prompt } = useAlert();
  const [activeDropdown, setActiveDropdown] = useState(null);

  const loadNavbar = async () => {
    const navbar = await getPageLayout("navbar");
    setNavConfig(navbar);
  };

  useEffect(() => {
    loadNavbar();
  }, []);
  // Load danh sách tất cả custom page từ API
  useEffect(() => {
    const loadPages = async () => {
      const pages = await searchSettings(
        "custom_page",
        "",
        "page_layout_config",
      );
      setAvailablePages(pages);
    };
    loadPages();
  }, []);

  // Thêm link đơn vào Navbar
  const addSingleLink = (page) => {
    const newItem = {
      id: Date.now().toString(),
      type: "link",
      label: page.setting_group,
      slug: page.setting_group,
    };
    setNavConfig([...navConfig, newItem]);
  };

  // Thêm Dropdown nhóm vào Navbar
  const addDropdownGroup = async () => {
    const title = await prompt("", "Nhập tên Menu Dropdown:");
    console.log(title);
    if (!title) return;

    const newItem = {
      id: Date.now().toString(),
      type: "dropdown",
      label: title,
      children: [],
    };
    setNavConfig([...navConfig, newItem]);
  };

  // Thêm sub-page vào trong một Dropdown
  const addPageToDropdown = (dropdownId, page) => {
    setNavConfig(
      navConfig.map((item) => {
        if (item.id === dropdownId) {
          return {
            ...item,
            children: [
              ...item.children,
              {
                id: Date.now().toString(),
                label: page.setting_group,
                slug: page.setting_group,
              },
            ],
          };
        }
        return item;
      }),
    );
  };

  // Xóa item
  const removeItem = (id) => {
    setNavConfig(navConfig.filter((item) => item.id !== id));
  };

  // Lưu cấu hình xuống Backend
  const handleSave = async () => {
    const payload = {
      parent_group: "navbar_layout_config",
      setting_group: "navbar",
      setting_key: "page_layout_config",
      setting_value: JSON.stringify(navConfig),
    };
    try {
      await createSetting(payload);
      showAlert("success", "", "Đã lưu cấu hình Navbar thành công!");
    } catch (error) {
      // 2. Kiểm tra nếu gặp lỗi Conflict (HTTP 409) hoặc lỗi trùng lặp dữ liệu từ Backend
      const isConflict =
        error.response?.status === 409 ||
        error.response?.data?.message?.toLowerCase().includes("exist") ||
        error.response?.data?.message?.toLowerCase().includes("duplicate");

      if (isConflict) {
        try {
          // Chuyển sang gọi API Update
          await updateSettingValueApi(payload);
          showAlert(
            "success",
            "",
            "Cấu hình đã tồn tại, đã cập nhật Navbar thành công!",
          );
        } catch (updateError) {
          console.error("Lỗi khi cập nhật setting:", updateError);
          showAlert("error", "", "Lỗi khi cập nhật cấu hình Navbar!");
        }
      } else {
        // Các lỗi khác (500, 401, Mất kết nối...)
        console.error("Lỗi khi tạo setting:", error);
        showAlert(
          "error",
          "",
          error.response?.data?.message || "Lỗi khi lưu cấu hình!",
        );
      }
    }
  };
  // Di chuyển phần tử trong mảng chính (Parent)
  const moveItem = (index, direction) => {
    const newConfig = [...navConfig];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newConfig.length) return;

    // Swap vị trí
    [newConfig[index], newConfig[targetIndex]] = [
      newConfig[targetIndex],
      newConfig[index],
    ];
    setNavConfig(newConfig);
  };

  // Di chuyển phần tử con trong Dropdown (Child)
  const moveSubItem = (parentId, subIndex, direction) => {
    setNavConfig(
      navConfig.map((item) => {
        if (item.id === parentId) {
          const newChildren = [...item.children];
          const targetIndex = direction === "up" ? subIndex - 1 : subIndex + 1;

          if (targetIndex < 0 || targetIndex >= newChildren.length) return item;

          // Swap vị trí con
          [newChildren[subIndex], newChildren[targetIndex]] = [
            newChildren[targetIndex],
            newChildren[subIndex],
          ];
          return { ...item, children: newChildren };
        }
        return item;
      }),
    );
  };
  return (
    <>
      <Navbar />
      <div className="p-6 bg-white rounded-lg shadow max-w-4xl mx-auto">
        <h2 className="text-xl font-bold mb-4">
          Cấu hình các trang tự tạo vào Navbar
        </h2>

        {/* Hành động chính */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={addDropdownGroup}
            className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700"
          >
            + Thêm Danh mục (Dropdown)
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
          >
            Lưu thay đổi
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Danh sách trang có sẵn */}
          <div>
            <h3 className="font-semibold mb-2">Trang Custom khả dụng:</h3>
            <div className="space-y-2">
              {availablePages.map((page) => (
                <div
                  key={`${page.setting_group}-${page.setting_key}`}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span>/{page.setting_group}</span>
                  <button
                    onClick={() => addSingleLink(page)}
                    className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded"
                  >
                    + Thêm dạng Link
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Xem trước Cấu trúc Navbar */}
          <div>
            <h3 className="font-semibold mb-2">Cấu trúc Navbar hiện tại:</h3>
            <div className="space-y-3 border p-4 rounded bg-slate-50 min-h-[200px]">
              {navConfig.map((item, index) => (
                <div
                  key={item.id}
                  className="p-2 border bg-white rounded shadow-sm"
                >
                  <div className="flex justify-between items-center font-medium">
                    <span>
                      [{item.type.toUpperCase()}] {item.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveItem(index, "up")}
                        disabled={index === 0}
                        className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-500"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(index, "down")}
                        disabled={index === navConfig.length - 1}
                        className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-500"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 text-xs"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>

                  {/* Nếu là dropdown, hiển thị danh sách con và nút thêm con */}
                  {item.type === "dropdown" && (
                    <div className="ml-4 mt-2 border-l-2 pl-2 space-y-1">
                      {item.children?.map((child) => (
                        <div
                          key={child.id}
                          className="text-xs flex justify-between bg-slate-100 p-1 rounded"
                        >
                          <span>
                            {child.label} (/{child.slug})
                          </span>
                        </div>
                      ))}
                      <div className="mt-1 text-xs text-slate-500">
                        Thêm vào nhóm này:
                        {availablePages.map((page) => (
                          <button
                            key={`${page.setting_group}-${page.setting_key}`}
                            onClick={() => addPageToDropdown(item.id, page)}
                            className="ml-2 text-blue-500 underline"
                          >
                            +{page.setting_group}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div className="flex justify-between items-center font-medium border">
                <span>--- Các mục mặc định trên navbar ---</span>
              </div>
            </div>
          </div>
        </div>
        <div className="">
          <h3 className="font-semibold">Xem trước:</h3>
          <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 h-16 px-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 ml-4">
                <Link>[Logo]</Link>
                {/* --- DYNAMIC CUSTOM NAVBAR ITEMS --- */}
                {navConfig.map((item, subIndex) => {
                  if (item.type === "link") {
                    return (
                      <Link
                        key={item.id}
                        to={`/${item.slug}`}
                        className="hover:text-blue-600 transition"
                      >
                        {item.label}
                      </Link>
                    );
                  }

                  if (item.type === "dropdown") {
                    return (
                      <div
                        key={item.id}
                        className="relative group"
                        onMouseEnter={() => setActiveDropdown(item.id)}
                        onMouseLeave={() => setActiveDropdown(null)}
                      >
                        <button className="flex items-center gap-1 hover:text-blue-600 transition py-2">
                          <span>{item.label}</span>
                          <svg
                            className="w-4 h-4 fill-current"
                            viewBox="0 0 20 20"
                          >
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {activeDropdown === item.id && (
                          <div className="absolute left-0 top-full w-48 bg-white shadow-lg rounded-md border border-slate-100 py-2 z-50">
                            {item.children?.map((child) => (
                              <>
                                <Link
                                  key={child.id}
                                  to={`/${child.slug}`}
                                  className="block px-4 py-2 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition"
                                >
                                  {child.label}
                                </Link>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      moveSubItem(item.id, subIndex, "up")
                                    }
                                    disabled={subIndex === 0}
                                    className="p-0.5 text-slate-500 hover:text-blue-600 disabled:opacity-30"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      moveSubItem(item.id, subIndex, "down")
                                    }
                                    disabled={
                                      subIndex === item.children.length - 1
                                    }
                                    className="p-0.5 text-slate-500 hover:text-blue-600 disabled:opacity-30"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                              </>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}
                <Link>[Các mục mặc định..]</Link>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
