const express = require('express');
const router = express.Router();
const machineDocumentController = require('../controllers/machineDocument.controller');
const { uploadSingleDocument, handleUploadError } = require('../middlewares/upload');
const { authenticateToken } = require('../middlewares/auth');
const { authorizeRole } = require('../middlewares/authorizeRole');

/**
 * @swagger
 * components:
 *   schemas:
 *     MachineDocument:
 *       type: object
 *       required:
 *         - machineId
 *         - fileName
 *         - fileUrl
 *         - type
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the document
 *         machineId:
 *           type: string
 *           description: The ID of the machine
 *         fileName:
 *           type: string
 *           description: The name of the file
 *         fileUrl:
 *           type: string
 *           description: The URL of the file
 *         fileType:
 *           type: string
 *           description: The MIME type of the file
 *         fileSize:
 *           type: integer
 *           description: The size of the file in bytes
 *         type:
 *           type: string
 *           enum: [MANUAL, DIAGRAM, WARRANTY, REPORT, OTHER]
 *           description: The type of the document
 *         description:
 *           type: string
 *           description: The description of the document
 *         uploadedBy:
 *           type: string
 *           description: The ID of the user who uploaded the document
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the document was uploaded
 *       example:
 *         id: "uuid-string"
 *         machineId: "machine-uuid"
 *         fileName: "manual.pdf"
 *         fileUrl: "/uploads/manual.pdf"
 *         type: "MANUAL"
 */

/**
 * @swagger
 * tags:
 *   name: MachineDocuments
 *   description: The machine documents managing API
 */

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /machine-documents/machine/{machineId}:
 *   get:
 *     summary: Get all documents for a machine
 *     tags: [MachineDocuments]
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
 *         description: List of documents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MachineDocument'
 */
router.get('/machine/:machineId',
  authorizeRole('ADMIN', 'TECHNICIAN', 'CUSTOMER'),
  machineDocumentController.getMachineDocuments
);

/**
 * @swagger
 * /machine-documents/machine/{machineId}/type/{type}:
 *   get:
 *     summary: Get documents by type
 *     tags: [MachineDocuments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: machineId
 *         schema:
 *           type: string
 *         required: true
 *         description: The machine id
 *       - in: path
 *         name: type
 *         schema:
 *           type: string
 *           enum: [MANUAL, DIAGRAM, WARRANTY, REPORT, OTHER]
 *         required: true
 *         description: The document type
 *     responses:
 *       200:
 *         description: List of documents
 */
router.get('/machine/:machineId/type/:type',
  authorizeRole('ADMIN', 'TECHNICIAN', 'CUSTOMER'),
  machineDocumentController.getDocumentsByType
);

/**
 * @swagger
 * /machine-documents/machine/{machineId}/stats:
 *   get:
 *     summary: Get document statistics
 *     tags: [MachineDocuments]
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
 *         description: Document statistics
 */
router.get('/machine/:machineId/stats',
  authorizeRole('ADMIN', 'TECHNICIAN', 'CUSTOMER'),
  machineDocumentController.getDocumentStats
);

/**
 * @swagger
 * /machine-documents/{id}:
 *   get:
 *     summary: Get document by ID
 *     tags: [MachineDocuments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The document id
 *     responses:
 *       200:
 *         description: The document description
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MachineDocument'
 *       404:
 *         description: The document was not found
 */
router.get('/:id',
  authorizeRole('ADMIN', 'TECHNICIAN', 'CUSTOMER'),
  machineDocumentController.getDocumentById
);

/**
 * @swagger
 * /machine-documents/machine/{machineId}/upload:
 *   post:
 *     summary: Upload new document
 *     tags: [MachineDocuments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: machineId
 *         schema:
 *           type: string
 *         required: true
 *         description: The machine id
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - document
 *               - type
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *               type:
 *                 type: string
 *                 enum: [MANUAL, DIAGRAM, WARRANTY, REPORT, OTHER]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MachineDocument'
 */
router.post('/machine/:machineId/upload',
  authorizeRole('ADMIN', 'TECHNICIAN'),
  uploadSingleDocument,
  handleUploadError,
  machineDocumentController.uploadDocument
);

/**
 * @swagger
 * /machine-documents/{id}:
 *   put:
 *     summary: Update document metadata
 *     tags: [MachineDocuments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The document id
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [MANUAL, DIAGRAM, WARRANTY, REPORT, OTHER]
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document updated successfully
 */
router.put('/:id',
  authorizeRole('ADMIN', 'TECHNICIAN'),
  machineDocumentController.updateDocument
);

/**
 * @swagger
 * /machine-documents/{id}:
 *   delete:
 *     summary: Delete document
 *     tags: [MachineDocuments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The document id
 *     responses:
 *       200:
 *         description: Document deleted successfully
 */
router.delete('/:id',
  authorizeRole('ADMIN'),
  machineDocumentController.deleteDocument
);

/**
 * @swagger
 * /machine-documents/{id}/download:
 *   get:
 *     summary: Download document
 *     tags: [MachineDocuments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The document id
 *     responses:
 *       200:
 *         description: File download
 */
router.get('/:id/download',
  authorizeRole('ADMIN', 'TECHNICIAN', 'CUSTOMER'),
  machineDocumentController.downloadDocument
);

module.exports = router;
