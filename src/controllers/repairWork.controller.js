const repairWorkService = require('../services/repairWork.service');

class RepairWorkController {
  // GET /api/repair-works - Get all repair works with filtering
  async getAllRepairWorks(req, res) {
    try {
      const {
        status,
        excludeStatus,
        priority,
        machineId,
        assignedTo,
        reportedBy,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filters = {
        status,
        excludeStatus,
        priority,
        machineId,
        assignedTo,
        reportedBy
      };

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder
      };

      const result = await repairWorkService.getAllRepairWorks(filters, pagination);

      res.status(200).json({
        success: true,
        data: result.repairWorks,
        pagination: result.pagination,
        message: 'Repair works retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting repair works:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /api/repair-works/:id - Get repair work by ID
  async getRepairWorkById(req, res) {
    try {
      const { id } = req.params;
      const repairWork = await repairWorkService.getRepairWorkById(id);

      res.status(200).json({
        success: true,
        data: repairWork,
        message: 'Repair work retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting repair work:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // POST /api/repair-works - Create new repair work
  async createRepairWork(req, res) {
    try {
      const {
        title,
        description,
        machineId,
        pmScheduleId,
        pmResultId,
        priority = 'MEDIUM',
        estimatedHours,
        estimatedCost,
        items = []
      } = req.body;

      const repairWorkData = {
        title,
        description,
        machineId,
        pmScheduleId,
        pmResultId,
        priority,
        estimatedHours,
        estimatedCost,
        reportedBy: req.user.id,
        items
      };

      const repairWork = await repairWorkService.createRepairWork(repairWorkData);

      res.status(201).json({
        success: true,
        data: repairWork,
        message: 'Repair work created successfully'
      });
    } catch (error) {
      console.error('Error creating repair work:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // PUT /api/repair-works/:id - Update repair work
  async updateRepairWork(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const repairWork = await repairWorkService.updateRepairWork(id, updateData);

      res.status(200).json({
        success: true,
        data: repairWork,
        message: 'Repair work updated successfully'
      });
    } catch (error) {
      console.error('Error updating repair work:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // POST /api/repair-works/:id/assign - Assign repair work to technician
  async assignRepairWork(req, res) {
    try {
      const { id } = req.params;
      const { assignedTo } = req.body;

  const repairWork = await repairWorkService.assignRepairWork(id, assignedTo, req.user?.id);

      res.status(200).json({
        success: true,
        data: repairWork,
        message: 'Repair work assigned successfully'
      });
    } catch (error) {
      console.error('Error assigning repair work:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // POST /api/repair-works/:id/assign/bulk - Assign multiple technicians
  async assignRepairWorkBulk(req, res) {
    try {
      const { id } = req.params;
      const { technicianIds } = req.body; // array
      
      if (!Array.isArray(technicianIds)) {
        return res.status(400).json({ success: false, message: 'technicianIds array required' });
      }

      // If empty array, unassign all
      if (technicianIds.length === 0) {
        const repairWork = await repairWorkService.unassignAllRepairWork(id);
        return res.status(200).json({ success: true, data: repairWork, message: 'All technicians unassigned successfully' });
      }

      // Assign first as primary then others
      const first = technicianIds[0];
      await repairWorkService.assignRepairWork(id, first, req.user?.id);
      for (let i = 1; i < technicianIds.length; i++) {
        try { await repairWorkService.assignRepairWork(id, technicianIds[i], req.user?.id); } catch(e){ /* ignore individual errors */ }
      }
      const repairWork = await repairWorkService.getRepairWorkById(id);
      res.status(200).json({ success: true, data: repairWork, message: 'Technicians assigned successfully' });
    } catch (error) {
      console.error('Error bulk assigning repair work:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  // POST /api/repair-works/:id/start - Start repair work
  async startRepairWork(req, res) {
    try {
      const { id } = req.params;
      const repairWork = await repairWorkService.startRepairWork(id, req.user.id);

      res.status(200).json({
        success: true,
        data: repairWork,
        message: 'Repair work started successfully'
      });
    } catch (error) {
      console.error('Error starting repair work:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // POST /api/repair-works/:id/complete - Complete repair work
  async completeRepairWork(req, res) {
    try {
      const { id } = req.params;
      const {
        actualHours,
        actualCost,
        completionNotes,
  partsUsed = [],
  customerSignatureUrl,
  customerSignerName
      } = req.body;

      const completionData = {
        actualHours,
        actualCost,
        completionNotes,
        partsUsed,
  completedBy: req.user.id,
  customerSignatureUrl,
  customerSignerName
      };

      const repairWork = await repairWorkService.completeRepairWork(id, completionData);

      res.status(200).json({
        success: true,
        data: repairWork,
        message: 'Repair work completed successfully'
      });
    } catch (error) {
      console.error('Error completing repair work:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // POST /api/repair-works/:id/photos - Upload repair work photos
  async uploadRepairWorkPhotos(req, res) {
    try {
      const { id } = req.params;
  const { photoType, description, repairWorkItemId } = req.body;
      const photoFiles = req.files;

      if (!photoFiles || photoFiles.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No photos provided'
        });
      }

      const photos = await repairWorkService.uploadRepairWorkPhotos(
        id,
        photoFiles,
        photoType,
        description,
        req.user.id,
        repairWorkItemId || null
      );

      res.status(200).json({
        success: true,
        data: photos,
        message: 'Photos uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading photos:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // DELETE /api/repair-works/:id/photos/:photoId - Delete a photo
  async deleteRepairWorkPhoto(req, res) {
    try {
      const { id, photoId } = req.params;
      await repairWorkService.deleteRepairWorkPhoto(id, photoId);
      res.status(200).json({ success: true, message: 'Photo deleted successfully' });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  // GET /api/repair-works/:id/items/:itemId/photos - Get photos for item
  async getItemPhotos(req, res) {
    try {
      const { id, itemId } = req.params;
      const { photoType } = req.query;
      const photos = await repairWorkService.getItemPhotos(id, itemId, photoType || null);
      res.status(200).json({ success: true, data: photos, message: 'Item photos fetched' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /api/repair-works/from-pm/:pmResultId - Create repair work from PM result
  async createFromPMResult(req, res) {
    try {
      const { pmResultId } = req.params;
      const { title, description, priority = 'MEDIUM' } = req.body;

      const repairWorkData = {
        title,
        description,
        priority,
        reportedBy: req.user.id
      };

      const repairWork = await repairWorkService.createRepairWorkFromPMResult(
        pmResultId,
        repairWorkData
      );

      res.status(201).json({
        success: true,
        data: repairWork,
        message: 'Repair work created from PM result successfully'
      });
    } catch (error) {
      console.error('Error creating repair work from PM result:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // DELETE /api/repair-works/:id - Delete repair work
  async deleteRepairWork(req, res) {
    try {
      const { id } = req.params;
      await repairWorkService.deleteRepairWork(id);

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting repair work:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /api/repair-works/dashboard/stats - Get repair work statistics
  async getRepairWorkStats(req, res) {
    try {
      const { machineId, startDate, endDate } = req.query;
      const stats = await repairWorkService.getRepairWorkStats({
        machineId,
        startDate,
        endDate
      });

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Repair work statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting repair work stats:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // PATCH /api/repair-works/:id/items/:itemId - Update single repair work item
  async updateRepairWorkItem(req, res) {
    try {
      const { id, itemId } = req.params;
      const { remarks, status } = req.body;
      const updated = await repairWorkService.updateRepairWorkItem(id, itemId, { remarks, status }, req.user.id);
      res.status(200).json({
        success: true,
        data: updated,
        message: 'Repair work item updated successfully'
      });
    } catch (error) {
      console.error('Error updating repair work item:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new RepairWorkController();
