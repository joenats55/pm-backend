const machineService = require('../services/machine.service');
const { PrismaClient } = require('@prisma/client');
const { deleteUploadedFile, getFileUrl } = require('../middlewares/upload');
const QRCode = require('qrcode');
const path = require('path');
const prisma = new PrismaClient();

class MachineController {
  // Get all machines
  async getAllMachines(req, res) {
    try {
      const { search, page, limit, companyId, status, category } = req.query;
      const result = await machineService.getAllMachines({ 
        search, 
        page, 
        limit, 
        companyId, 
        status, 
        category 
      });
      
      res.status(200).json({
        success: true,
        data: result.machines,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get machine by ID
  async getMachineById(req, res) {
    try {
      const { id } = req.params;
      const machine = await machineService.getMachineById(id);
      
      res.status(200).json({
        success: true,
        data: machine
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get machine by machine code
  async getMachineByCode(req, res) {
    try {
      const { code } = req.params;
      const machine = await machineService.getMachineByCode(code);
      
      res.status(200).json({
        success: true,
        data: machine
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create new machine
  async createMachine(req, res) {
    try {
      const machine = await machineService.createMachine(req.body);
      
      res.status(201).json({
        success: true,
        data: machine,
        message: 'Machine created successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('already exists') || 
                        error.message.includes('not found') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update machine
  async updateMachine(req, res) {
    try {
      const { id } = req.params;
      const machine = await machineService.updateMachine(id, req.body);
      
      res.status(200).json({
        success: true,
        data: machine,
        message: 'Machine updated successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('already exists') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete machine
  async deleteMachine(req, res) {
    try {
      const { id } = req.params;
      const result = await machineService.deleteMachine(id);
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get machine statistics
  async getMachineStats(req, res) {
    try {
      const { companyId } = req.query;
      const stats = await machineService.getMachineStats(companyId);
      
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

  // Get machines by company
  async getMachinesByCompany(req, res) {
    try {
      const { companyId } = req.params;
      const { search, status, category } = req.query;
      
      const machines = await machineService.getMachinesByCompany(companyId, {
        search,
        status,
        category
      });
      
      res.status(200).json({
        success: true,
        data: machines
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Bulk operations
  async bulkUpdateMachineStatus(req, res) {
    try {
      const { machineIds, status } = req.body;
      
      if (!machineIds || !Array.isArray(machineIds) || machineIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Machine IDs array is required'
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      const updatePromises = machineIds.map(id => 
        machineService.updateMachine(id, { status })
      );

      await Promise.all(updatePromises);
      
      res.status(200).json({
        success: true,
        message: `Successfully updated ${machineIds.length} machines`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Search machines with advanced filters
  async searchMachines(req, res) {
    try {
      const {
        query,
        companyId,
        status,
        category,
        installationDateFrom,
        installationDateTo,
        location
      } = req.query;

      let where = {};

      if (query) {
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { machineCode: { contains: query, mode: 'insensitive' } },
          { model: { contains: query, mode: 'insensitive' } },
          { serialNumber: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ];
      }

      if (companyId) where.companyId = parseInt(companyId);
      if (status) where.status = status;
      if (category) where.category = { contains: category, mode: 'insensitive' };
      if (location) where.location = { contains: location, mode: 'insensitive' };

      if (installationDateFrom || installationDateTo) {
        where.installationDate = {};
        if (installationDateFrom) where.installationDate.gte = new Date(installationDateFrom);
        if (installationDateTo) where.installationDate.lte = new Date(installationDateTo);
      }

      const machines = await prisma.machine.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          machineCode: 'asc'
        }
      });

      res.status(200).json({
        success: true,
        data: machines,
        count: machines.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Upload machine image
  async uploadMachineImage(req, res) {
    try {
      const { id } = req.params;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      // Check if machine exists
      const existingMachine = await prisma.machine.findUnique({
        where: { id }
      });

      if (!existingMachine) {
        // Delete uploaded file if machine doesn't exist
        deleteUploadedFile(req.file.path);
        return res.status(404).json({
          success: false,
          message: 'Machine not found'
        });
      }

      // Delete old image if exists
      if (existingMachine.imageUrl) {
        const oldImagePath = path.join(__dirname, '../../uploads/machines', path.basename(existingMachine.imageUrl));
        deleteUploadedFile(oldImagePath);
      }

      // Generate image URL
      const imageUrl = getFileUrl(req.file.filename);

      // Update machine with new image URL
      const updatedMachine = await prisma.machine.update({
        where: { id },
        data: { imageUrl },
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      res.status(200).json({
        success: true,
        data: updatedMachine,
        message: 'Machine image uploaded successfully'
      });
    } catch (error) {
      // Delete uploaded file on error
      if (req.file) {
        deleteUploadedFile(req.file.path);
      }
      
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete machine image
  async deleteMachineImage(req, res) {
    try {
      const { id } = req.params;

      // Check if machine exists
      const existingMachine = await prisma.machine.findUnique({
        where: { id }
      });

      if (!existingMachine) {
        return res.status(404).json({
          success: false,
          message: 'Machine not found'
        });
      }

      // Delete image file if exists
      if (existingMachine.imageUrl) {
        const imagePath = path.join(__dirname, '../../uploads/machines', path.basename(existingMachine.imageUrl));
        deleteUploadedFile(imagePath);
      }

      // Remove image URL from database
      const updatedMachine = await prisma.machine.update({
        where: { id },
        data: { imageUrl: null },
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      res.status(200).json({
        success: true,
        data: updatedMachine,
        message: 'Machine image deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create machine with image
  async createMachineWithImage(req, res) {
    try {
      // Get image URL if file was uploaded
      let imageUrl = null;
      if (req.file) {
        imageUrl = getFileUrl(req.file.filename);
      }

      // Convert form data fields to correct types
      const machineData = {
        ...req.body,
        companyId: req.body.companyId ? parseInt(req.body.companyId, 10) : undefined,
        imageUrl
      };

      const machine = await machineService.createMachine(machineData);
      
      res.status(201).json({
        success: true,
        data: machine,
        message: 'Machine created successfully'
      });
    } catch (error) {
      // Delete uploaded file on error
      if (req.file) {
        deleteUploadedFile(req.file.path);
      }
      
      const statusCode = error.message.includes('already exists') || 
                        error.message.includes('not found') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update machine with image
  async updateMachineWithImage(req, res) {
    try {
      const { id } = req.params;
      
      // Get existing machine to handle image replacement
      const existingMachine = await prisma.machine.findUnique({
        where: { id }
      });

      if (!existingMachine) {
        // Delete uploaded file if machine doesn't exist
        if (req.file) {
          deleteUploadedFile(req.file.path);
        }
        return res.status(404).json({
          success: false,
          message: 'Machine not found'
        });
      }

      let imageUrl = existingMachine.imageUrl;

      // Handle new image upload
      if (req.file) {
        // Delete old image if exists
        if (existingMachine.imageUrl) {
          const oldImagePath = path.join(__dirname, '../../uploads/machines', path.basename(existingMachine.imageUrl));
          deleteUploadedFile(oldImagePath);
        }
        imageUrl = getFileUrl(req.file.filename);
      }

      // Convert form data fields to correct types
      const machineData = {
        ...req.body,
        companyId: req.body.companyId ? parseInt(req.body.companyId, 10) : undefined,
        imageUrl
      };

      const machine = await machineService.updateMachine(id, machineData);
      
      res.status(200).json({
        success: true,
        data: machine,
        message: 'Machine updated successfully'
      });
    } catch (error) {
      // Delete uploaded file on error
      if (req.file) {
        deleteUploadedFile(req.file.path);
      }
      
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('already exists') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Generate QR code for machine
  async generateMachineQR(req, res) {
    try {
      const { id } = req.params;
      const { format = 'png', size = 256 } = req.query;
      
      // Check if machine exists
      const machine = await prisma.machine.findUnique({
        where: { id },
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!machine) {
        return res.status(404).json({
          success: false,
          message: 'Machine not found'
        });
      }

      // Generate machine detail URL
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const machineDetailUrl = `${frontendUrl}/machines/${machine.id}?code=${machine.machineCode}`;
      
      // QR code options
      const qrOptions = {
        width: parseInt(size),
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      };

      if (format === 'svg') {
        // Generate SVG format
        const qrCodeSVG = await QRCode.toString(machineDetailUrl, { 
          ...qrOptions, 
          type: 'svg' 
        });
        
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Content-Disposition', `attachment; filename="QR_${machine.machineCode}.svg"`);
        res.send(qrCodeSVG);
      } else {
        // Generate PNG format (default)
        const qrCodeBuffer = await QRCode.toBuffer(machineDetailUrl, {
          ...qrOptions,
          type: 'png'
        });
        
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="QR_${machine.machineCode}.png"`);
        res.send(qrCodeBuffer);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate QR code'
      });
    }
  }
}

module.exports = new MachineController();
