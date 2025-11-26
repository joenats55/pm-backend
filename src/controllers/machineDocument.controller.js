const machineDocumentService = require('../services/machineDocument.service');
const { PrismaClient } = require('@prisma/client');
const { deleteUploadedFile, getDocumentUrl } = require('../middlewares/upload');
const path = require('path');
const prisma = new PrismaClient();

class MachineDocumentController {

  // Get all documents for a machine
  async getMachineDocuments(req, res) {
    try {
      const { machineId } = req.params;

      // Check if machine exists
      const machine = await prisma.machine.findUnique({
        where: { id: machineId }
      });

      if (!machine) {
        return res.status(404).json({
          success: false,
          message: 'Machine not found'
        });
      }

      const documents = await machineDocumentService.getMachineDocuments(machineId);

      res.status(200).json({
        success: true,
        data: documents
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get document by ID
  async getDocumentById(req, res) {
    try {
      const { id } = req.params;
      const document = await machineDocumentService.getDocumentById(id);

      res.status(200).json({
        success: true,
        data: document
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Upload new document
  async uploadDocument(req, res) {
    try {
      const { machineId } = req.params;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No document file provided'
        });
      }

      // Check if machine exists
      const machine = await prisma.machine.findUnique({
        where: { id: machineId }
      });

      if (!machine) {
        // Delete uploaded file if machine doesn't exist
        deleteUploadedFile(req.file.path);
        return res.status(404).json({
          success: false,
          message: 'Machine not found'
        });
      }

      // Generate document URL
      const fileUrl = getDocumentUrl(req.file.filename);

      const documentData = {
        machineId,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileUrl,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        documentType: req.body.documentType || 'other',
        title: req.body.title || req.file.originalname,
        description: req.body.description || null,
        version: req.body.version || null,
        uploadedBy: req.user.id // from auth middleware
      };

      const document = await machineDocumentService.createDocument(documentData);

      res.status(201).json({
        success: true,
        data: document,
        message: 'Document uploaded successfully'
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

  // Update document metadata
  async updateDocument(req, res) {
    try {
      const { id } = req.params;
      const updateData = {
        title: req.body.title,
        description: req.body.description,
        version: req.body.version,
        documentType: req.body.documentType
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => 
        updateData[key] === undefined && delete updateData[key]
      );

      const document = await machineDocumentService.updateDocument(id, updateData);

      res.status(200).json({
        success: true,
        data: document,
        message: 'Document updated successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete document
  async deleteDocument(req, res) {
    try {
      const { id } = req.params;

      const document = await machineDocumentService.deleteDocument(id);

      // Delete physical file
      if (document.filePath) {
        deleteUploadedFile(document.filePath);
      }

      res.status(200).json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get documents by type
  async getDocumentsByType(req, res) {
    try {
      const { machineId, type } = req.params;

      // Check if machine exists
      const machine = await prisma.machine.findUnique({
        where: { id: machineId }
      });

      if (!machine) {
        return res.status(404).json({
          success: false,
          message: 'Machine not found'
        });
      }

      const documents = await machineDocumentService.getDocumentsByType(machineId, type);

      res.status(200).json({
        success: true,
        data: documents
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get document statistics
  async getDocumentStats(req, res) {
    try {
      const { machineId } = req.params;

      // Check if machine exists
      const machine = await prisma.machine.findUnique({
        where: { id: machineId }
      });

      if (!machine) {
        return res.status(404).json({
          success: false,
          message: 'Machine not found'
        });
      }

      const stats = await machineDocumentService.getMachineDocumentStats(machineId);

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

  // Download document
  async downloadDocument(req, res) {
    try {
      const { id } = req.params;
      const document = await machineDocumentService.getDocumentById(id);

      if (!document.filePath || !require('fs').existsSync(document.filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Document file not found'
        });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      res.setHeader('Content-Type', document.fileType);
      res.sendFile(path.resolve(document.filePath));
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new MachineDocumentController();
