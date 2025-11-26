const express = require('express');
const { authenticateToken } = require('../middlewares/auth');
const pmTemplateController = require('../controllers/pmTemplate.controller');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * components:
 *   schemas:
 *     PMTemplate:
 *       type: object
 *       required:
 *         - name
 *         - frequency
 *         - machineType
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the template
 *         name:
 *           type: string
 *           description: The name of the template
 *         description:
 *           type: string
 *           description: The description of the template
 *         frequency:
 *           type: integer
 *           description: The frequency in days
 *         machineType:
 *           type: string
 *           description: The type of machine this template applies to
 *         estimatedDuration:
 *           type: integer
 *           description: Estimated duration in minutes
 *         checklist:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               task:
 *                 type: string
 *               required:
 *                 type: boolean
 *           description: List of checklist items
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the template was created
 *       example:
 *         id: "uuid-string"
 *         name: "Monthly Maintenance"
 *         frequency: 30
 *         machineType: "CNC"
 *         estimatedDuration: 60
 *         checklist: [{ "task": "Check oil level", "required": true }]
 */

/**
 * @swagger
 * tags:
 *   name: PMTemplates
 *   description: The PM templates managing API
 */

// GET /api/pm-templates - Get all PM templates
/**
 * @swagger
 * /pm-templates:
 *   get:
 *     summary: Get all PM templates
 *     tags: [PMTemplates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name
 *       - in: query
 *         name: machineType
 *         schema:
 *           type: string
 *         description: Filter by machine type
 *     responses:
 *       200:
 *         description: List of all PM templates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PMTemplate'
 */
router.get('/', authenticateToken, pmTemplateController.getAllPMTemplates);

// GET /api/pm-templates/categories - Get PM template categories
/**
 * @swagger
 * /pm-templates/categories:
 *   get:
 *     summary: Get PM template categories
 *     tags: [PMTemplates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories', authenticateToken, pmTemplateController.getPMTemplateCategories);

// GET /api/pm-templates/stats/dashboard - Get PM template statistics
/**
 * @swagger
 * /pm-templates/stats/dashboard:
 *   get:
 *     summary: Get PM template statistics
 *     tags: [PMTemplates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PM template statistics
 */
router.get('/stats/dashboard', authenticateToken, pmTemplateController.getPMTemplateStats);

// GET /api/pm-templates/machine-types/list - Get list of machine types
/**
 * @swagger
 * /pm-templates/machine-types/list:
 *   get:
 *     summary: Get list of machine types
 *     tags: [PMTemplates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of machine types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
router.get('/machine-types/list', authenticateToken, async (req, res) => {
  try {
    const machineTypes = await prisma.pMTemplate.findMany({
      where: {
        machineType: {
          not: null
        }
      },
      select: {
        machineType: true
      },
      distinct: ['machineType']
    });

    const machineTypeList = machineTypes
      .map(item => item.machineType)
      .filter(Boolean)
      .sort();

    res.json({
      success: true,
      data: machineTypeList
    });
  } catch (error) {
    console.error('Error fetching machine types:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/pm-templates/:id - Get PM template by ID
/**
 * @swagger
 * /pm-templates/{id}:
 *   get:
 *     summary: Get PM template by ID
 *     tags: [PMTemplates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The template id
 *     responses:
 *       200:
 *         description: The template description
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PMTemplate'
 *       404:
 *         description: The template was not found
 */
router.get('/:id', authenticateToken, pmTemplateController.getPMTemplateById);

// POST /api/pm-templates - Create new PM template
/**
 * @swagger
 * /pm-templates:
 *   post:
 *     summary: Create new PM template
 *     tags: [PMTemplates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - frequency
 *               - machineType
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               frequency:
 *                 type: integer
 *               machineType:
 *                 type: string
 *               estimatedDuration:
 *                 type: integer
 *               checklist:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: The template was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PMTemplate'
 */
router.post('/', authenticateToken, pmTemplateController.createPMTemplate);

// PUT /api/pm-templates/:id - Update PM template
/**
 * @swagger
 * /pm-templates/{id}:
 *   put:
 *     summary: Update PM template
 *     tags: [PMTemplates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The template id
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
 *               frequency:
 *                 type: integer
 *               machineType:
 *                 type: string
 *               estimatedDuration:
 *                 type: integer
 *               checklist:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: The template was updated
 */
router.put('/:id', authenticateToken, pmTemplateController.updatePMTemplate);

// DELETE /api/pm-templates/:id - Delete PM template
/**
 * @swagger
 * /pm-templates/{id}:
 *   delete:
 *     summary: Delete PM template
 *     tags: [PMTemplates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The template id
 *     responses:
 *       200:
 *         description: The template was deleted
 */
router.delete('/:id', authenticateToken, pmTemplateController.deletePMTemplate);

module.exports = router;
