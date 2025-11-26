const userService = require('../services/user.service');

class UserController {
  // ดึงรายการผู้ใช้ทั้งหมด
  async getAllUsers(req, res) {
    try {
      const { role, isActive, search, page, limit } = req.query;
      
      const filters = {
        role,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10
      };

      const result = await userService.getAllUsers(filters);

      res.status(200).json({
        success: true,
        data: result.users,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้'
      });
    }
  }

  // ดึงข้อมูลผู้ใช้ตาม ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  // สร้างผู้ใช้ใหม่ (สำหรับ admin)
  async createUser(req, res) {
    try {
      const { email, username, password, fullName, roleId, companyId, phoneNumber, lineUserId } = req.body;

      // Validation
      if (!email || !username || !password || !fullName) {
        return res.status(400).json({
          success: false,
          message: 'กรุณากรอกอีเมล ชื่อผู้ใช้ รหัสผ่าน และชื่อ-นามสกุล'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
        });
      }

      const newUser = await userService.createUser({
        email,
        username,
        password,
        fullName,
        roleId,
        companyId,
        phoneNumber,
        lineUserId
      });

      res.status(201).json({
        success: true,
        message: 'สร้างผู้ใช้สำเร็จ',
        data: newUser
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // อัพเดทข้อมูลผู้ใช้
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      console.log('Update data:', updateData);

      const updatedUser = await userService.updateUser(id, updateData);

      res.status(200).json({
        success: true,
        message: 'อัพเดทข้อมูลผู้ใช้สำเร็จ',
        data: updatedUser
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // ลบผู้ใช้ (soft delete)
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // ป้องกันไม่ให้ลบตัวเอง
      if (req.user.id === id) {
        return res.status(400).json({
          success: false,
          message: 'ไม่สามารถลบบัญชีของตัวเองได้'
        });
      }

      const result = await userService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // ลบผู้ใช้ถาวร (hard delete)
  async permanentDeleteUser(req, res) {
    try {
      const { id } = req.params;

      // ป้องกันไม่ให้ลบตัวเอง
      if (req.user.id === id) {
        return res.status(400).json({
          success: false,
          message: 'ไม่สามารถลบบัญชีของตัวเองได้'
        });
      }

      const result = await userService.permanentDeleteUser(id);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Permanent delete user error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // เปลี่ยนสถานะผู้ใช้
  async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;

      // ป้องกันไม่ให้เปลี่ยนสถานะตัวเอง
      if (req.user.id === id) {
        return res.status(400).json({
          success: false,
          message: 'ไม่สามารถเปลี่ยนสถานะบัญชีของตัวเองได้'
        });
      }

      const updatedUser = await userService.toggleUserStatus(id);

      res.status(200).json({
        success: true,
        message: 'เปลี่ยนสถานะผู้ใช้สำเร็จ',
        data: updatedUser
      });
    } catch (error) {
      console.error('Toggle user status error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // อัพเดทโปรไฟล์ตัวเอง
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { fullName, email, username, phoneNumber } = req.body;

      const updatedUser = await userService.updateUser(userId, {
        fullName,
        email,
        username,
        phoneNumber
      });

      res.status(200).json({
        success: true,
        message: 'อัพเดทโปรไฟล์สำเร็จ',
        data: updatedUser
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new UserController();
