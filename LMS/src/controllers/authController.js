const UserModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const sendMail = require('../utils/sendEmail')

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
      const { email } = req.body;
    const user = await UserModel.findByEmail(email);
    if (user) {
        const token = crypto.randomBytes(32).toString("hex");

        const expires = new Date(Date.now() + 15 * 60 * 1000);

        await UserModel.saveResetToken(
            user.id,
            token,
            expires
        );
        sendMail.sendForgotPwdEmail(user.email,token);
        
    return res.json({
      success: true,
      message: "Email đặt lại mật khẩu đã được gửi",
    });
    }
  },
  resetPassword: async (req,res)=>{
    const {token, newPassword} = req.body
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
  },
  registerAdmin: async (req, res) => {
    
    try {
      const creatorId = req.user?.id;
      const creatorRole = req.user?.role
      if (creatorRole !== 'admin') {
        return res.status(403).json({ 
          message: 'Truy cập bị từ chối: Chỉ Super Admin mới có quyền tạo tài khoản Admin!' 
        });
      }
      const { name, email, password,role } = req.body;
      
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
      let userId;
      let isUpdated = false;
      if (existingUser) {
        // Bảo vệ: Không cho phép tự đổi Role của Super Admin gốc từ API này
        if (existingUser.role === 'admin' && targetRole !== 'admin') {
          return res.status(400).json({ 
            message: 'Không thể hạ cấp hoặc thay đổi Role của tài khoản Super Admin sẵn có!' 
          });
          await UserModel.updateUserRoleAndStatus({
            userId: existingUser.id,
            name: name,
            password: hashedPassword,
            role: targetRole,
            status: 'PENDING',
            created_by: creatorId
          });

          userId = existingUser.id;
          isUpdated = true;
        }
      }else{
        
      //Xử lý Role cho Admin mới
      userId = await UserModel.create({
          name,
          email,
          password: hashedPassword,
          role: targetRole,
          status: 'PENDING',
          created_by: creatorId
        });
      }

    // 3. Tạo Token kích hoạt và Gửi Email
    const activationToken = jwt.sign(
      { userId: userId, email: email },
      process.env.JWT_ACTIVATION_SECRET,
      { expiresIn: '24h' }
    );

    await sendAdminInviteEmail(email, name, activationToken, targetRole);

    return res.status(200).json({
      message: isUpdated 
        ? 'Tài khoản đã tồn tại! Đã cập nhật Role mới và gửi email kích hoạt lại.' 
        : 'Tạo tài khoản Quản trị viên mới thành công!',
      data: {
        userId: userId,
        email: email,
        role: targetRole,
        status: 'PENDING',
        isUpdated: isUpdated
      }
    });

    } catch (error) {
        console.error('Lỗi registerAdmin:', error);
        return res.status(500).json({ 
          message: 'Lỗi máy chủ nội bộ', 
          error: error.message 
        });
      }
    },
  
  verifyActivationToken: async (req, res) => {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ message: 'Mã kích hoạt không được để trống' });
      }

      // Xác thực JWT Token (Giả định Secret key lưu trong .env)
      const decoded = jwt.verify(token, process.env.JWT_ACTIVATION_SECRET);

      // Tìm user trong DB để đảm bảo user tồn tại và vẫn ở trạng thái PENDING
      const user = await UserModel.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: 'Tài khoản không tồn tại trên hệ thống' });
      }

      if (user.status === 'ACTIVE') {
        return res.status(400).json({ message: 'Tài khoản này đã được kích hoạt trước đó' });
      }
      const activationToken = jwt.sign(
        { userId: newUserId, email: email },
        process.env.JWT_ACTIVATION_SECRET,
        { expiresIn: '24h' }
      );

      await sendAdminInviteEmail(email, name, activationToken, targetRole);
      return res.status(200).json({
        message: isUpdated 
          ? 'Tài khoản đã tồn tại! Đã cập nhật Role mới và gửi email kích hoạt lại.' 
          : 'Tạo tài khoản Quản trị viên mới thành công!',
        data: {
          userId: userId,
          email: email,
          role: targetRole,
          status: 'PENDING',
          isUpdated: isUpdated
        }
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(400).json({ message: 'Link kích hoạt đã hết hạn (quá 24h). Vui lòng liên hệ Super Admin gửi lại lời mời.' });
      }
      return res.status(400).json({ message: 'Mã kích hoạt không hợp lệ hoặc đã bị chỉnh sửa' });
    }
  },
  activateAccount: async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      // Validate dữ liệu đầu vào
      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ token và mật khẩu mới' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu mới phải chứa ít nhất 6 ký tự' });
      }

      // Giải mã token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_ACTIVATION_SECRET);
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(400).json({ message: 'Link kích hoạt đã hết hạn' });
        }
        return res.status(400).json({ message: 'Mã kích hoạt không hợp lệ' });
      }

      // Kiểm tra sự tồn tại của User
      const user = await UserModel.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: 'Tài khoản không tồn tại' });
      }

      if (user.status === 'ACTIVE') {
        return res.status(400).json({ message: 'Tài khoản này đã được kích hoạt từ trước' });
      }

      // Mã hóa mật khẩu mới
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Cập nhật Database: Đổi mật khẩu, chuyển status thành ACTIVE
      await UserModel.activateAdminUser(decoded.userId, hashedPassword);

      return res.status(200).json({
        message: 'Kích hoạt tài khoản thành công! Bạn hiện có thể đăng nhập vào hệ thống.'
      });

    } catch (error) {
      console.error('Lỗi activateAccount:', error);
      return res.status(500).json({ 
        message: 'Lỗi máy chủ nội bộ', 
        error: error.message 
      });
    }
  },
};

module.exports = AuthController;