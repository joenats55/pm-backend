const express = require('express');
const { authenticateToken } = require('../middlewares/auth');
const { uploadPMPhotos, handleUploadError } = require('../middlewares/upload');
const pmScheduleController = require('../controllers/pmSchedule.controller');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PMSchedule:
 *       type: object
 *       required:
 *         - machineId
 *         - templateId
 *         - scheduledDate
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the schedule
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
 *         status:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED, OVERDUE]
 *           description: The status of the schedule
 *         assignedTo:
 *           type: string
 *           description: The ID of the user assigned to this schedule
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the schedule was created
 *       example:
 *         id: "uuid-string"
 *         machineId: "machine-uuid"
 *         templateId: "template-uuid"
 *         scheduledDate: "2023-12-01T09:00:00Z"
 *         status: "PENDING"
 */

/**
 * @swagger
 * tags:
 *   name: PMSchedules
 *   description: The PM schedules managing API
 */

// GET /api/pm-schedules - Get all PM schedules
/**
 * @swagger
 * /pm-schedules:
 *   get:
 *     summary: Get all PM schedules
 *     tags: [PMSchedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: machineId
 *         schema:
 *           type: string
 *         description: Filter by machine ID
 *     responses:
 *       200:
 *         description: List of all PM schedules
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PMSchedule'
 */
router.get('/', authenticateToken, pmScheduleController.getAllPMSchedules);

// GET /api/pm-schedules/stats/dashboard - Get dashboard statistics
/**
 * @swagger
 * /pm-schedules/stats/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [PMSchedules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/stats/dashboard', authenticateToken, pmScheduleController.getDashboardStats);

// GET /api/pm-schedules/:id - Get PM schedule by ID
/**
 * @swagger
 * /pm-schedules/{id}:
 *   get:
 *     summary: Get PM schedule by ID
 *     tags: [PMSchedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The schedule id
 *     responses:
 *       200:
 *         description: The schedule description
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PMSchedule'
 *       404:
 *         description: The schedule was not found
 */
router.get('/:id', authenticateToken, pmScheduleController.getPMScheduleById);

// GET /api/pm-schedules/:id/history - Get execution history for PM schedule
/**
 * @swagger
 * /pm-schedules/{id}/history:
 *   get:
 *     summary: Get execution history for PM schedule
 *     tags: [PMSchedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The schedule id
 *     responses:
 *       200:
 *         description: Execution history
 */
router.get('/:id/history', authenticateToken, pmScheduleController.getExecutionHistory);

// POST /api/pm-schedules - Create new PM schedule
/**
 * @swagger
 * /pm-schedules:
 *   post:
 *     summary: Create new PM schedule
 *     tags: [PMSchedules]
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
 *               - templateId
 *               - scheduledDate
 *             properties:
 *               machineId:
 *                 type: string
 *               templateId:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               assignedTo:
 *                 type: string
 *     responses:
 *       201:
 *         description: The schedule was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PMSchedule'
 */
router.post('/', authenticateToken, pmScheduleController.createPMSchedule);

// PUT /api/pm-schedules/:id - Update PM schedule
/**
 * @swagger
 * /pm-schedules/{id}:
 *   put:
 *     summary: Update PM schedule
 *     tags: [PMSchedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The schedule id
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               assignedTo:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: The schedule was updated
 */
router.put('/:id', authenticateToken, pmScheduleController.updatePMSchedule);

// DELETE /api/pm-schedules/:id - Delete PM schedule
/**
 * @swagger
 * /pm-schedules/{id}:
 *   delete:
 *     summary: Delete PM schedule
 *     tags: [PMSchedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The schedule id
 *     responses:
 *       200:
 *         description: The schedule was deleted
 */
router.delete('/:id', authenticateToken, pmScheduleController.deletePMSchedule);

// POST /api/pm-schedules/:id/start - Start PM schedule execution
/**
 * @swagger
 * /pm-schedules/{id}/start:
 *   post:
 *     summary: Start PM schedule execution
 *     tags: [PMSchedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The schedule id
 *     responses:
 *       200:
 *         description: Schedule execution started
 */
router.post('/:id/start', authenticateToken, pmScheduleController.startPMSchedule);

// POST /api/pm-schedules/:id/step - Save individual PM step result
/**
 * @swagger
 * /pm-schedules/{id}/step:
 *   post:
 *     summary: Save individual PM step result
 *     tags: [PMSchedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The schedule id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stepId
 *               - status
 *             properties:
 *               stepId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [PASS, FAIL, N/A]
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Step result saved
 */
router.post('/:id/step', authenticateToken, pmScheduleController.savePMStepResult);

