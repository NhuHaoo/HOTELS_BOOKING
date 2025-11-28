const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

// ===============================
// 🔐 MIDDLEWARE : BẮT BUỘC LOGIN
// ===============================
exports.protect = async (req, res, next) => {
  let token;

  // Lấy token từ header Authorization: Bearer xxxx
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Không có token
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Lấy user từ DB
    req.user = await User.findById(decoded.id).select('-passwordHash');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Token hợp lệ nhưng người dùng không tồn tại.'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn.'
    });
  }
};


// =====================================
// 🔓 MIDDLEWARE : KHÔNG BẮT BUỘC LOGIN
// =====================================
exports.optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = await User.findById(decoded.id).select('-passwordHash');
    } catch (error) {
      req.user = null; // Token sai nhưng không chặn
    }
  } else {
    req.user = null;
  }

  next();
};


// ===============================
// 🔥 CHẶN THEO VAI TRÒ (role)
// ===============================

/**
 *  requireRole('admin')
 *  requireRole('manager')
 *  requireRole('user')
 */
exports.requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập tài nguyên này.'
      });
    }

    next();
  };
};


// ===============================
// 🔥 CHẶN RIÊNG CHO ADMIN
// ===============================
exports.isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Chỉ quản trị viên (admin) mới được phép truy cập.'
    });
  }
  next();
};

// ===============================
// 🔥 CHẶN RIÊNG CHO MANAGER
// ===============================
exports.isManager = (req, res, next) => {
  if (req.user?.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Chỉ Manager mới được phép truy cập khu vực này.'
    });
  }
  next();
};
