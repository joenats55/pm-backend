const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

class UserService {
  // ดึงรายการผู้ใช้ทั้งหมด
  async getAllUsers(filters = {}) {
    const { role, isActive, search, page = 1, limit = 10 } = filters;
    
    const where = {};
    
    if (role) {
      where.role = {
        name: role
      };
    }
    if (typeof isActive === 'boolean') where.isActive = isActive;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          phoneNumber: true,
          role: {
            select: {
              id: true,
              name: true
            }
          },
          company: {
            select: {
              id: true,
              name: true
            }
          },
          isActive: true,
          createdAt: true,
          updatedAt: true
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // ดึงข้อมูลผู้ใช้ตาม ID
  async getUserById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        phoneNumber: true,
        role: {
          select: {
            id: true,
            name: true
          }
        },
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

  // สร้างผู้ใช้ใหม่ (สำหรับ admin)
  async createUser(userData) {
    const { email, username, password, fullName, roleId, companyId, phoneNumber, lineUserId } = userData;

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

    // Prepare user data
    const userData_prepared = {
      email,
      username,
      passwordHash: hashedPassword,
      fullName,
      roleId: roleId || 1, // Default to role ID 1 if not provided
      phoneNumber,
      lineUserId
    };

    // Handle company linking - only allow for CUSTOMER role
    if (companyId && roleId) {
      const role = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (role && role.name === 'CUSTOMER') {
        userData_prepared.companyId = companyId;
      }
      // If role is not CUSTOMER, companyId is ignored (not set)
    }

    const newUser = await prisma.user.create({
      data: userData_prepared,
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: {
          select: {
            id: true,
            name: true
          }
        },
        company: {
          select: {
            id: true,
            name: true
          }
        },
        isActive: true,
        createdAt: true
      }
    });

    return newUser;
  }

  // อัพเดทข้อมูลผู้ใช้
  async updateUser(id, updateData) {
    const { email, username, fullName, roleId, isActive, companyId, phoneNumber, lineUserId } = updateData;

    // ตรวจสอบว่าผู้ใช้มีอยู่หรือไม่
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw new Error('ไม่พบผู้ใช้');
    }

    // ตรวจสอบว่า email หรือ username ซ้ำหรือไม่ (ถ้ามีการเปลี่ยนแปลง)
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });
      if (emailExists) {
        throw new Error('อีเมลนี้มีอยู่แล้ว');
      }
    }

    if (username && username !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username }
      });
      if (usernameExists) {
        throw new Error('ชื่อผู้ใช้นี้มีอยู่แล้ว');
      }
    }

    // Prepare update data
    const updateFields = {
      ...(email && { email }),
      ...(username && { username }),
      ...(fullName !== undefined && { fullName }),
      ...(roleId !== undefined && { roleId }),
      ...(typeof isActive === 'boolean' && { isActive }),
      ...(phoneNumber !== undefined && { phoneNumber }),
      ...(lineUserId !== undefined && { lineUserId })
    };

    // Handle company linking logic
    if (roleId !== undefined) {
      // Get the role information to check if it's CUSTOMER
      const role = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (role && role.name === 'CUSTOMER') {
        // If changing to CUSTOMER role, allow companyId to be set
        if (companyId !== undefined) {
          updateFields.companyId = companyId;
        }
      } else {
        // If changing to any role other than CUSTOMER, unlink from company
        updateFields.companyId = null;
      }
    } else {
      // If role is not being changed, handle companyId normally
      if (companyId !== undefined) {
        updateFields.companyId = companyId;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateFields,
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        phoneNumber: true,
        role: {
          select: {
            id: true,
            name: true
          }
        },
        company: {
          select: {
            id: true,
            name: true
          }
        },
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return updatedUser;
  }

  // ลบผู้ใช้ (soft delete - เปลี่ยนสถานะเป็น inactive)
  async deleteUser(id) {
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new Error('ไม่พบผู้ใช้');
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });

    return { message: 'ลบผู้ใช้สำเร็จ' };
  }

  // ลบผู้ใช้ถาวร (hard delete - ใช้ด้วยความระมัดระวัง)
  async permanentDeleteUser(id) {
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new Error('ไม่พบผู้ใช้');
    }

    await prisma.user.delete({
      where: { id }
    });

    return { message: 'ลบผู้ใช้ถาวรสำเร็จ' };
  }

  // เปลี่ยนสถานะผู้ใช้
  async toggleUserStatus(id) {
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new Error('ไม่พบผู้ใช้');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: {
          select: {
            id: true,
            name: true
          }
        },
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return updatedUser;
  }
}

module.exports = new UserService();
