import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Lock,
  Unlock,
  Mail,
  UserCheck,
  Shield,
  MoreVertical,
  Edit2,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";
import useDebounce from "../../hooks/useDebounce";

const ROLE_MAP = {
  admin: {
    label: "Super Admin",
    bg: "bg-purple-100 text-purple-800 border-purple-200",
  },
  admin_teacher: {
    label: "Quản lý giảng dạy",
    bg: "bg-blue-100 text-blue-800 border-blue-200",
  },
  admin_student: {
    label: "Quản lý học viên",
    bg: "bg-green-100 text-green-800 border-green-200",
  },
  admin_pages: {
    label: "Quản lý nội dung",
    bg: "bg-amber-100 text-amber-800 border-amber-200",
  },
  admin_finance: {
    label: "Quản lý tài chính",
    bg: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
};

const STATUS_MAP = {
  ACTIVE: {
    label: "Hoạt động",
    bg: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  PENDING: {
    label: "Chờ kích hoạt",
    bg: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  BLOCKED: {
    label: "Đã khóa",
    bg: "bg-rose-50 text-rose-700 ring-rose-600/20",
  },
};

export default function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin_teacher",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const debouncedSearch = useDebounce(searchTerm);
  const debouncedRole = useDebounce(roleFilter);
  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await api.get("auth/list", {
        params: {
          search: searchTerm,
          role: roleFilter,
          status: statusFilter,
          page: 1,
          limit: 10,
        },
      });
      console.log("response", res.data.data);
      setAdmins(res.data.data);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    setLoading(false);
  }, [debouncedSearch, debouncedRole, statusFilter]);

  // Xử lý Thêm / Cập nhật Admin
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await api.post("/auth/register/admin", formData);
      setMessage({ type: "success", text: res.data.message });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!",
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-600" />
            Quản lý Quản trị viên (Admin)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý phân quyền, thêm mới Sub-Admin và theo dõi trạng thái kích
            hoạt tài khoản.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm Quản trị viên
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Tìm kiếm */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Lọc Role */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Tìm theo vị trí"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full pl-2 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {/* Lọc Trạng thái */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="PENDING">Chờ kích hoạt</option>
          <option value="BLOCKED">Đã khóa</option>
        </select>

        <button
          onClick={fetchList}
          className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center justify-center"
          title="Tải lại"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Admin Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                <th className="py-3.5 px-4">Quản trị viên</th>
                <th className="py-3.5 px-4">Vai trò (Role)</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Người tạo</th>
                <th className="py-3.5 px-4">Ngày tạo</th>
                <th className="py-3.5 px-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    Không tìm thấy quản trị viên phù hợp.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => {
                  const roleConfig = ROLE_MAP[admin.role] || {
                    label: admin.role,
                    bg: "bg-gray-100",
                  };
                  const statusConfig = STATUS_MAP[admin.status] || {
                    label: admin.status,
                    bg: "bg-gray-100",
                  };

                  return (
                    <tr
                      key={admin.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-900">
                          {admin.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {admin.email}
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleConfig.bg}`}
                        >
                          {roleConfig.label}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ring-1 ring-inset ${statusConfig.bg}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${admin.status === "ACTIVE" ? "bg-emerald-500" : admin.status === "PENDING" ? "bg-amber-500" : "bg-rose-500"}`}
                          />
                          {statusConfig.label}
                        </span>
                      </td>

                      {/* Created By */}
                      <td className="py-3.5 px-4 text-gray-600 text-xs">
                        {admin.created_by_name || "System"}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-gray-500 text-xs">
                        {admin.created_at}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {admin.status === "PENDING" && (
                            <button
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md"
                              title="Gửi lại email kích hoạt"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                          )}

                          {admin.role !== "admin" &&
                            (admin.status === "BLOCKED" ? (
                              <button
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md"
                                title="Mở khóa tài khoản"
                              >
                                <Unlock className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md"
                                title="Khóa tài khoản"
                              >
                                <Lock className="w-4 h-4" />
                              </button>
                            ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm / Cập nhật Admin */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-semibold text-gray-900">
                Thêm / Cập nhật Quản trị viên
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {message.text && (
                <div
                  className={`p-3 rounded-lg text-sm flex items-start gap-2 ${message.type === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{message.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email đăng nhập <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@school.edu.vn"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  * Nếu Email này đã tồn tại trên hệ thống, tài khoản sẽ được
                  nâng cấp/chuyển Role tương ứng.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Mật khẩu khởi tạo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Ít nhất 6 ký tự"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Phân quyền Admin (Role){" "}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="admin_teacher">
                    Admin Giảng dạy & Lớp học (admin_teacher)
                  </option>
                  <option value="admin_student">
                    Admin Học viên & Điểm số (admin_student)
                  </option>
                  <option value="admin_pages">
                    Admin Nội dung & Trang (admin_pages)
                  </option>
                  <option value="admin_finance">
                    Admin Tài chính (admin_finance)
                  </option>
                  <option value="admin">Super Admin (Toàn quyền)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {submitting ? "Đang xử lý..." : "Xác nhận tạo / Cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
