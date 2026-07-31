const nodemailer = require('nodemailer');
const FRONT_END = process.env.FRONT_END;

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS.replace(/\s+/g, ""),
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

const sendNewLessonEmail = async (email, courseTitle, lessonTitle, courseId) => {
  const mailOptions = {
    from: `"Hệ thống LMS" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🔔 BÀI HỌC MỚI: Khóa học ${courseTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #2563eb;">Có bài học mới xuất hiện!</h2>
        <p>Chào bạn,</p>
        <p>Giáo viên vừa tải lên bài học mới mang tên: <strong>"${lessonTitle}"</strong> trong khóa học <strong>"${courseTitle}"</strong> mà bạn đã đăng ký.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${FRONT_END}/course/${courseId}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px;">Vào Học Ngay</a>
        </div>
        <p style="color: #64748b; font-size: 12px;">Nếu bạn không đăng ký khóa học này, vui lòng bỏ qua email.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`Lỗi gửi email đến ${email}:`, error);
  }
};

const sendForgotPwdEmail = async (email, token) => {
  try {
    await transporter.verify();

    const mailOptions = {
      from: `"Hệ thống LMS" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Thay đổi mật khẩu",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0;">
          <h2 style="color: #2563eb;">Thay đổi mật khẩu</h2>
          <p>Chào bạn,</p>
          <p>Vào trang bằng link sau để đổi mật khẩu</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${FRONT_END}/reset-pwd/${token}">
              Vào Học Ngay
            </a>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);

  } catch (error) {
    console.error("Email error:", error);
  }
};
const sendAdminInviteEmail = async (email, name, token, role) => {
  try {
    await transporter.verify();

    const roleNames = {
      admin: 'Super Admin',
      admin_teacher: 'Quản trị viên Giảng dạy & Lớp học',
      admin_student: 'Quản trị viên Học viên',
      admin_pages: 'Quản trị viên Nội dung & Trang',
      admin_finance: 'Quản trị viên Tài chính'
    };

    const displayRole = roleNames[role] || 'Quản trị viên Hệ thống';
    const activationUrl = `${process.env.FRONTEND_URL || FRONT_END}/activate-account/${token}`;

    const mailOptions = {
      from: `"Hệ thống LMS" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "[LMS System] Lời mời kích hoạt tài khoản Quản trị viên",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
          <h2 style="color: #2563eb; margin-top: 0; text-align: center;">Kích Hoạt Tài Khoản Quản Trị</h2>
          
          <p>Xin chào <strong>${name}</strong>,</p>
          
          <p>Tài khoản Quản trị viên của bạn vừa được khởi tạo trên Hệ thống Quản lý Học tập (LMS) với thông tin chi tiết:</p>
          
          <ul style="background-color: #f8fafc; padding: 15px 20px 15px 35px; border-radius: 6px; color: #334155;">
            <li><strong>Email đăng nhập:</strong> ${email}</li>
            <li><strong>Vai trò / Quyền hạn:</strong> ${displayRole}</li>
          </ul>

          <p>Vui lòng nhấp vào nút bên dưới để đặt mật khẩu và kích hoạt tài khoản của bạn. Link này có thời hạn sử dụng trong <strong>24 giờ</strong>.</p>
          
          <div style="margin: 32px 0; text-align: center;">
            <a href="${activationUrl}" 
               style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 15px;">
              Kích Hoạt Tài Khoản Ngay
            </a>
          </div>

          <p style="font-size: 13px; color: #64748b;">
            Nếu nút bấm trên không hoạt động, bạn có thể copy và dán đường link sau vào trình duyệt:<br>
            <a href="${activationUrl}" style="color: #2563eb; word-break: break-all;">${activationUrl}</a>
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 0;">
            Đây là email tự động từ Hệ thống LMS. Vui lòng không phản hồi email này.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return info;

  } catch (error) {
    console.error("Lỗi khi gửi email kích hoạt:", error);
    throw new Error("Không thể gửi email kích hoạt: " + error.message);
  }
};

module.exports = { sendNewLessonEmail,sendForgotPwdEmail,sendAdminInviteEmail };