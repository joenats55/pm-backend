const InventoryTransactionService = require('../services/inventoryTransaction.service');

class InventoryTransactionController {
  // Create a new inventory transaction
  static async createTransaction(req, res) {
    try {
      const userId = req.user.id;
      const transaction = await InventoryTransactionService.createTransaction(req.body, userId);
      
      res.status(201).json({
        success: true,
        message: 'Inventory transaction created successfully',
        data: transaction,
      });
    } catch (error) {
      console.error('Error creating inventory transaction:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get all inventory transactions
  static async getAllTransactions(req, res) {
    try {
      const filters = {
        partId: req.query.partId,
        transactionType: req.query.transactionType,
        referenceType: req.query.referenceType,
        performedBy: req.query.performedBy,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const transactions = await InventoryTransactionService.getAllTransactions(filters);
      
      res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      console.error('Error fetching inventory transactions:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get transactions by part ID
  static async getTransactionsByPartId(req, res) {
    try {
      const { partId } = req.params;
      const transactions = await InventoryTransactionService.getTransactionsByPartId(partId);
      
      res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      console.error('Error fetching transactions by part ID:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get transaction by ID
  static async getTransactionById(req, res) {
    try {
      const { id } = req.params;
      const transaction = await InventoryTransactionService.getTransactionById(id);
      
      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      console.error('Error fetching transaction by ID:', error);
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Update inventory transaction
  static async updateTransaction(req, res) {
    try {
      const { id } = req.params;
      const transaction = await InventoryTransactionService.updateTransaction(id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Transaction updated successfully',
        data: transaction,
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Delete inventory transaction
  static async deleteTransaction(req, res) {
    try {
      const { id } = req.params;
      const result = await InventoryTransactionService.deleteTransaction(id);
      
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get inventory summary by part
  static async getInventorySummary(req, res) {
    try {
      const { partId } = req.params;
      const summary = await InventoryTransactionService.getInventorySummary(partId);
      
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error('Error fetching inventory summary:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Quick stock adjustment (for the +/- buttons in the UI)
  static async quickStockAdjustment(req, res) {
    try {
      const { partId, quantity, operation } = req.body;
      const userId = req.user.id;

      // Validate operation
      if (!['add', 'subtract'].includes(operation)) {
        return res.status(400).json({
          success: false,
          message: 'Operation must be either "add" or "subtract"',
        });
      }

      // Create transaction based on operation
      const transactionData = {
        partId,
        transactionType: operation === 'add' ? 'IN' : 'OUT',
        quantity: Math.abs(quantity),
        referenceType: 'manual',
        remarks: `${operation === 'add' ? 'เพิ่ม' : 'ลด'}สต็อก ${Math.abs(quantity)} หน่วย`,
      };

      const transaction = await InventoryTransactionService.createTransaction(transactionData, userId);
      
      res.status(201).json({
        success: true,
        message: 'Stock updated successfully',
        data: transaction,
      });
    } catch (error) {
      console.error('Error in quick stock adjustment:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get comprehensive audit report
  static async getAuditReport(req, res) {
    try {
      const filters = {
        partId: req.query.partId,
        transactionType: req.query.transactionType,
        referenceType: req.query.referenceType,
        performedBy: req.query.performedBy,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        machineId: req.query.machineId,
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const auditData = await InventoryTransactionService.getAuditReport(filters);
      
      res.status(200).json({
        success: true,
        data: auditData,
      });
    } catch (error) {
      console.error('Error fetching audit report:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = InventoryTransactionController;
