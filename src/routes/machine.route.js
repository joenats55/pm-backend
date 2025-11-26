const express = require('express');
const router = express.Router();
const machineController = require('../controllers/machine.controller');
const { authenticateToken } = require('../middlewares/auth');
const { authorizeRole } = require('../middlewares/authorizeRole');
const { uploadSingleImage, handleUploadError } = require('../middlewares/upload');

/**
 * @swagger
 * components:
 *   schemas:
 *     Machine:
 *       type: object
 *       required:
 *         - code
 *         - name
 *         - companyId
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the machine
 *         code:
 *           type: string
 *           description: The unique code of the machine
 *         name:
 *           type: string
 *           description: The name of the machine
 *         description:
 *           type: string
 *           description: The description of the machine
 *         model:
 *           type: string
 *           description: The model of the machine
 *         serialNumber:
 *           type: string
 *           description: The serial number of the machine
 *         installationDate:
 *           type: string
 *           format: date
 *           description: The installation date
 *         warrantyExpireDate:
 *           type: string
 *           format: date
 *           description: The warranty expiration date
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, MAINTENANCE, BROKEN]
 *           description: The status of the machine
 *         imageUrl:
 *           type: string
 *           description: The URL of the machine image
 *         companyId:
 *           type: integer
 *           description: The ID of the company owning the machine
 *         company:
 *           $ref: '#/components/schemas/Company'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the machine was added
 *       example:
 *         id: "uuid-string"
 *         code: "MCH-001"
 *         name: "CNC Machine 1"
 *         model: "X-1000"
 *         status: "ACTIVE"
 *         companyId: 1
 */

/**
 * @swagger
 * tags:
 *   name: Machines
 *   description: The machines managing API
 */

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /machines:
 *   get:
 *     summary: Returns the list of all the machines
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or code
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: integer
 *         description: Filter by company ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
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
 *         description: The list of the machines
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Machine'
 */
router.get('/', 
  authorizeRole('ADMIN'),
  machineController.getAllMachines
);

/**
 * @swagger
 * /machines/stats:
 *   get:
 *     summary: Get machine statistics
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Machine statistics
 */
router.get('/stats',
  authorizeRole('ADMIN'),
  machineController.getMachineStats
);

/**
 * @swagger
 * /machines/search:
 *   get:
 *     summary: Advanced search machines
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search',
  authorizeRole('ADMIN', 'TECHNICIAN'),
  machineController.searchMachines
);

/**
 * @swagger
 * /machines/bulk-status:
 *   post:
 *     summary: Bulk update machine status
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - machineIds
 *               - status
 *             properties:
 *               machineIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.post('/bulk-status',
  authorizeRole('ADMIN'),
  machineController.bulkUpdateMachineStatus
);

/**
 * @swagger
 * /machines/company/{companyId}:
 *   get:
 *     summary: Get machines by company
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The company id
 *     responses:
 *       200:
 *         description: List of machines
 */
router.get('/company/:companyId',
  authorizeRole('ADMIN'),
  machineController.getMachinesByCompany
);

/**
 * @swagger
 * /machines/code/{code}:
 *   get:
 *     summary: Get machine by machine code
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: The machine code
 *     responses:
 *       200:
 *         description: The machine description
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Machine'
 *       404:
 *         description: The machine was not found
 */
router.get('/code/:code',
  authorizeRole('ADMIN', 'TECHNICIAN', 'CUSTOMER'),
  machineController.getMachineByCode
);

/**
 * @swagger
 * /machines/{id}:
 *   get:
 *     summary: Get machine by ID
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The machine id
 *     responses:
 *       200:
 *         description: The machine description
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Machine'
 *       404:
 *         description: The machine was not found
 */
router.get('/:id',
  authorizeRole('ADMIN', 'TECHNICIAN', 'CUSTOMER'),
  machineController.getMachineById
);

/**
 * @swagger
 * /machines:
 *   post:
 *     summary: Create new machine
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - companyId
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               companyId:
 *                 type: integer
 *               description:
 *                 type: string
 *               model:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *               installationDate:
 *                 type: string
 *                 format: date
 *               warrantyExpireDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: The machine was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Machine'
 */
router.post('/',
  authorizeRole('ADMIN'),
  machineController.createMachine
);

/**
 * @swagger
 * /machines/with-image:
 *   post:
 *     summary: Create new machine with image
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               companyId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: The machine was created with image
 */
router.post('/with-image',
  authorizeRole('ADMIN'),
  uploadSingleImage,
  handleUploadError,
  machineController.createMachineWithImage
);

/**
 * @swagger
 * /machines/{id}/upload-image:
 *   post:
 *     summary: Upload image for existing machine
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The machine id
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 */
router.post('/:id/upload-image',
  authorizeRole('ADMIN'),
  uploadSingleImage,
  handleUploadError,
  machineController.uploadMachineImage
);

/**
 * @swagger
 * /machines/{id}/image:
 *   delete:
 *     summary: Delete machine image
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The machine id
 *     responses:
 *       200:
 *         description: Image deleted successfully
 */
router.delete('/:id/image',
  authorizeRole('ADMIN'),
  machineController.deleteMachineImage
);

/**
 * @swagger
 * /machines/{id}:
 *   put:
 *     summary: Update machine
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The machine id
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Machine updated successfully
 */
router.put('/:id',
  authorizeRole('ADMIN'),
  machineController.updateMachine
);

/**
 * @swagger
 * /machines/{id}/with-image:
 *   put:
 *     summary: Update machine with image
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The machine id
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Machine updated successfully
 */
router.put('/:id/with-image',
  authorizeRole('ADMIN'),
  uploadSingleImage,
  handleUploadError,
  machineController.updateMachineWithImage
);

/**
 * @swagger
 * /machines/{id}:
 *   delete:
 *     summary: Delete machine
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The machine id
 *     responses:
 *       200:
 *         description: Machine deleted successfully
 */
router.delete('/:id',
  authorizeRole('ADMIN'),
  machineController.deleteMachine
);

/**
 * @swagger
 * /machines/{id}/qr:
 *   get:
 *     summary: Generate QR code for machine
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The machine id
 *     responses:
 *       200:
 *         description: QR code generated
 */
router.get('/:id/qr',
  authorizeRole('ADMIN', 'SUPERVISOR', 'TECHNICIAN', 'CUSTOMER'),
  machineController.generateMachineQR
);

module.exports = router;
