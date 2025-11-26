const companyService = require('../services/company.service');

class CompanyController {
  // Get all companies
  async getAllCompanies(req, res) {
    try {
      const { search, page, limit } = req.query;
      const result = await companyService.getAllCompanies({ search, page, limit });
      
      res.status(200).json({
        success: true,
        data: result.companies,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get company by ID
  async getCompanyById(req, res) {
    try {
      const { id } = req.params;
      const company = await companyService.getCompanyById(id);
      
      res.status(200).json({
        success: true,
        data: company
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create new company
  async createCompany(req, res) {
    try {
      const company = await companyService.createCompany(req.body);
      
      res.status(201).json({
        success: true,
        data: company,
        message: 'Company created successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('already exists') ? 409 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update company
  async updateCompany(req, res) {
    try {
      const { id } = req.params;
      const company = await companyService.updateCompany(id, req.body);
      
      res.status(200).json({
        success: true,
        data: company,
        message: 'Company updated successfully'
      });
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('already exists')) {
        statusCode = 409;
      }
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete company
  async deleteCompany(req, res) {
    try {
      const { id } = req.params;
      const result = await companyService.deleteCompany(id);
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('active users')) {
        statusCode = 400;
      }
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Sync companies from external API
  async syncCompanies(req, res) {
    try {
      const result = await companyService.syncCompaniesFromAPI();
      
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get company statistics
  async getCompanyStats(req, res) {
    try {
      const stats = await companyService.getCompanyStats();
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new CompanyController();