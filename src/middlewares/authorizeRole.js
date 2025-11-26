
const authService = require('../services/auth.service');
// Role constants for consistency
const ROLES = {
  ADMIN: 'ADMIN',
  TECHNICIAN: 'TECHNICIAN',
  CUSTOMER: 'CUSTOMER'
};

// Role hierarchy for easier permission checking
const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: 4,
  [ROLES.TECHNICIAN]: 2,
  [ROLES.CUSTOMER]: 1
};

// Utility function to validate role
const isValidRole = (role) => {
  return Object.values(ROLES).includes(role);
};

// Utility function to get role hierarchy level
const getRoleLevel = (role) => {
  return ROLE_HIERARCHY[role] || 0;
};

// Helper function to extract user info from token
const getUserFromToken = (req) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new Error('MISSING_TOKEN');
  }

  const decoded = authService.verifyToken(token);
  
  if (!decoded || !decoded.roleId) {
    throw new Error('INVALID_TOKEN');
  }

  // Get role name from roleId
  const roleIdMap = {
    1: ROLES.ADMIN,
    2: ROLES.TECHNICIAN,
    3: ROLES.CUSTOMER,
    // 4: ROLES.CUSTOMER // backward compatibility if older data used 4
  };
  const userRole = roleIdMap[decoded.roleId];
  if (!userRole) {
    throw new Error('INVALID_ROLE_ID');
  }

  return {
    id: decoded.userId || decoded.id,
    roleId: decoded.roleId,
    role: userRole,
    isActive: decoded.isActive !== false,
    companyId: decoded.companyId
  };
};

// Enhanced role authorization with better error handling
const authorizeRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const user = getUserFromToken(req);
      req.user = user;

      // Validate allowed roles
      const validAllowedRoles = allowedRoles.filter(isValidRole);
      if (validAllowedRoles.length === 0) {
        console.error('Invalid roles provided to authorizeRole:', allowedRoles);
        return res.status(500).json({
          success: false,
          message: 'การกำหนดสิทธิ์ไม่ถูกต้อง',
          error: 'INVALID_PERMISSION_CONFIG'
        });
      }

      // Check role permission
      if (!validAllowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้',
          error: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: validAllowedRoles,
          userRole: user.role
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      
      if (error.message === 'MISSING_TOKEN') {
        return res.status(401).json({
          success: false,
          message: 'ไม่พบ Access Token',
          error: 'MISSING_TOKEN'
        });
      } else if (error.message === 'INVALID_TOKEN') {
        return res.status(401).json({
          success: false,
          message: 'Token ไม่ถูกต้อง',
          error: 'INVALID_TOKEN'
        });
      } else if (error.message === 'INVALID_ROLE_ID') {
        return res.status(403).json({
          success: false,
          message: 'Role ID ไม่ถูกต้อง',
          error: 'INVALID_ROLE_ID'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'ไม่สามารถตรวจสอบสิทธิ์ได้',
        error: 'AUTHORIZATION_ERROR'
      });
    }
  };
};

// Role authorization with minimum level requirement
const authorizeMinRole = (minRole) => {
  return async (req, res, next) => {
    try {
      const user = getUserFromToken(req);
      req.user = user;

      const userLevel = getRoleLevel(user.role);
      const requiredLevel = getRoleLevel(minRole);

      if (userLevel < requiredLevel) {
        return res.status(403).json({
          success: false,
          message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้',
          error: 'INSUFFICIENT_ROLE_LEVEL',
          requiredMinRole: minRole,
          userRole: user.role
        });
      }

      next();
    } catch (error) {
      console.error('Min role authorization error:', error);
      
      if (error.message === 'MISSING_TOKEN') {
        return res.status(401).json({
          success: false,
          message: 'ไม่พบ Access Token',
          error: 'MISSING_TOKEN'
        });
      } else if (error.message === 'INVALID_TOKEN') {
        return res.status(401).json({
          success: false,
          message: 'Token ไม่ถูกต้อง',
          error: 'INVALID_TOKEN'
        });
      } else if (error.message === 'INVALID_ROLE_ID') {
        return res.status(403).json({
          success: false,
          message: 'Role ID ไม่ถูกต้อง',
          error: 'INVALID_ROLE_ID'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'ไม่สามารถตรวจสอบสิทธิ์ได้',
        error: 'AUTHORIZATION_ERROR'
      });
    }
  };
};

// Common role combinations
const requireAdmin = authorizeRole(ROLES.ADMIN);
const requireAdminOrTechnician = authorizeRole(ROLES.ADMIN, ROLES.TECHNICIAN);
const requireMinTechnician = authorizeMinRole(ROLES.TECHNICIAN);



// Owner or admin check
const requireOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'ไม่พบข้อมูลผู้ใช้',
      error: 'AUTHENTICATION_REQUIRED'
    });
  }

  const targetUserId = req.params.id || req.params.userId || req.body.userId;
  
  if (!targetUserId) {
    return res.status(400).json({
      success: false,
      message: 'ไม่พบ ID ของผู้ใช้ที่ต้องการเข้าถึง',
      error: 'MISSING_TARGET_USER_ID'
    });
  }

  const isAdmin = req.user.role === ROLES.ADMIN;
  const isOwner = req.user.id === targetUserId || req.user.id.toString() === targetUserId.toString();

  if (isAdmin || isOwner) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้',
    error: 'INSUFFICIENT_PERMISSIONS',
    details: 'ต้องเป็น Admin หรือเจ้าของข้อมูลเท่านั้น'
  });
};

// Company-based access control (for multi-tenant scenarios)
const requireSameCompanyOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'ไม่พบข้อมูลผู้ใช้',
      error: 'AUTHENTICATION_REQUIRED'
    });
  }

  if (req.user.role === ROLES.ADMIN) {
    return next();
  }

  const targetCompanyId = req.params.companyId || req.body.companyId;
  
  if (!targetCompanyId) {
    return res.status(400).json({
      success: false,
      message: 'ไม่พบ Company ID',
      error: 'MISSING_COMPANY_ID'
    });
  }

  if (req.user.companyId === targetCompanyId || req.user.companyId.toString() === targetCompanyId.toString()) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลของบริษัทนี้',
    error: 'CROSS_COMPANY_ACCESS_DENIED'
  });
};

// Custom permission checker
const requireCustomPermission = (permissionCheckFn, errorMessage = 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้',
        error: 'AUTHENTICATION_REQUIRED'
      });
    }

    try {
      const hasPermission = await permissionCheckFn(req.user, req);
      
      if (hasPermission) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: errorMessage,
        error: 'CUSTOM_PERMISSION_DENIED'
      });
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์',
        error: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

module.exports = {
  // Core authorization functions
  authorizeRole,
  authorizeMinRole,
  
  // Role constants for consistency
  ROLES,
  ROLE_HIERARCHY,
  
  // Utility functions
  isValidRole,
  getRoleLevel,
  getUserFromToken,
  
  // Common role combinations
  requireAdmin,
  requireAdminOrTechnician,
  requireMinTechnician,
  
  // Ownership-based access control
  requireOwnerOrAdmin,
  
  // Company-based access control
  requireSameCompanyOrAdmin,
  
  // Custom permission checker
  requireCustomPermission
};
