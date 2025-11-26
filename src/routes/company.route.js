const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const { authenticateToken } = require('../middlewares/auth');
const { authorizeRole } = require('../middlewares/authorizeRole');

/**
 * @swagger
 * components:
 *   schemas:
 *     Company:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the company
 *         name:
 *           type: string
 *           description: The name of the company
 *         address:
 *           type: string
 *           description: The address of the company
 *         phone:
 *           type: string
 *           description: The phone number of the company
 *         email:
 *           type: string
 *           description: The email of the company
 *         taxId:
 *           type: string
 *           description: The tax ID of the company
 *         isActive:
 *           type: boolean
 *           description: The status of the company
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the company was added
 *       example:
 *         id: 1
 *         name: "ABC Company"
 *         address: "123 Main St"
 *         phone: "02-123-4567"
 *         email: "contact@abc.com"
 *         taxId: "1234567890123"
 *         isActive: true
 */

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: The companies managing API
 */

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /companies:
 *   get:
 *     summary: Returns the list of all the companies
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name
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
 *         description: The list of the companies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Company'
 */
router.get('/', 
  authorizeRole('ADMIN'),
  companyController.getAllCompanies
);

/**
 * @swagger
 * /companies/stats:
 *   get:
 *     summary: Get company statistics
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company statistics
 */
router.get('/stats',
  authorizeRole('ADMIN'),
  companyController.getCompanyStats
);

/**
 * @swagger
 * /companies/sync:
 *   post:
 *     summary: Sync companies from external API
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Companies synced successfully
 */
router.post('/sync',
  authorizeRole('ADMIN'),
  companyController.syncCompanies
);

/**
 * @swagger
 * /companies/{id}:
 *   get:
 *     summary: Get the company by id
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The company id
 *     responses:
 *       200:
 *         description: The company description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       404:
 *         description: The company was not found
 */
router.get('/:id',
  authorizeRole('ADMIN'),
  companyController.getCompanyById
);

/**
 * @swagger
 * /companies:
 *   post:
 *     summary: Create a new company
 *     tags: [Companies]
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
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               taxId:
 *                 type: string
 *     responses:
 *       201:
 *         description: The company was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       400:
 *         description: Missing required fields or invalid data
 */
router.post('/',
  authorizeRole('ADMIN'),
  companyController.createCompany
);

/**
 * @swagger
 * /companies/{id}:
 *   put:
 *     summary: Update the company by the id
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The company id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               taxId:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: The company was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       404:
 *         description: The company was not found
 *       400:
 *         description: Some error happened
 */
router.put('/:id',
  authorizeRole('ADMIN'),
  companyController.updateCompany
);

/**
 * @swagger
 * /companies/{id}:
 *   delete:
 *     summary: Remove the company by id
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The company id
 *     responses:
 *       200:
 *         description: The company was deleted
 *       404:
 *         description: The company was not found
 */
router.delete('/:id',
  authorizeRole('ADMIN'),
  companyController.deleteCompany
);

module.exports = router;