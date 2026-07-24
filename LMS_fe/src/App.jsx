import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Users/Login";
import Register from "./pages/Users/Register";
import CreateCourse from "./pages/Teachers/CreateCourse";
import Dashboard from "./pages/Dashboard";
import EditCourse from "./pages/Teachers/EditCourse";
import BrowseCourses from "./pages/BrowseCourses";
import CourseLanding from "./pages/Students/CourseLanding";
import LearningSpace from "./pages/Students/LearningSpace";
import CourseDetailManager from "./pages/Teachers/CourseDetailManager";
import CreateLesson from "./pages/Teachers/CreateLesson";
import EditLesson from "./pages/Teachers/EditLesson";
import Profile from "./pages/Users/Profile";
import ChangePassword from "./pages/Users/ChangePassword";
import ForgotPassword from "./pages/Users/ForgotPassword";
import ResetPassword from "./pages/Users/ResetPassword";
import NotFound from "./pages/NotFound";
import ViewCourse from "./pages/Courses/CourseView";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<NotFound />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/teacher/create-course" element={<CreateCourse />} />
        <Route path="/teacher/edit-course/:id" element={<EditCourse />} />

        <Route path="/browse-courses" element={<BrowseCourses />} />
        <Route path="/teacher/course/:id" element={<CourseDetailManager />} />
        <Route
          path="/teacher/course/:courseId/add-lesson"
          element={<CreateLesson />}
        />
        <Route path="/teacher/edit-lesson/:id" element={<EditLesson />} />

        <Route path="/course/:id" element={<CourseLanding />} />
        <Route
          path="/learning/:courseId/lesson/:lessonId"
          element={<LearningSpace />}
        />
        <Route path="/profile" element={<Profile />} />
        <Route path="/change-pwd" element={<ChangePassword />} />
        <Route path="/forgot-pwd" element={<ForgotPassword />} />
        <Route path="/reset-pwd" element={<ResetPassword />} />

        <Route path="/view-course/:id" element={<ViewCourse />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
