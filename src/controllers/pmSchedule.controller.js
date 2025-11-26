const pmScheduleService = require('../services/pmSchedule.service');

class PMScheduleController {
  // GET /api/pm-schedules - Get all PM schedules
  async getAllPMSchedules(req, res) {
    try {
      const { 
        machineId, 
        pmTemplateId, 
        status, 
        priority, 
        dueDateFrom, 
        dueDateTo, 
        assignedTo, 
        search,
        page = 1,
        limit = 10,
        sortBy,
        sortOrder
      } = req.query;

      const result = await pmScheduleService.getAllPMSchedules({
        machineId, 
        pmTemplateId, 
        status, 
        priority, 
        dueDateFrom, 
        dueDateTo, 
        assignedTo, 
        search,
        page,
        limit,
        sortBy,
        sortOrder,
        requestingUser: req.user // Pass user info for role-based filtering
      });

      res.status(200).json({
        success: true,
        data: result.schedules,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error fetching PM schedules:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /api/pm-schedules/:id - Get PM schedule by ID
  async getPMScheduleById(req, res) {
    try {
      const { id } = req.params;
      const schedule = await pmScheduleService.getPMScheduleById(id);

      res.status(200).json({
        success: true,
        data: schedule
      });
    } catch (error) {
      console.error('Error fetching PM schedule:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /api/pm-schedules/:id/history - Get execution history for PM schedule
  async getExecutionHistory(req, res) {
    try {
      const { id } = req.params;
      const history = await pmScheduleService.getExecutionHistory(id);

      res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Error fetching execution history:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // POST /api/pm-schedules - Create new PM schedule
  async createPMSchedule(req, res) {
    try {
      const {
        pmTemplateId,
        machineId,
        scheduleCode,
        nextDueDate,
        priority = 'medium',
        assignedTo,
        remarks,
        estimatedHours
      } = req.body;

      const schedule = await pmScheduleService.createPMSchedule({
        pmTemplateId,
        machineId,
        scheduleCode,
        nextDueDate,
        priority,
        assignedTo,
        remarks,
        estimatedHours
      });

      res.status(201).json({
        success: true,
        data: schedule,
        message: 'PM schedule created successfully'
      });
    } catch (error) {
      console.error('Error creating PM schedule:', error);
      const statusCode = error.message.includes('required') || error.message.includes('not found') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // PUT /api/pm-schedules/:id - Update PM schedule
  async updatePMSchedule(req, res) {
    try {
      const { id } = req.params;
      const {
        scheduledDate,
        nextDueDate, // เพิ่มฟิลด์ nextDueDate
        priority,
        assignedTo,
        assignedBy, // เพิ่มฟิลด์ assignedBy
        notes,
        remarks, // เพิ่มฟิลด์ remarks
        estimatedHours, // เพิ่มฟิลด์ estimatedHours
        status
      } = req.body;

      const schedule = await pmScheduleService.updatePMSchedule(id, {
        scheduledDate,
        nextDueDate,
        priority,
        assignedTo,
        assignedBy,
        notes,
        remarks,
        estimatedHours,
        status
      });

      res.status(200).json({
        success: true,
        data: schedule,
        message: 'PM schedule updated successfully'
      });
    } catch (error) {
      console.error('Error updating PM schedule:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // DELETE /api/pm-schedules/:id - Delete PM schedule
  async deletePMSchedule(req, res) {
    try {
      const { id } = req.params;
      const result = await pmScheduleService.deletePMSchedule(id);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error deleting PM schedule:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // POST /api/pm-schedules/:id/start - Start PM schedule execution
  async startPMSchedule(req, res) {
    try {
      const { id } = req.params;
      const schedule = await pmScheduleService.startPMSchedule(id, req.user?.id);

      res.status(200).json({
        success: true,
        data: schedule,
        message: 'PM execution started successfully'
      });
    } catch (error) {
      console.error('Error starting PM schedule:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // POST /api/pm-schedules/:id/step - Save individual PM step result
  async savePMStepResult(req, res) {
    try {
      const { id } = req.params;
      const {
        pmTemplateItemId,
        result,
        measuredValue,
        remarks,
        beforePhotos = [],
        afterPhotos = [],
        stepOrder
      } = req.body;

      const stepResult = await pmScheduleService.savePMStepResult(id, {
        pmTemplateItemId,
        result,
        measuredValue,
        remarks,
        beforePhotos,
        afterPhotos,
        stepOrder
      }, req.user?.id);

      res.status(200).json({
        success: true,
        data: stepResult,
        message: 'PM step result saved successfully'
      });
    } catch (error) {
      console.error('Error saving PM step result:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // POST /api/pm-schedules/:id/execute - Execute PM schedule
  async executePMSchedule(req, res) {
    try {
      const { id } = req.params;
      const {
        results,
        overallStatus,
        executorNotes,
        actualDurationMinutes,
        completedAt = new Date()
      } = req.body;

      const schedule = await pmScheduleService.executePMSchedule(id, {
        results,
        overallStatus,
        executorNotes,
        actualDurationMinutes,
        completedAt
      }, req.user?.id);

      res.status(200).json({
        success: true,
        data: schedule,
        message: 'PM execution completed successfully'
      });
    } catch (error) {
      console.error('Error executing PM schedule:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /api/pm-schedules/stats/dashboard - Get dashboard statistics
  async getDashboardStats(req, res) {
    try {
      const stats = await pmScheduleService.getDashboardStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching PM schedule statistics:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // POST /api/pm-schedules/results/:pmResultId/photos - Upload photos for PM Result
  async uploadPMResultPhotos(req, res) {
    try {
      const { pmResultId } = req.params;
      const { photos } = req.body; // Array of photo objects with url, type, fileName, etc.

      if (!photos || !Array.isArray(photos) || photos.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Photos array is required'
        });
      }

      const result = await pmScheduleService.uploadPMResultPhotos(pmResultId, photos, req.user?.id);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Photos uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading PM result photos:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /api/pm-schedules/results/:pmResultId/photos - Get photos for PM Result
  async getPMResultPhotos(req, res) {
    try {
      const { pmResultId } = req.params;
      const { type } = req.query; // Optional filter by photo type

      const photos = await pmScheduleService.getPMResultPhotos(pmResultId, type);

      res.status(200).json({
        success: true,
        data: photos
      });
    } catch (error) {
      console.error('Error fetching PM result photos:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // DELETE /api/pm-schedules/results/photos/:photoId - Delete PM Result photo
  async deletePMResultPhoto(req, res) {
    try {
      const { photoId } = req.params;

      const result = await pmScheduleService.deletePMResultPhoto(photoId, req.user?.id);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Photo deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting PM result photo:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // PUT /api/pm-schedules/results/:pmResultId/photos - Update before/after photos arrays
  async updatePMResultPhotos(req, res) {
    try {
      const { pmResultId } = req.params;
      const { beforePhotos = [], afterPhotos = [] } = req.body;

      const result = await pmScheduleService.updatePMResultPhotos(pmResultId, beforePhotos, afterPhotos);

      res.status(200).json({
        success: true,
        data: result,
        message: 'PM result photos updated successfully'
      });
    } catch (error) {
      console.error('Error updating PM result photos:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // POST /api/pm-schedules/:id/complete - Complete PM schedule execution
  async completePMSchedule(req, res) {
    try {
      const { id } = req.params;
      const { results, overallStatus, actualDurationMinutes, completedAt, remarks, executorNotes, customerSignatureUrl, customerSignerName, customerSignatureDataUrl } = req.body;

      let finalSignatureUrl = customerSignatureUrl;
      // Fallback: if no uploaded URL but have base64 data URL, save server-side
      if (!finalSignatureUrl && customerSignatureDataUrl) {
        try {
          const dataUrlPattern = /^data:image\/(png|jpeg);base64,(.+)$/;
          const match = customerSignatureDataUrl.match(dataUrlPattern);
            if (match) {
              const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
              const base64 = match[2];
              const buffer = Buffer.from(base64, 'base64');
              const fs = require('fs');
              const path = require('path');
              const dir = path.join(__dirname, '../../uploads/signatures');
              if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
              const filename = `sig-${Date.now()}-${Math.round(Math.random()*1e6)}.${ext}`;
              const filePath = path.join(dir, filename);
              fs.writeFileSync(filePath, buffer);
              finalSignatureUrl = `/uploads/signatures/${filename}`;
              console.log('Generated signature file from base64:', filename);
            }
        } catch (sigErr) {
          console.error('Failed to persist base64 signature:', sigErr);
        }
      }

      const completionData = {
        results,
        overallStatus,
        actualDurationMinutes,
        completedAt,
        remarks: executorNotes || remarks, // Support both field names
  completedBy: req.user?.id,
        customerSignatureUrl: finalSignatureUrl || undefined,
  customerSignerName: customerSignerName || undefined,
        customerSignedAt: finalSignatureUrl ? new Date() : undefined
      };

      // Enforce signature requirement
      if (!completionData.customerSignatureUrl || !completionData.customerSignerName) {
        return res.status(400).json({
          success: false,
          message: 'Customer signature (image & name) is required to complete PM.'
        });
      }

      const result = await pmScheduleService.completePMSchedule(id, completionData);

      // Prepare response message based on whether next schedule was created
      let message = 'PM schedule completed successfully';
      if (result.nextSchedule) {
        const nextDueDate = new Date(result.nextSchedule.nextDueDate).toLocaleDateString('th-TH');
        message += `. Next PM schedule created: ${result.nextSchedule.scheduleCode} (Due: ${nextDueDate})`;
      }

      res.status(200).json({
        success: true,
        data: result,
        message: message
      });
    } catch (error) {
      console.error('Error completing PM schedule:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new PMScheduleController();
