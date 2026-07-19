const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'lms_secret_key_123';

const AuthMiddleware = {
  // 1. Middleware Xác thực người dùng (Kiểm tra đã đăng nhập chưa)
  verifyToken: (req, res, next) => {
    try {
      // Lấy token từ header "Authorization" dạng: "Bearer <chuỗi_token>"
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      // Nếu không tìm thấy token trong header
      if (!token) {
        return res.status(401).json({ message: 'Bạn chưa đăng nhập! Không tìm thấy mã token.' });
      }

      // Kiểm tra và giải mã token
      jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
        if (err) {
          return res.status(403).json({ message: 'Mã token đã hết hạn hoặc không hợp lệ!' });
        }

        // Nhét thông tin người dùng đã giải mã (gồm id và role) vào object `req`
        req.user = decodedUser;
        
        next();
      });
    } catch (error) {
      return res.status(500).json({ error: 'Lỗi xác thực: ' + error.message });
    }
  },

  // 2. Middleware Phân quyền linh hoạt (Kiểm tra quyền hạn)
  // Hàm này nhận vào một danh sách các quyền được phép (ví dụ: ['teacher', 'admin'])
  restrictTo: (...allowedRoles) => {
    return (req, res, next) => {
      // req.user được sinh ra ở bước verifyToken phía trên. 
      // Nếu role của user hiện tại không nằm trong danh sách được cho phép
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
          message: 'Thao tác bị từ chối! Bạn không có quyền thực hiện chức năng này.' 
        });
      }
      
      next();
    };
  },
  checkTeacher: (req, res, next) => {
    // req.user được lấy từ middleware verifyToken chạy trước đó
    if (req.user && req.user.role === 'teacher') {
      next();
    } else {
      return res.status(403).json({ message: 'Quyền truy cập bị từ chối! Tính năng này chỉ dành cho Giáo viên.' });
    }
  }
};

module.exports = AuthMiddleware;