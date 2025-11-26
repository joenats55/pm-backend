const express = require('express');
const { authenticateToken } = require('../middlewares/auth');
const historyController = require('../controllers/history.controller');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     History:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the history item
 *         machineId:
 *           type: string
 *           description: The ID of the machine
 *         templateId:
 *           type: string
 *           description: The ID of the PM template
 *         scheduledDate:
 *           type: string
 *           format: date-time
 *           description: The scheduled date
 *         completedDate:
 *           type: string
 *           format: date-time
 *           description: The date the schedule was completed
 *         status:
 *           type: string
 *           enum: [COMPLETED]
 *           description: The status of the schedule
 *         assignedTo:
 *           type: string
 *           description: The ID of the user assigned to this schedule
 *       example:
 *         id: "uuid-string"
 *         machineId: "machine-uuid"
 *         templateId: "template-uuid"
 *         scheduledDate: "2023-12-01T09:00:00Z"
 *         completedDate: "2023-12-01T11:00:00Z"
 *         status: "COMPLETED"
 */

/**
 * @swagger
 * tags:
 *   name: History
 *   description: The history managing API
 */

// GET /api/history - Get completed PM schedule history
/**
 * @swagger
 * /history:
 *   get:
 *     summary: Get completed PM schedule history
 *     tags: [History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: machineId
 *         schema:
 *           type: string
 *         description: Filter by machine ID
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
 *         name: dueDateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by due date from
 *       - in: query
 *         name: dueDateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by due date to
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *         description: Filter by assigned user ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
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
 *         description: List of history items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/History'
 */
router.get('/', authenticateToken, historyController.getHistory);

// GET /api/history/stats - Get history statistics
/**
 * @swagger
 * /history/stats:
 *   get:
 *     summary: Get history statistics
 *     tags: [History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: machineId
 *         schema:
 *           type: string
 *         description: Filter by machine ID
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter by priority
 *       - in: query
 *         name: dueDateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by due date from
 *       - in: query
 *         name: dueDateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by due date to
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *         description: Filter by assigned user ID
 *     responses:
 *       200:
 *         description: History statistics
 */
router.get('/stats', authenticateToken, historyController.getHistoryStats);

// GET /api/history/machines - Get unique machines with completed history
/**
 * @swagger
 * /history/machines:
 *   get:
 *     summary: Get unique machines with completed history
 *     tags: [History]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of unique machines
 */
router.get('/machines', authenticateToken, historyController.getUniqueMachines);

// GET /api/history/technicians - Get unique technicians with completed history
/**
 * @swagger
 * /history/technicians:
 *   get:
 *     summary: Get unique technicians with completed history
 *     tags: [History]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of unique technicians
 */
router.get('/technicians', authenticateToken, historyController.getUniqueTechnicians);

module.exports = router;
