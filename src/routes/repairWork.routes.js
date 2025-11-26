const express = require('express');
const router = express.Router();
const repairWorkController = require('../controllers/repairWork.controller');
const authMiddleware = require('../middlewares/auth');
const multer = require('multer');

// Configure multer for photo uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     RepairWork:
 *       type: object
 *       required:
 *         - machineId
 *         - title
 *         - priority
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the repair work
 *         machineId:
 *           type: string
 *           description: The ID of the machine
 *         title:
 *           type: string
 *           description: The title of the repair work
 *         description:
 *           type: string
 *           description: The description of the repair work
 *         priority:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *           description: The priority level
 *         status:
 *           type: string
 *           enum: [PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED]
 *           description: The status of the repair work
 *         reportedBy:
 *           type: string
 *           description: The ID of the user who reported the issue
 *         assignedTo:
 *           type: array
 *           items:
 *             type: string
 *           description: List of assigned user IDs
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the repair work was created
 *       example:
 *         id: "uuid-string"
 *         machineId: "machine-uuid"
 *         title: "Broken Belt"
 *         priority: "HIGH"
 *         status: "PENDING"
 */

/**
 * @swagger
 * tags:
 *   name: RepairWorks
 *   description: The repair works managing API
 */

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticateToken);

// GET /api/repair-works - Get all repair works with filtering
/**
 * @swagger
 * /repair-works:
 *   get:
 *     summary: Get all repair works
 *     tags: [RepairWorks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter by priority
 *       - in: query
 *         name: machineId
 *         schema:
 *           type: string
 *         description: Filter by machine ID
 *     responses:
 *       200:
 *         description: List of all repair works
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RepairWork'
 */
router.get('/', repairWorkController.getAllRepairWorks);

// GET /api/repair-works/dashboard/stats - Get repair work statistics
/**
 * @swagger
 * /repair-works/dashboard/stats:
 *   get:
 *     summary: Get repair work statistics
 *     tags: [RepairWorks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Repair work statistics
 */
router.get('/dashboard/stats', repairWorkController.getRepairWorkStats);

// POST /api/repair-works - Create new repair work
/**
 * @swagger
 * /repair-works:
 *   post:
 *     summary: Create new repair work
 *     tags: [RepairWorks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - machineId
 *               - title
 *               - priority
 *             properties:
 *               machineId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *     responses:
 *       201:
 *         description: The repair work was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RepairWork'
 */
router.post('/', repairWorkController.createRepairWork);

// POST /api/repair-works/from-pm/:pmResultId - Create repair work from PM result
/**
 * @swagger
 * /repair-works/from-pm/{pmResultId}:
 *   post:
 *     summary: Create repair work from PM result
 *     tags: [RepairWorks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pmResultId
 *         schema:
 *           type: string
 *         required: true
 *         description: The PM result id
 *     responses:
 *       201:
 *         description: Repair work created from PM result
 */
router.post('/from-pm/:pmResultId', repairWorkController.createFromPMResult);

// GET /api/repair-works/:id - Get repair work by ID
/**
 * @swagger
 * /repair-works/{id}:
 *   get:
 *     summary: Get repair work by ID
 *     tags: [RepairWorks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The repair work id
 *     responses:
 *       200:
 *         description: The repair work description
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RepairWork'
 *       404:
 *         description: The repair work was not found
 */
router.get('/:id', repairWorkController.getRepairWorkById);

// PUT /api/repair-works/:id - Update repair work
/**
 * @swagger
 * /repair-works/{id}:
 *   put:
 *     summary: Update repair work
 *     tags: [RepairWorks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The repair work id
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: The repair work was updated
 */
router.put('/:id', repairWorkController.updateRepairWork);

// DELETE /api/repair-works/:id - Delete repair work
/**
 * @swagger
 * /repair-works/{id}:
 *   delete:
 *     summary: Delete repair work
 *     tags: [RepairWorks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The repair work id
 *     responses:
 *       200:
 *         description: The repair work was deleted
 */
router.delete('/:id', repairWorkController.deleteRepairWork);

// POST /api/repair-works/:id/assign - Assign repair work to technician
/**
 * @swagger
 * /repair-works/{id}/assign:
 *   post:
 *     summary: Assign repair work to technician
 *     tags: [RepairWorks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The repair work id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Repair work assigned
 */
router.post('/:id/assign', repairWorkController.assignRepairWork);

// POST /api/repair-works/:id/assign/bulk - Assign multiple technicians
/**
 * @swagger
 * /repair-works/{id}/assign/bulk:
 *   post:
 *     summary: Assign multiple technicians
 *     tags: [RepairWorks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The repair work id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Repair work assigned to multiple technicians
 */
router.post('/:id/assign/bulk', repairWorkController.assignRepairWorkBulk);

// POST /api/repair-works/:id/start - Start repair work
/**
 * @swagger
 * /repair-works/{id}/start:
 *   post:
 *     summary: Start repair work
 *     tags: [RepairWorks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The repair work id
 *     responses:
 *       200:
 *         description: Repair work started
 */
router.post('/:id/start', repairWorkController.startRepairWork);

// POST /api/repair-works/:id/complete - Complete repair work
/**
 * @swagger
 * /repair-works/{id}/complete:
 *   post:
 *     summary: Complete repair work
 *     tags: [RepairWorks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The repair work id
 *     responses:
 *       200:
 *         description: Repair work completed
 */
router.post('/:id/complete', repairWorkController.completeRepairWork);

// POST /api/repair-works/:id/photos - Upload repair work photos
/**
 * @swagger
 * /repair-works/{id}/photos:
 *   post:
 *     summary: Upload repair work photos
 *     tags: [RepairWorks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The repair work id
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Photos uploaded
 */
router.post('/:id/photos', upload.array('photos', 10), repairWorkController.uploadRepairWorkPhotos);

// DELETE /api/repair-works/:id/photos/:photoId - Delete repair work photo
/**
 * @swagger
 * /repair-works/{id}/photos/{photoId}:
 *   delete:
 *     summary: Delete repair work photo
 *     tags: [RepairWorks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The repair work id
 *       - in: path
 *         name: photoId
 *         schema:
 *           type: string
 *         required: true
 *         description: The photo id
 *     responses:
 *       200:
 *         description: Photo deleted
 */
router.delete('/:id/photos/:photoId', repairWorkController.deleteRepairWorkPhoto);

// PATCH /api/repair-works/:id/items/:itemId - Update single item (remarks/status)
/**
 * @swagger
 * /repair-works/{id}/items/{itemId}:
 *   patch:
 *     summary: Update single item (remarks/status)
 *     tags: [RepairWorks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The repair work id
 *       - in: path
 *         name: itemId
 *         schema:
 *           type: string
 *         required: true
 *         description: The item id
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remarks:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item updated
 */
router.patch('/:id/items/:itemId', repairWorkController.updateRepairWorkItem);

// GET /api/repair-works/:id/items/:itemId/photos - Get photos for a specific item
/**
 * @swagger
 * /repair-works/{id}/items/{itemId}/photos:
 *   get:
 *     summary: Get photos for a specific item
 *     tags: [RepairWorks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The repair work id
 *       - in: path
 *         name: itemId
 *         schema:
 *           type: string
 *         required: true
 *         description: The item id
 *     responses:
 *       200:
 *         description: List of photos
 */
router.get('/:id/items/:itemId/photos', repairWorkController.getItemPhotos);

module.exports = router;
