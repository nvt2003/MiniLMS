import { useEffect, useState } from "react";
import api from "../../services/api";
import Navbar from "../../Components/Navbar";

const Profile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/profile");
        setUser(res.data.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchProfile();
  }, []);

  if (!user) {
    return <div className="p-10 text-center">Đang tải...</div>;
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8 mt-10">
        <h1 className="text-2xl font-bold mb-8">Thông tin cá nhân</h1>

        <div className="space-y-6">
          <div>
            <label className="text-gray-500 text-sm">Họ và tên</label>
            <div className="mt-1 border rounded-lg px-4 py-3">{user.name}</div>
          </div>

          <div>
            <label className="text-gray-500 text-sm">Email</label>
            <div className="mt-1 border rounded-lg px-4 py-3">{user.email}</div>
          </div>

          <div>
            <label className="text-gray-500 text-sm">Vai trò</label>
            <div className="mt-1 border rounded-lg px-4 py-3 capitalize">
              {user.role === "student"
                ? "Học sinh"
                : user.role === "teacher"
                  ? "Giáo viên"
                  : "Khác"}
            </div>
          </div>

          <div>
            <label className="text-gray-500 text-sm">Ngày tạo tài khoản</label>
            <div className="mt-1 border rounded-lg px-4 py-3">
              {new Date(user.created_at).toLocaleDateString("vi-VN")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
