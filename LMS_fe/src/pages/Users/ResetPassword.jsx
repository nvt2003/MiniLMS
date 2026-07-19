import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../../services/api";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      alert("Liên kết đặt lại mật khẩu không hợp lệ.");
      return;
    }

    if (form.newPassword.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      alert("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.put("/auth/reset-pwd", {
        token,
        newPassword: form.newPassword,
      });

      setSuccess(res.data.message || "Đặt lại mật khẩu thành công.");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      alert(
        err.response?.data?.message || "Liên kết không hợp lệ hoặc đã hết hạn.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-3">
            Liên kết không hợp lệ
          </h2>

          <p className="text-gray-500 mb-6">
            Không tìm thấy mã đặt lại mật khẩu.
          </p>

          <Link to="/forgot-password" className="text-blue-600 hover:underline">
            Quay lại Quên mật khẩu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2">
          Đặt lại mật khẩu
        </h1>

        <p className="text-gray-500 text-center mb-6">
          Nhập mật khẩu mới cho tài khoản của bạn.
        </p>

        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 text-green-700 px-4 py-3">
            {success}
            <div className="text-sm mt-1">
              Đang chuyển đến trang đăng nhập...
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2 font-medium">Mật khẩu mới</label>

            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập mật khẩu mới"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Xác nhận mật khẩu</label>

            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập lại mật khẩu"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-lg transition"
          >
            {loading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
