const express = require('express');
const router = express.Router();
const InventoryTransactionController = require('../controllers/inventoryTransaction.controller');
const { authenticateToken } = require('../middlewares/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     InventoryTransaction:
 *       type: object
 *       required:
 *         - partId
 *         - type
 *         - quantity
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the transaction
 *         partId:
 *           type: string
 *           description: The ID of the machine part
 *         type:
 *           type: string
 *           enum: [IN, OUT, ADJUSTMENT]
 *           description: The type of transaction
 *         quantity:
 *           type: integer
 *           description: The quantity involved in the transaction
 *         reference:
 *           type: string
 *           description: Reference document or reason
 *         performedBy:
 *           type: string
 *           description: The ID of the user who performed the transaction
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the transaction was created
 *       example:
 *         id: "uuid-string"
 *         partId: "part-uuid"
 *         type: "IN"
 *         quantity: 10
 *         reference: "PO-12345"
 */

/**
 * @swagger
 * tags:
 *   name: InventoryTransactions
 *   description: The inventory transactions managing API
 */

// Apply authentication to all routes
router.use(authenticateToken);

// Create a new inventory transaction
/**
 * @swagger
 * /inventory-transactions:
 *   post:
 *     summary: Create a new inventory transaction
 *     tags: [InventoryTransactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - partId
 *               - type
 *               - quantity
 *             properties:
 *               partId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [IN, OUT, ADJUSTMENT]
 *               quantity:
 *                 type: integer
 *               reference:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: The transaction was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryTransaction'
 */
router.post('/', InventoryTransactionController.createTransaction);

// Get all inventory transactions (with optional filters)
/**
 * @swagger
 * /inventory-transactions:
 *   get:
 *     summary: Get all inventory transactions
 *     tags: [InventoryTransactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: partId
 *         schema:
 *           type: string
 *         description: Filter by part ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by transaction type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: List of all inventory transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InventoryTransaction'
 */
router.get('/', InventoryTransactionController.getAllTransactions);

// Get transactions by part ID
/**
 * @swagger
 * /inventory-transactions/part/{partId}:
 *   get:
 *     summary: Get transactions by part ID
 *     tags: [InventoryTransactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partId
 *         schema:
 *           type: string
 *         required: true
 *         description: The part id
 *     responses:
 *       200:
 *         description: List of transactions for the part
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InventoryTransaction'
 */
router.get('/part/:partId', InventoryTransactionController.getTransactionsByPartId);

// Get inventory summary by part
/**
 * @swagger
 * /inventory-transactions/summary/{partId}:
 *   get:
 *     summary: Get inventory summary by part
 *     tags: [InventoryTransactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partId
 *         schema:
 *           type: string
 *         required: true
 *         description: The part id
 *     responses:
 *       200:
 *         description: Inventory summary
 */
router.get('/summary/:partId', InventoryTransactionController.getInventorySummary);

// Get comprehensive audit report (must be before /:id route)
/**
 * @swagger
 * /inventory-transactions/audit-report:
 *   get:
 *     summary: Get comprehensive audit report
 *     tags: [InventoryTransactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit report
 */
router.get('/audit-report', InventoryTransactionController.getAuditReport);

// Get transaction by ID
/**
 * @swagger
 * /inventory-transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [InventoryTransactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The transaction id
 *     responses:
 *       200:
 *         description: The transaction description
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryTransaction'
 *       404:
 *         description: The transaction was not found
 */
router.get('/:id', InventoryTransactionController.getTransactionById);

// Update inventory transaction
/**
 * @swagger
 * /inventory-transactions/{id}:
 *   put:
 *     summary: Update inventory transaction
 *     tags: [InventoryTransactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The transaction id
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *               reference:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: The transaction was updated
 */
router.put('/:id', InventoryTransactionController.updateTransaction);

// Delete inventory transaction
/**
 * @swagger
 * /inventory-transactions/{id}:
 *   delete:
 *     summary: Delete inventory transaction
 *     tags: [InventoryTransactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The transaction id
 *     responses:
 *       200:
 *         description: The transaction was deleted
 */
router.delete('/:id', InventoryTransactionController.deleteTransaction);

// Quick stock adjustment (for +/- buttons)
/**
 * @swagger
 * /inventory-transactions/quick-adjustment:
 *   post:
 *     summary: Quick stock adjustment
 *     tags: [InventoryTransactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - partId
 *               - type
 *               - quantity
 *             properties:
 *               partId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [IN, OUT]
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Stock adjusted
 */
router.post('/quick-adjustment', InventoryTransactionController.quickStockAdjustment);

module.exports = router;
