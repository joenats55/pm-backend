const jwt = require('jsonwebtoken');
const authService = require('../services/auth.service');

// ตรวจสอบ JWT Token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบ Token การยืนยันตัวตน'
      });
    }

    // ตรวจสอบ token
    const decoded = authService.verifyToken(token);
    
    // ดึงข้อมูลผู้ใช้
    const user = await authService.getProfile(decoded.userId);
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'บัญชีผู้ใช้ถูกระงับ'
      });
    }

    // Convert roleId to role string for consistent usage
    const roleIdMap = {
      1: 'ADMIN',
      2: 'TECHNICIAN',
      3: 'CUSTOMER',
      // 4: 'CUSTOMER', // backward compatibility if older data used 4
    };
    const roleName = roleIdMap[user.roleId] || 'UNKNOWN';

    // เก็บข้อมูลผู้ใช้ใน req object พร้อม role string
    req.user = {
      ...user,
      role: roleName
    };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token ไม่ถูกต้อง'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token หมดอายุ'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'การยืนยันตัวตนล้มเหลว'
    });
  }
};

// ตรวจสอบ token แบบ optional (ไม่จำเป็นต้องมี token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = authService.verifyToken(token);
      const user = await authService.getProfile(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // ไม่ส่ง error กลับ เพราะเป็น optional auth
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};
