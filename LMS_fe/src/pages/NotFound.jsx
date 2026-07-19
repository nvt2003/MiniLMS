import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="text-center">
        <h1 className="text-8xl font-extrabold text-blue-600">404</h1>

        <h2 className="mt-4 text-3xl font-bold text-slate-800">
          Trang không tồn tại
        </h2>

        <p className="mt-2 text-slate-500">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
        </p>
        <div className="flex flex-col">
          <Link
            to="/browse-courses"
            className="mt-8 px-6 py-3 text-blue-700 font-bold transition hover:text-blue-500"
          >
            Khám phá khóa học
          </Link>
          <Link
            to="/"
            className="mt-8 inline-block rounded-lg bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700"
          >
            ← Quay về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
