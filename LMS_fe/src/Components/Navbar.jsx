import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { io } from "socket.io-client";
const Backend = import.meta.env.VITE_API_BASE_URL;
const SocketURL = import.meta.env.VITE_SOCKET_URL;
import useAlert from "./Alert/useAlert";

const Navbar = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notiRef = useRef(null);
  const profileRef = useRef(null);

  const userRole = localStorage.getItem("userRole");
  const userData = JSON.parse(localStorage.getItem("userData")) || null;

  const { confirm } = useAlert();

  useEffect(() => {
    if (!userData?.id) return;

    // 1. Kết nối tới server Socket.io
    const socket = io(SocketURL);

    // 2. Tham gia vào phòng riêng dựa theo ID người dùng để nhận tin nhắn cá nhân
    socket.emit("join_user_room", userData.id);

    // 3. Lắng nghe sự kiện từ Server khi hệ thống phát hiện bài học mới
    socket.on("new_lesson_notification", (data) => {
      const newNoti = {
        id: Date.now(), // ID tạm thời cho client
        title: data.title,
        message: data.message,
        link: data.link,
        is_read: false,
        created_at: new Date(),
      };
      // Đẩy thông báo mới nhất lên trên đầu danh sách
      setNotifications((prev) => [newNoti, ...prev]);
    });

    return () => socket.disconnect();
  }, [userData]);

  // Đếm số thông báo chưa đọc trong phiên làm việc
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotiClick = (noti) => {
    setIsNotiOpen(false);
    // Đánh dấu đã đọc trên giao diện tạm thời
    setNotifications(
      notifications.map((n) =>
        n.id === noti.id ? { ...n, is_read: true } : n,
      ),
    );
    if (noti.link) navigate(noti.link);
  };

  // Đóng các dropdown menu nếu người dùng click ra ngoài vùng kiểm soát
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notiRef.current && !notiRef.current.contains(event.target))
        setIsNotiOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target))
        setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    confirm("Đăng xuất", "Bạn muốn đăng xuất khỏi hệ thống?", () => {
      localStorage.clear();
      navigate("/login");
    });
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 h-16 px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-6">
        {/* <Link to="/dashboard" className="flex items-center gap-2"> */}
        <span className="text-2xl font-black text-blue-600 tracking-tight">
          Mini-LMS
        </span>
        {/* </Link> */}

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 ml-4">
          <Link to="/dashboard" className="hover:text-blue-600 transition">
            Khóa học của tôi
          </Link>
          <Link to="/browse-courses" className="hover:text-blue-600 transition">
            Khám phá khóa học
          </Link>
          {userRole === "teacher" && (
            <Link
              to="/teacher/questions"
              className="hover:text-blue-600 transition"
            >
              Tạo câu hỏi
            </Link>
          )}
        </div>
      </div>

      {/* KHU VỰC BÊN PHẢI: CHUÔNG THÔNG BÁO & USER DROPDOWN */}
      <div className="flex items-center gap-4">
        {/* CHUÔNG THÔNG BÁO THỜI GIAN THỰC (Chỉ hiển thị cho học sinh để nhận tin bài mới) */}
        {userRole !== "teacher" && (
          <div className="relative" ref={notiRef}>
            <button
              onClick={() => setIsNotiOpen(!isNotiOpen)}
              className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-full transition focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                />
              </svg>

              {/* Chấm đỏ thông báo chưa đọc */}
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border border-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Menu Dropdown chứa danh sách bài học mới nhận */}
            {isNotiOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <span className="font-bold text-sm text-slate-800">
                    Thông báo realtime
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-xs text-blue-600 font-semibold">
                      {unreadCount} mới
                    </span>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Không có thông báo mới nào được phát trong phiên học này.
                    </div>
                  ) : (
                    notifications.map((noti) => (
                      <div
                        key={noti.id}
                        onClick={() => handleNotiClick(noti)}
                        className={`p-3.5 text-left cursor-pointer transition flex items-start gap-2.5 ${
                          noti.is_read
                            ? "bg-white hover:bg-slate-50"
                            : "bg-blue-50/40 hover:bg-blue-50"
                        }`}
                      >
                        {!noti.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs truncate ${noti.is_read ? "font-medium text-slate-600" : "font-bold text-slate-900"}`}
                          >
                            {noti.title}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                            {noti.message}
                          </p>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            Vừa xong
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MENU THẢ XUỐNG CỦA HỒ SƠ CÁ NHÂN */}
        <div className="relative" ref={profileRef}>
          {userData == null ? (
            <Link
              to="/login"
              className="flex items-center gap-2 focus:outline-none"
            >
              Đăng nhập
            </Link>
          ) : (
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 focus:outline-none"
            >
              <span className="w-9 h-9 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center uppercase shadow-sm border border-slate-100 hover:opacity-90 transition">
                {userData.name.charAt(0)}
              </span>
            </button>
          )}

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 py-1 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Tài khoản
                </p>
                <p className="text-sm font-bold text-slate-800 truncate mt-0.5">
                  {userData == null ? "" : userData.name}
                </p>
              </div>
              <Link className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">
                <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {userRole === null
                    ? "Đăng nhập"
                    : userRole === "teacher"
                      ? "Giáo Viên"
                      : "Học Viên"}
                </span>
              </Link>
              <Link
                to="/profile"
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                Hồ sơ cá nhân
              </Link>
              <Link
                to="/change-pwd"
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                Đổi mật khẩu
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition font-medium border-t border-slate-100"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
