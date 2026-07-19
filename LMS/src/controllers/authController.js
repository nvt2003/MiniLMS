const UserModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'lms_secret_key_123';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const AuthController = {
  // 1. Logic ĐĂNG KÝ TÀI KHOẢN
  register: async (req, res) => {
    
    try {
      const { name, email, password, role } = req.body;

      // Kiểm tra xem các trường bắt buộc có bị trống không
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin: name, email, password' });
      }

      // Kiểm tra định dạng email cơ bản
      if (!email.includes('@')) {
        return res.status(400).json({ message: 'Định dạng email không hợp lệ' });
      }

      // Kiểm tra độ dài mật khẩu
      if (password.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu phải chứa ít nhất 6 ký tự' });
      }

      // Kiểm tra email đã được sử dụng hay chưa
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email này đã tồn tại trên hệ thống' });
      }
      // Mã hóa (băm) mật khẩu bảo mật
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Lưu người dùng mới vào database (mặc định role là 'student' nếu không truyền)
      const userRole = role && ['student', 'teacher', 'admin'].includes(role) ? role : 'student';
      const newUserId = await UserModel.create(name, email, hashedPassword, userRole);

      return res.status(201).json({
        message: 'Đăng ký tài khoản thành công!',
        userId: newUserId
      });
    } catch (error) {
      return res.status(500).json({ error: 'Lỗi server: ' + error.message });
    }
  },

  // 2. Logic ĐĂNG NHẬP
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Kiểm tra đầu vào
      if (!email || !password) {
        return res.status(400).json({ message: 'Vui lòng nhập cả email và password' });
      }

      // Tìm user theo email trong DB
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
      }

      // So sánh mật khẩu người dùng nhập vào với mật khẩu đã mã hóa trong DB
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
      }

      // Tạo mã JWT Token chứa thông tin Id và Quyền (Role) của User
      const token = jwt.sign(
        { id: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Trả về thành công kèm token để phía Frontend lưu lại
      return res.status(200).json({
        message: 'Đăng nhập thành công!',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      return res.status(500).json({ error: 'Lỗi server: ' + error.message });
    }
  },
  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;

      const user = await UserModel.getProfile(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },

  changePassword: async (req, res) => {
    try {
      const userId = req.user.id;
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Thiếu dữ liệu",
        });
      }

      const user = await UserModel.getById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      const isMatch = await bcrypt.compare(
        oldPassword,
        user.password
      );

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu cũ không đúng",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu mới phải từ 6 ký tự",
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await UserModel.updatePassword(userId, hashedPassword);

      res.json({
        success: true,
        message: "Đổi mật khẩu thành công",
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },
  
  forgotPassword: async (req, res) => {
    const user = await UserModel.getByEmail(email);

    if (user) {
        const token = crypto.randomBytes(32).toString("hex");

        const expires = new Date(Date.now() + 15 * 60 * 1000);

        await UserModel.saveResetToken(
            user.id,
            token,
            expires
        );
        sendForgotPwdEmail(user.email,token);
    }
  },
  resetPassword: async (req,res)=>{
    const reset = await UserModel.getResetToken(token);

    if (!reset) {
        return res.status(400).json({
            message: "Token không hợp lệ."
        });
    }

    if (new Date(reset.expires_at) < new Date()) {
        return res.status(400).json({
            message: "Token đã hết hạn."
        });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await UserModel.updatePassword(
        reset.user_id,
        hashed
    );

    await UserModel.deleteResetToken(token);

    res.json({
        message: "Đổi mật khẩu thành công."
    });
  }
};

module.exports = AuthController;