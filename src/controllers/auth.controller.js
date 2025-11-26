const authService = require('../services/auth.service');

class AuthController {
  // สมัครสมาชิก
  async register(req, res) {
    try {
      const { email, username, password, fullName, roleId } = req.body;

      // Validation
      if (!email || !username || !password) {
        return res.status(400).json({
          success: false,
          message: 'กรุณากรอกอีเมล ชื่อผู้ใช้ และรหัสผ่าน'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
        });
      }

      const result = await authService.register({
        email,
        username,
        password,
        fullName,
        roleId
      });

      res.status(201).json({
        success: true,
        message: 'สมัครสมาชิกสำเร็จ',
        data: result
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // เข้าสู่ระบบ
  async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validation
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'
        });
      }

      const result = await authService.login(username, password);

      res.status(200).json({
        success: true,
        message: 'เข้าสู่ระบบสำเร็จ',
        data: result
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }

  // ดึงข้อมูลโปรไฟล์
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await authService.getProfile(userId);

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  // เปลี่ยนรหัสผ่าน
  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { oldPassword, newPassword } = req.body;

      // Validation
      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'กรุณากรอกรหัสผ่านเก่าและรหัสผ่านใหม่'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'
        });
      }

      const result = await authService.changePassword(userId, oldPassword, newPassword);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // ออกจากระบบ (ลบ token ฝั่ง client)
  async logout(req, res) {
    try {
      // การออกจากระบบจะทำฝั่ง client โดยลบ token
      res.status(200).json({
        success: true,
        message: 'ออกจากระบบสำเร็จ'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการออกจากระบบ'
      });
    }
  }
}

module.exports = new AuthController();
