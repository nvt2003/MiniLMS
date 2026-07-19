import { useState } from "react";
import api from "../../services/api";
import useAlert from "../../Components/Alert/useAlert";
import Navbar from "../../Components/Navbar";

const ChangePassword = () => {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const { success, error } = useAlert();
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      error("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.put("/auth/change-pwd", {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });

      success(res.data.message);

      setForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      error(err.response?.data?.message || "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="max-w-lg mx-auto bg-white rounded-xl shadow p-8 mt-10">
        <h1 className="text-2xl font-bold mb-8">Đổi mật khẩu</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2">Mật khẩu cũ</label>

            <input
              type="password"
              name="oldPassword"
              value={form.oldPassword}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block mb-2">Mật khẩu mới</label>

            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block mb-2">Xác nhận mật khẩu</label>

            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 outline-none focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition disabled:opacity-60"
          >
            {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
