const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class AuthService {
  // สร้าง JWT token
  generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  }

  // ตรวจสอบ JWT token
  verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }

  // สมัครสมาชิก
  async register(userData) {
    const { email, username, password, fullName, roleId = 1 } = userData;

    // ตรวจสอบว่า email หรือ username ซ้ำหรือไม่
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      throw new Error('อีเมลหรือชื่อผู้ใช้นี้มีอยู่แล้ว');
    }

    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 12);

    // สร้างผู้ใช้ใหม่
    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash: hashedPassword,
        fullName,
        roleId
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        roleId: true,
        isActive: true,
        createdAt: true
      }
    });

    // สร้าง token
    const token = this.generateToken({
      userId: newUser.id,
      username: newUser.username,
      roleId: newUser.roleId
    });

    return {
      user: newUser,
      token
    };
  }

  // เข้าสู่ระบบ
  async login(username, password) {
    // หาผู้ใช้จาก username
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      throw new Error('ไม่พบผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }

    if (!user.isActive) {
      throw new Error('บัญชีผู้ใช้ถูกระงับ');
    }

    // ตรวจสอบรหัสผ่าน
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('ไม่พบผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }

    // สร้าง token
    const token = this.generateToken({
      userId: user.id,
      username: user.username,
      roleId: user.roleId
    });

    // ส่งข้อมูลผู้ใช้ (ไม่รวมรหัสผ่าน)
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  }

  // เปลี่ยนรหัสผ่าน
  async changePassword(userId, oldPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('ไม่พบผู้ใช้');
    }

    // ตรวจสอบรหัสผ่านเก่า
    const isValidOldPassword = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValidOldPassword) {
      throw new Error('รหัสผ่านเก่าไม่ถูกต้อง');
    }

    // เข้ารหัสรหัสผ่านใหม่
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // อัพเดทรหัสผ่าน
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedNewPassword }
    });

    return { message: 'เปลี่ยนรหัสผ่านสำเร็จ' };
  }

  // ดึงข้อมูลผู้ใช้จาก token
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        phoneNumber: true,
        roleId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new Error('ไม่พบผู้ใช้');
    }

    return user;
  }
}

module.exports = new AuthService();