// POST /api/pm-schedules/:id/execute - Execute PM schedule
/**
 * @swagger
 * /pm-schedules/{id}/execute:
 *   post:
 *     summary: Execute PM schedule (bulk update)
 *     tags: [PMSchedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The schedule id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - results
 *             properties:
 *               results:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Schedule executed
 */
router.post('/:id/execute', authenticateToken, pmScheduleController.executePMSchedule);

// POST /api/pm-schedules/:id/complete - Complete PM schedule execution
/**
 * @swagger
 * /pm-schedules/{id}/complete:
 *   post:
 *     summary: Complete PM schedule execution
 *     tags: [PMSchedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The schedule id
 *     responses:
 *       200:
 *         description: Schedule completed
 */
router.post('/:id/complete', authenticateToken, pmScheduleController.completePMSchedule);

// Photo management routes for PM Results
// POST /api/pm-schedules/results/:pmResultId/photos/upload - Upload actual image files
/**
 * @swagger
 * /pm-schedules/results/{pmResultId}/photos/upload:
 *   post:
 *     summary: Upload actual image files for PM result
 *     tags: [PMSchedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pmResultId
 *         schema:
 *           type: string
 *         required: true
 *         description: The PM result id
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
 *               photoType:
 *                 type: string
 *                 default: evidence
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Photos uploaded successfully
 */
router.post('/results/:pmResultId/photos/upload', 
  authenticateToken, 
  uploadPMPhotos,
  handleUploadError,
  async (req, res) => {
    try {
      const { pmResultId } = req.params;
      const { photoType = 'evidence', description } = req.body;
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No images uploaded'
        });
      }

      // Transform uploaded files to photo objects
      const photos = req.files.map(file => ({
        url: `/uploads/pm-photos/${file.filename}`,
        type: photoType,
        fileName: file.originalname,
        fileSize: file.size,
        description: description || null
      }));

      // Create a mock request/response for the controller
      const mockReq = {
        params: { pmResultId },
        body: { photos },
        user: req.user
      };

      const mockRes = {
        status: (code) => ({
          json: (data) => res.status(code).json(data)
        })
      };

      await pmScheduleController.uploadPMResultPhotos(mockReq, mockRes);
    } catch (error) {
      console.error('Error in photo upload route:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// POST /api/pm-schedules/results/:pmResultId/photos - Upload photos for PM Result (JSON data)
/**
 * @swagger
 * /pm-schedules/results/{pmResultId}/photos:
 *   post:
 *     summary: Upload photos for PM Result (JSON data)
 *     tags: [PMSchedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pmResultId
 *         schema:
 *           type: string
 *         required: true
 *         description: The PM result id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - photos
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     type:
 *                       type: string
 *     responses:
 *       200:
 *         description: Photos uploaded successfully
 */
router.post('/results/:pmResultId/photos', 
  authenticateToken, 
  pmScheduleController.uploadPMResultPhotos
);

// GET /api/pm-schedules/results/:pmResultId/photos - Get photos for PM Result
/**
 * @swagger
 * /pm-schedules/results/{pmResultId}/photos:
 *   get:
 *     summary: Get photos for PM Result
 *     tags: [PMSchedules]
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
 *       200:
 *         description: List of photos
 */
router.get('/results/:pmResultId/photos', 
  authenticateToken, 
  pmScheduleController.getPMResultPhotos
);

// PUT /api/pm-schedules/results/:pmResultId/photos - Update before/after photos arrays
/**
 * @swagger
 * /pm-schedules/results/{pmResultId}/photos:
 *   put:
 *     summary: Update before/after photos arrays
 *     tags: [PMSchedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pmResultId
 *         schema:
 *           type: string
 *         required: true
 *         description: The PM result id
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               beforePhotos:
 *                 type: array
 *                 items:
 *                   type: string
 *               afterPhotos:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Photos updated successfully
 */
router.put('/results/:pmResultId/photos', 
  authenticateToken, 
  pmScheduleController.updatePMResultPhotos
);

// DELETE /api/pm-schedules/results/photos/:photoId - Delete PM Result photo
/**
 * @swagger
 * /pm-schedules/results/photos/{photoId}:
 *   delete:
 *     summary: Delete PM Result photo
 *     tags: [PMSchedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: photoId
 *         schema:
 *           type: string
 *         required: true
 *         description: The photo id
 *     responses:
 *       200:
 *         description: Photo deleted successfully
 */
router.delete('/results/photos/:photoId', 
  authenticateToken, 
  pmScheduleController.deletePMResultPhoto
);

module.exports = router;