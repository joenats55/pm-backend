const express = require('express');
const router = express.Router();
const machinePartController = require('../controllers/machinePart.controller');
const { authenticateToken } = require('../middlewares/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     MachinePart:
 *       type: object
 *       required:
 *         - machineId
 *         - name
 *         - partNumber
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the part
 *         machineId:
 *           type: string
 *           description: The ID of the machine
 *         name:
 *           type: string
 *           description: The name of the part
 *         partNumber:
 *           type: string
 *           description: The part number
 *         description:
 *           type: string
 *           description: The description of the part
 *         stock:
 *           type: integer
 *           description: The current stock quantity
 *         minStock:
 *           type: integer
 *           description: The minimum stock level
 *         unit:
 *           type: string
 *           description: The unit of measurement
 *         location:
 *           type: string
 *           description: The storage location
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the part was added
 *       example:
 *         id: "uuid-string"
 *         machineId: "machine-uuid"
 *         name: "Bearing"
 *         partNumber: "B-123"
 *         stock: 10
 *         minStock: 5
 *         unit: "pcs"
 */

/**
 * @swagger
 * tags:
 *   name: MachineParts
 *   description: The machine parts managing API
 */

// Get all machine parts (with machine details)
/**
 * @swagger
 * /machine-parts:
 *   get:
 *     summary: Get all machine parts
 *     tags: [MachineParts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all machine parts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MachinePart'
 */
router.get('/', authenticateToken, machinePartController.getAllMachineParts);

// Get all parts for a specific machine
/**
 * @swagger
 * /machine-parts/machine/{machineId}:
 *   get:
 *     summary: Get all parts for a specific machine
 *     tags: [MachineParts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: machineId
 *         schema:
 *           type: string
 *         required: true
 *         description: The machine id
 *     responses:
 *       200:
 *         description: List of parts for the machine
 */
router.get('/machine/:machineId', authenticateToken, machinePartController.getMachinePartsByMachineId);

// Search parts for a specific machine
/**
 * @swagger
 * /machine-parts/machine/{machineId}/search:
 *   get:
 *     summary: Search parts for a specific machine
 *     tags: [MachineParts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: machineId
 *         schema:
 *           type: string
 *         required: true
 *         description: The machine id
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/machine/:machineId/search', authenticateToken, machinePartController.searchParts);

// Get low stock parts for a specific machine
/**
 * @swagger
 * /machine-parts/machine/{machineId}/low-stock:
 *   get:
 *     summary: Get low stock parts for a specific machine
 *     tags: [MachineParts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: machineId
 *         schema:
 *           type: string
 *         required: true
 *         description: The machine id
 *     responses:
 *       200:
 *         description: List of low stock parts
 */
router.get('/machine/:machineId/low-stock', authenticateToken, machinePartController.getLowStockParts);

// Get specific part by ID
/**
 * @swagger
 * /machine-parts/{id}:
 *   get:
 *     summary: Get specific part by ID
 *     tags: [MachineParts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The part id
 *     responses:
 *       200:
 *         description: The part description
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MachinePart'
 *       404:
 *         description: The part was not found
 */
router.get('/:id', authenticateToken, machinePartController.getMachinePartById);

// Create new machine part
/**
 * @swagger
 * /machine-parts:
 *   post:
 *     summary: Create new machine part
 *     tags: [MachineParts]
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
 *               - name
 *               - partNumber
 *             properties:
 *               machineId:
 *                 type: string
 *               name:
 *                 type: string
 *               partNumber:
 *                 type: string
 *               description:
 *                 type: string
 *               stock:
 *                 type: integer
 *               minStock:
 *                 type: integer
 *               unit:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: The part was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MachinePart'
 */
router.post('/', authenticateToken, machinePartController.createMachinePart);

// Update machine part
/**
 * @swagger
 * /machine-parts/{id}:
 *   put:
 *     summary: Update machine part
 *     tags: [MachineParts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The part id
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               partNumber:
 *                 type: string
 *               description:
 *                 type: string
 *               stock:
 *                 type: integer
 *               minStock:
 *                 type: integer
 *               unit:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: The part was updated
 */
router.put('/:id', authenticateToken, machinePartController.updateMachinePart);

// Update part stock (add/subtract)
/**
 * @swagger
 * /machine-parts/{id}/stock:
 *   patch:
 *     summary: Update part stock
 *     tags: [MachineParts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The part id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *               - type
 *             properties:
 *               quantity:
 *                 type: integer
 *                 description: The quantity to add or subtract
 *               type:
 *                 type: string
 *                 enum: [add, subtract]
 *                 description: The operation type
 *     responses:
 *       200:
 *         description: Stock updated successfully
 */
router.patch('/:id/stock', authenticateToken, machinePartController.updatePartStock);

// Delete machine part
/**
 * @swagger
 * /machine-parts/{id}:
 *   delete:
 *     summary: Delete machine part
 *     tags: [MachineParts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The part id
 *     responses:
 *       200:
 *         description: The part was deleted
 */
router.delete('/:id', authenticateToken, machinePartController.deleteMachinePart);

module.exports = router;
