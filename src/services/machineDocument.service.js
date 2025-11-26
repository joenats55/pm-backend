const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class MachineDocumentService {
  
  // Get all documents for a machine
  async getMachineDocuments(machineId) {
    try {
      const documents = await prisma.machineDocument.findMany({
        where: { machineId },
        orderBy: { createdAt: 'desc' }
      });

      return documents;
    } catch (error) {
      throw new Error(`Failed to fetch machine documents: ${error.message}`);
    }
  }

  // Get document by ID
  async getDocumentById(id) {
    try {
      const document = await prisma.machineDocument.findUnique({
        where: { id },
        include: {
          machine: {
            select: {
              id: true,
              machineCode: true,
              name: true
            }
          }
        }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      return document;
    } catch (error) {
      throw new Error(`Failed to fetch document: ${error.message}`);
    }
  }

  // Create new document
  async createDocument(documentData) {
    try {
      const document = await prisma.machineDocument.create({
        data: {
          machineId: documentData.machineId,
          fileName: documentData.fileName,
          filePath: documentData.filePath,
          fileUrl: documentData.fileUrl,
          fileSize: documentData.fileSize,
          fileType: documentData.fileType,
          documentType: documentData.documentType,
          title: documentData.title,
          description: documentData.description,
          version: documentData.version,
          uploadedBy: documentData.uploadedBy
        }
      });

      return document;
    } catch (error) {
      throw new Error(`Failed to create document: ${error.message}`);
    }
  }

  // Update document
  async updateDocument(id, updateData) {
    try {
      // Check if document exists
      const existingDocument = await prisma.machineDocument.findUnique({
        where: { id }
      });

      if (!existingDocument) {
        throw new Error('Document not found');
      }

      const document = await prisma.machineDocument.update({
        where: { id },
        data: updateData
      });

      return document;
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  // Delete document
  async deleteDocument(id) {
    try {
      // Check if document exists
      const existingDocument = await prisma.machineDocument.findUnique({
        where: { id }
      });

      if (!existingDocument) {
        throw new Error('Document not found');
      }

      await prisma.machineDocument.delete({
        where: { id }
      });

      return existingDocument;
    } catch (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  // Get documents by type
  async getDocumentsByType(machineId, documentType) {
    try {
      const documents = await prisma.machineDocument.findMany({
        where: { 
          machineId,
          documentType 
        },
        orderBy: { createdAt: 'desc' }
      });

      return documents;
    } catch (error) {
      throw new Error(`Failed to fetch documents by type: ${error.message}`);
    }
  }

  // Get document statistics for a machine
  async getMachineDocumentStats(machineId) {
    try {
      const stats = await prisma.machineDocument.groupBy({
        by: ['documentType'],
        where: { machineId },
        _count: {
          id: true
        }
      });

      const totalSize = await prisma.machineDocument.aggregate({
        where: { machineId },
        _sum: {
          fileSize: true
        }
      });

      return {
        byType: stats,
        totalDocuments: stats.reduce((acc, curr) => acc + curr._count.id, 0),
        totalSize: totalSize._sum.fileSize || 0
      };
    } catch (error) {
      throw new Error(`Failed to fetch document statistics: ${error.message}`);
    }
  }
}

module.exports = new MachineDocumentService();
