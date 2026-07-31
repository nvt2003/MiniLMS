import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import api from "../../services/api";

export default function ActivateAccount() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [verifyError, setVerifyError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // 1. Verify token khi load trang
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await api.get(`/auth/verify-activation-token/${token}`);
        setUserInfo(res.data.data);
      } catch (err) {
        setVerifyError(
          err.response?.data?.message ||
            "Mã kích hoạt không hợp lệ hoặc đã hết hạn.",
        );
        setVerifying(false);
      }
    };

    if (token) verifyToken();
  }, [token]);

  // 2. Kích hoạt & đặt mật khẩu
  const handleActivate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setSubmitError("Mật khẩu xác nhận không khớp!");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      /*
      await axios.post('/api/admin/activate-account', { token, newPassword });
      */
      setTimeout(() => {
        setIsSuccess(true);
        setSubmitting(false);
      }, 1000);
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || "Kích hoạt thất bại. Vui lòng thử lại!",
      );
      setSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm text-gray-600">Đang kiểm tra mã kích hoạt...</p>
        </div>
      </div>
    );
  }

  if (verifyError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">
            Liên kết không hợp lệ
          </h2>
          <p className="text-sm text-gray-600">{verifyError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 max-w-md w-full p-8 space-y-6">
        {isSuccess ? (
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">
              Kích hoạt thành công!
            </h2>
            <p className="text-sm text-gray-600">
              Tài khoản Quản trị viên của bạn đã sẵn sàng. Bạn có thể đăng nhập
              ngay bây giờ.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
            >
              Đăng nhập ngay
            </button>
          </div>
        ) : (
          <>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Thiết lập tài khoản Admin
              </h2>
              <p className="text-xs text-gray-500">
                Xin chào{" "}
                <strong className="text-gray-700">{userInfo?.name}</strong> (
                {userInfo?.email})
              </p>
            </div>

            <form onSubmit={handleActivate} className="space-y-4">
              {submitError && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                {submitting ? "Đang kích hoạt..." : "Kích hoạt tài khoản"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
