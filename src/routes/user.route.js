const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/authorizeRole');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - username
 *         - password
 *         - fullName
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the user
 *         email:
 *           type: string
 *           description: The email of the user
 *         username:
 *           type: string
 *           description: The username of the user
 *         fullName:
 *           type: string
 *           description: The full name of the user
 *         role:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *         company:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *         isActive:
 *           type: boolean
 *           description: The status of the user
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the user was added
 *       example:
 *         id: d5fE_asz
 *         email: user@example.com
 *         username: user1
 *         fullName: John Doe
 *         isActive: true
 *         role: { id: 1, name: "CUSTOMER" }
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: The users managing API
 */

// ต้องผ่านการ authenticate ทุก route
router.use(authenticateToken);

// Routes สำหรับ user ทั่วไป

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update own profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: The user profile was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Some error happened
 */
router.put('/profile', userController.updateProfile); // อัพเดทโปรไฟล์ตัวเอง

// Routes สำหรับ Admin

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Returns the list of all the users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role name
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by email, username, or fullName
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of items per page
 *     responses:
 *       200:
 *         description: The list of the users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/', requireAdmin, userController.getAllUsers); // ดึงรายการผู้ใช้ทั้งหมด

// Routes สำหรับเจ้าของข้อมูลหรือ Admin 

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get the user by id
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user id
 *     responses:
 *       200:
 *         description: The user description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: The user was not found
 */
router.get('/:id', requireAdmin, userController.getUserById); // ดึงข้อมูลผู้ใช้ตาม ID

// Routes สำหรับ Admin เท่านั้น

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - password
 *               - fullName
 *             properties:
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               fullName:
 *                 type: string
 *               roleId:
 *                 type: integer
 *               companyId:
 *                 type: integer
 *               phoneNumber:
 *                 type: string
 *               lineUserId:
 *                 type: string
 *     responses:
 *       201:
 *         description: The user was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing required fields or invalid data
 */
router.post('/', requireAdmin, userController.createUser); // สร้างผู้ใช้ใหม่

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update the user by the id
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               fullName:
 *                 type: string
 *               roleId:
 *                 type: integer
 *               companyId:
 *                 type: integer
 *               phoneNumber:
 *                 type: string
 *               lineUserId:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: The user was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: The user was not found
 *       400:
 *         description: Some error happened
 */
router.put('/:id', requireAdmin, userController.updateUser); // อัพเดทข้อมูลผู้ใช้

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Remove the user by id (Soft delete)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user id
 *     responses:
 *       200:
 *         description: The user was deleted
 *       404:
 *         description: The user was not found
 */
router.delete('/:id', requireAdmin, userController.deleteUser); // ลบผู้ใช้ (soft delete)

/**
 * @swagger
 * /users/{id}/permanent:
 *   delete:
 *     summary: Permanently remove the user by id
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user id
 *     responses:
 *       200:
 *         description: The user was permanently deleted
 *       404:
 *         description: The user was not found
 */
router.delete('/:id/permanent', requireAdmin, userController.permanentDeleteUser); // ลบผู้ใช้ถาวร

/**
 * @swagger
 * /users/{id}/toggle-status:
 *   patch:
 *     summary: Toggle user active status
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user id
 *     responses:
 *       200:
 *         description: The user status was toggled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: The user was not found
 */
router.patch('/:id/toggle-status', requireAdmin, userController.toggleUserStatus); // เปลี่ยนสถานะผู้ใช้

module.exports = router;
