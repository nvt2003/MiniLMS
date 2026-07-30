// import React, { useEffect, useState } from "react";
// import Navbar from "../Components/Navbar";
// import api from "../services/api";

// const HomePage = () => {
//   const [settings, setSettings] = useState({});
//   //   const [categories, setCategories] = useState([]);
//   //   const [courses, setCourses] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // Gọi API lấy dữ liệu thực tế từ Database
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);

//         const res = await api.get("settings/group/general");

//         setSettings(res?.data);
//       } catch (error) {
//         console.error("Lỗi khi tải dữ liệu trang chủ:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   // Định dạng tiền tệ VNĐ
//   const formatCurrency = (amount) => {
//     if (!amount) return "Miễn phí";
//     return new Intl.NumberFormat("vi-VN", {
//       style: "currency",
//       currency: "VND",
//     }).format(amount);
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <Navbar />
//         <p className="text-gray-500 font-medium">
//           Đang tải dữ liệu trang chủ...
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
//       {/* 1. Component Navbar sẵn có */}
//       <Navbar />

//       {/* 2. Hero Section (Lấy banner & tên web từ system_settings) */}
//       <section className="relative bg-blue-900 text-white py-20 px-4 sm:px-6 lg:px-8">
//         <div className="absolute inset-0 overflow-hidden opacity-30">
//           <img
//             src={
//               settings.hero_banner ||
//               "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200"
//             }
//             alt="Banner"
//             className="w-full h-full object-cover"
//           />
//         </div>

//         <div className="relative max-w-7xl mx-auto text-center space-y-6">
//           <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
//             Chao mừng đến với {settings.site_name || "Simple LMS"}
//           </h1>
//           <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto">
//             Hàng trăm khóa học chất lượng cao từ các chuyên gia hàng đầu. Học
//             mọi lúc, mọi nơi.
//           </p>
//           <div className="pt-4 flex justify-center gap-4">
//             <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-all">
//               Khám Phá Khóa Học
//             </button>
//           </div>
//         </div>
//       </section>

//       {/* 5. Footer (Lấy thông tin từ system_settings) */}
//       <footer className="bg-gray-900 text-gray-300 py-10 mt-auto">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
//           <h3 className="text-white text-xl font-bold">
//             {settings.site_name || "Simple LMS"}
//           </h3>
//           <p className="text-xs text-gray-500">
//             {settings.footer_copyright ||
//               "© 2026 Simple LMS. All rights reserved."}
//           </p>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default HomePage;
// pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import { Editor, Frame } from "@craftjs/core";
import { Container } from "../components/Crafts/Container";
import { Text } from "../components/Crafts/Text";
import { Image } from "../components/user/Image";
import { getPageLayout } from "../services/settingApi";

export default function HomePage() {
  const [jsonConfig, setJsonConfig] = useState(null);

  useEffect(() => {
    getPageLayout("homepage").then((layoutData) => {
      if (layoutData) {
        // layoutData đã được JSON.parse, sẵn sàng nạp vào Craft.js Frame
        setJsonConfig(layoutData);
      }
    });
  }, []);

  if (!jsonConfig) return <div>Loading...</div>;

  return (
    // enabled={false} giúp vô hiệu hóa toàn bộ tính năng kéo thả & chỉnh sửa
    <Editor resolver={{ Container, Text, Image }} enabled={false}>
      <Frame data={jsonConfig} />
    </Editor>
  );
}
