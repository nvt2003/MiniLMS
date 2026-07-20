const nodemailer = require('nodemailer');
const FRONT_END = process.env.FRONT_END;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS  
  }
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
  const mailOptions = {
    from: `"Hệ thống LMS" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Thay đổi mật khẩu`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #2563eb;">Có bài học mới xuất hiện!</h2>
        <p>Chào bạn,</p>
        <p>Vào trang bằng link sau để đổi mật khẩu</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${FRONT_END}/reset-pwd/${token}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px;">Vào Học Ngay</a>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`Lỗi gửi email đến ${email}:`, error);
  }
};

module.exports = { sendNewLessonEmail,sendForgotPwdEmail };