const pmTemplateService = require('../services/pmTemplate.service');

class PMTemplateController {
  // GET /api/pm-templates - Get all PM templates
  async getAllPMTemplates(req, res) {
    try {
      const { 
        search,
        machineType,
        frequencyType,
        isActive,
        page = 1,
        limit = 10
      } = req.query;

      const result = await pmTemplateService.getAllPMTemplates({
        search,
        machineType,
        frequencyType,
        isActive,
        page,
        limit
      });

      res.status(200).json({
        success: true,
        data: result.templates,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error fetching PM templates:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /api/pm-templates/:id - Get PM template by ID
  async getPMTemplateById(req, res) {
    try {
      const { id } = req.params;
      const template = await pmTemplateService.getPMTemplateById(id);

      res.status(200).json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error fetching PM template:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // POST /api/pm-templates - Create new PM template
  async createPMTemplate(req, res) {
    try {
      const {
        name,
        description,
        category,
        frequencyType,
        frequencyValue,
        durationMinutes,
        isActive = true,
        items = []
      } = req.body;

      const template = await pmTemplateService.createPMTemplate({
        name,
        description,
        machineType: category, // Map category to machineType for backward compatibility
        frequencyType,
        frequencyValue,
        durationMinutes,
        isActive,
        items,
        createdBy: req.user.id // Add user ID from auth middleware
      });

      // Generate notification about the creation
      const notification = await pmTemplateService.notifyTemplateUpdate('created', template, req.user.id);

      res.status(201).json({
        success: true,
        data: template,
        notification: notification,
        message: 'PM template created successfully'
      });
    } catch (error) {
      console.error('Error creating PM template:', error);
      const statusCode = error.message.includes('required') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // PUT /api/pm-templates/:id - Update PM template
  async updatePMTemplate(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        machineType,
        frequencyType,
        frequencyValue,
        durationMinutes,
        isActive,
        items = []
      } = req.body;

      const template = await pmTemplateService.updatePMTemplate(id, {
        name,
        description,
        machineType,
        frequencyType,
        frequencyValue,
        durationMinutes,
        isActive,
        items
      });

      // Generate notification about the update
      const notification = await pmTemplateService.notifyTemplateUpdate('updated', template, req.user.id);

      res.status(200).json({
        success: true,
        data: template,
        notification: notification,
        message: 'PM template updated successfully'
      });
    } catch (error) {
      console.error('Error updating PM template:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // DELETE /api/pm-templates/:id - Delete PM template
  async deletePMTemplate(req, res) {
    try {
      const { id } = req.params;
      
      // Get template info before deletion for notification
      const template = await pmTemplateService.getPMTemplateById(id);
      
      const result = await pmTemplateService.deletePMTemplate(id);

      // Generate notification about the deletion
      const notification = await pmTemplateService.notifyTemplateUpdate('deleted', template, req.user.id);

      res.status(200).json({
        success: true,
        message: result.message,
        notification: notification
      });
    } catch (error) {
      console.error('Error deleting PM template:', error);
      const statusCode = error.message.includes('not found') ? 404 : 
                       error.message.includes('Cannot delete') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /api/pm-templates/categories - Get PM template categories
  async getPMTemplateCategories(req, res) {
    try {
      const categories = await pmTemplateService.getPMTemplateCategories();

      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error fetching PM template categories:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /api/pm-templates/stats/dashboard - Get PM template statistics
  async getPMTemplateStats(req, res) {
    try {
      const stats = await pmTemplateService.getPMTemplateStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching PM template statistics:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new PMTemplateController();
