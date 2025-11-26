const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Transaction type mapping for inventory compatibility
const TRANSACTION_TYPE_MAPPING = {
  'in': 'IN',
  'out': 'OUT', 
  'adjust': 'ADJUST',
  // Also accept enum values directly
  'IN': 'IN',
  'OUT': 'OUT',
  'ADJUST': 'ADJUST'
};

// Reference type mapping
const REFERENCE_TYPE_MAPPING = {
  'work_order': 'WORK_ORDER',
  'manual': 'MANUAL',
  'purchase': 'PURCHASE',
  'adjustment': 'ADJUSTMENT',
  // Also accept enum values directly
  'WORK_ORDER': 'WORK_ORDER',
  'MANUAL': 'MANUAL',
  'PURCHASE': 'PURCHASE',
  'ADJUSTMENT': 'ADJUSTMENT'
};

// Helper functions to map values
const mapTransactionType = (transactionType) => {
  if (!transactionType) return 'IN';
  return TRANSACTION_TYPE_MAPPING[transactionType.toLowerCase()] || TRANSACTION_TYPE_MAPPING[transactionType] || 'IN';
};

const mapReferenceType = (referenceType) => {
  if (!referenceType) return null;
  return REFERENCE_TYPE_MAPPING[referenceType.toLowerCase()] || REFERENCE_TYPE_MAPPING[referenceType] || null;
};

class InventoryTransactionService {
  // Create a new inventory transaction
  static async createTransaction(data, userId) {
    try {
      const transaction = await prisma.inventoryTransaction.create({
        data: {
          ...data,
          transactionType: mapTransactionType(data.transactionType),
          referenceType: mapReferenceType(data.referenceType),
          performedBy: userId,
          transactionDate: data.transactionDate || new Date(),
        },
        include: {
          part: {
            include: {
              machine: {
                select: {
                  id: true,
                  name: true,
                  machineCode: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
      });

      // Update the part's stock based on transaction type
      await this.updatePartStock(data.partId, data.quantity, data.transactionType);

      return transaction;
    } catch (error) {
      throw new Error(`Failed to create inventory transaction: ${error.message}`);
    }
  }

  // Update part stock based on transaction
  static async updatePartStock(partId, quantity, transactionType) {
    try {
      const part = await prisma.machinePart.findUnique({
        where: { id: partId },
      });

      if (!part) {
        throw new Error('Part not found');
      }

      let newQuantity = part.quantityOnHand;

      switch (transactionType) {
        case 'IN':
          newQuantity += quantity;
          break;
        case 'OUT':
          newQuantity -= quantity;
          break;
        case 'ADJUST':
          newQuantity = quantity; // For adjustments, quantity is the new total
          break;
      }

      // Ensure quantity doesn't go below 0
      if (newQuantity < 0) {
        throw new Error('Insufficient stock for this transaction');
      }

      await prisma.machinePart.update({
        where: { id: partId },
        data: { quantityOnHand: newQuantity },
      });
    } catch (error) {
      throw new Error(`Failed to update part stock: ${error.message}`);
    }
  }

  // Get all inventory transactions with filters
  static async getAllTransactions(filters = {}) {
    try {
      const where = {};

      if (filters.partId) {
        where.partId = filters.partId;
      }

      if (filters.transactionType) {
        where.transactionType = filters.transactionType;
      }

      if (filters.referenceType) {
        where.referenceType = filters.referenceType;
      }

      if (filters.performedBy) {
        where.performedBy = filters.performedBy;
      }

      if (filters.dateFrom || filters.dateTo) {
        where.transactionDate = {};
        if (filters.dateFrom) {
          where.transactionDate.gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          where.transactionDate.lte = new Date(filters.dateTo);
        }
      }

      const transactions = await prisma.inventoryTransaction.findMany({
        where,
        include: {
          part: {
            include: {
              machine: {
                select: {
                  id: true,
                  name: true,
                  machineCode: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
        orderBy: {
          transactionDate: 'desc',
        },
      });

      return transactions;
    } catch (error) {
      throw new Error(`Failed to fetch inventory transactions: ${error.message}`);
    }
  }

  // Get transactions by part ID
  static async getTransactionsByPartId(partId) {
    try {
      const transactions = await prisma.inventoryTransaction.findMany({
        where: { partId },
        include: {
          part: {
            include: {
              machine: {
                select: {
                  id: true,
                  name: true,
                  machineCode: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
        orderBy: {
          transactionDate: 'desc',
        },
      });

      return transactions;
    } catch (error) {
      throw new Error(`Failed to fetch transactions for part: ${error.message}`);
    }
  }

  // Get transaction by ID
  static async getTransactionById(id) {
    try {
      const transaction = await prisma.inventoryTransaction.findUnique({
        where: { id },
        include: {
          part: {
            include: {
              machine: {
                select: {
                  id: true,
                  name: true,
                  machineCode: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      return transaction;
    } catch (error) {
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }
  }

  // Update inventory transaction
  static async updateTransaction(id, data) {
    try {
      const existingTransaction = await prisma.inventoryTransaction.findUnique({
        where: { id },
      });

      if (!existingTransaction) {
        throw new Error('Transaction not found');
      }

      // If quantity or type changed, we need to reverse the old transaction and apply the new one
      if (data.quantity !== undefined || data.transactionType !== undefined) {
        // Reverse the old transaction
        await this.reverseTransaction(existingTransaction);
        
        // Apply the new transaction
        const newQuantity = data.quantity || existingTransaction.quantity;
        const newType = data.transactionType || existingTransaction.transactionType;
        await this.updatePartStock(existingTransaction.partId, newQuantity, newType);
      }

      const updatedTransaction = await prisma.inventoryTransaction.update({
        where: { id },
        data,
        include: {
          part: {
            include: {
              machine: {
                select: {
                  id: true,
                  name: true,
                  machineCode: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
      });

      return updatedTransaction;
    } catch (error) {
      throw new Error(`Failed to update transaction: ${error.message}`);
    }
  }

  // Reverse a transaction (for updates/deletions)
  static async reverseTransaction(transaction) {
    try {
      const part = await prisma.machinePart.findUnique({
        where: { id: transaction.partId },
      });

      if (!part) {
        throw new Error('Part not found');
      }

      let newQuantity = part.quantityOnHand;

      // Reverse the transaction
      switch (transaction.transactionType) {
        case 'IN':
          newQuantity -= transaction.quantity;
          break;
        case 'OUT':
          newQuantity += transaction.quantity;
          break;
        case 'ADJUST':
          // For adjustments, we can't easily reverse, so we'll skip this
          // This should be handled carefully in the UI
          return;
      }

      await prisma.machinePart.update({
        where: { id: transaction.partId },
        data: { quantityOnHand: Math.max(0, newQuantity) },
      });
    } catch (error) {
      throw new Error(`Failed to reverse transaction: ${error.message}`);
    }
  }

  // Delete inventory transaction
  static async deleteTransaction(id) {
    try {
      const transaction = await prisma.inventoryTransaction.findUnique({
        where: { id },
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Reverse the transaction before deleting
      await this.reverseTransaction(transaction);

      await prisma.inventoryTransaction.delete({
        where: { id },
      });

      return { message: 'Transaction deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete transaction: ${error.message}`);
    }
  }

  // Get inventory summary by part
  static async getInventorySummary(partId) {
    try {
      const transactions = await prisma.inventoryTransaction.findMany({
        where: { partId },
        orderBy: { transactionDate: 'desc' },
      });

      const summary = {
        totalIn: 0,
        totalOut: 0,
        totalAdjustments: 0,
        transactionCount: transactions.length,
        lastTransaction: transactions[0] || null,
      };

      transactions.forEach(transaction => {
        switch (transaction.transactionType) {
          case 'IN':
            summary.totalIn += transaction.quantity;
            break;
          case 'OUT':
            summary.totalOut += transaction.quantity;
            break;
          case 'ADJUST':
            summary.totalAdjustments += 1;
            break;
        }
      });

      return summary;
    } catch (error) {
      throw new Error(`Failed to get inventory summary: ${error.message}`);
    }
  }

  // Get comprehensive audit report with enhanced filtering
  static async getAuditReport(filters = {}) {
    try {
      console.log('Audit Report Filters:', filters); // Debug log
      const where = {};

      if (filters.partId) {
        where.partId = filters.partId;
      }

      if (filters.transactionType) {
        where.transactionType = filters.transactionType;
      }

      if (filters.referenceType) {
        where.referenceType = filters.referenceType;
      }

      if (filters.performedBy) {
        where.performedBy = filters.performedBy;
      }

      if (filters.dateFrom || filters.dateTo) {
        where.transactionDate = {};
        if (filters.dateFrom) {
          // Set to start of day in local timezone
          const startDate = new Date(filters.dateFrom);
          startDate.setHours(0, 0, 0, 0);
          where.transactionDate.gte = startDate;
          console.log('Date filter from:', startDate); // Debug log
        }
        if (filters.dateTo) {
          // Set to end of day in local timezone
          const endDate = new Date(filters.dateTo);
          endDate.setHours(23, 59, 59, 999);
          where.transactionDate.lte = endDate;
          console.log('Date filter to:', endDate); // Debug log
        }
      }

      // Build include object for nested filtering
      const includeConditions = {
        part: {
          include: {
            machine: {
              include: {
                company: true,
              },
            },
          },
        },
        user: {
          include: {
            role: true,
            company: true,
          },
        },
      };

      // Add machine filtering if specified
      if (filters.machineId) {
        where.part = {
          machineId: filters.machineId,
        };
      }

      const transactions = await prisma.inventoryTransaction.findMany({
        where,
        include: includeConditions,
        orderBy: {
          transactionDate: 'desc',
        },
      });

      console.log('Query where condition:', JSON.stringify(where, null, 2)); // Debug log
      console.log('Found transactions:', transactions.length); // Debug log

      // Calculate enhanced statistics
      const statistics = {
        totalTransactions: transactions.length,
        totalIn: transactions.filter(t => t.transactionType === 'IN').length,
        totalOut: transactions.filter(t => t.transactionType === 'OUT').length,
        totalAdjustments: transactions.filter(t => t.transactionType === 'ADJUST').length,
        totalValue: 0,
        uniqueParts: new Set(),
        uniqueUsers: new Set(),
        uniqueMachines: new Set(),
        uniqueCompanies: new Set(),
        transactionsByType: {},
        transactionsByReferenceType: {},
        transactionsByUser: {},
        transactionsByMachine: {},
        transactionsByCompany: {},
        valueByTransactionType: { IN: 0, OUT: 0, ADJUST: 0 },
      };

      transactions.forEach(transaction => {
        // Calculate value
        if (transaction.part?.costPerUnit) {
          const value = Number(transaction.part.costPerUnit) * transaction.quantity;
          statistics.totalValue += value;
          statistics.valueByTransactionType[transaction.transactionType] += value;
        }

        // Track unique entities
        statistics.uniqueParts.add(transaction.partId);
        statistics.uniqueUsers.add(transaction.performedBy);
        if (transaction.part?.machine?.id) {
          statistics.uniqueMachines.add(transaction.part.machine.id);
        }
        if (transaction.part?.machine?.company?.id) {
          statistics.uniqueCompanies.add(transaction.part.machine.company.id);
        }

        // Count by transaction type
        statistics.transactionsByType[transaction.transactionType] = 
          (statistics.transactionsByType[transaction.transactionType] || 0) + 1;

        // Count by reference type
        if (transaction.referenceType) {
          statistics.transactionsByReferenceType[transaction.referenceType] = 
            (statistics.transactionsByReferenceType[transaction.referenceType] || 0) + 1;
        }

        // Count by user
        const userName = transaction.user?.fullName || 'Unknown';
        statistics.transactionsByUser[userName] = 
          (statistics.transactionsByUser[userName] || 0) + 1;

        // Count by machine
        if (transaction.part?.machine?.name) {
          statistics.transactionsByMachine[transaction.part.machine.name] = 
            (statistics.transactionsByMachine[transaction.part.machine.name] || 0) + 1;
        }

        // Count by company
        if (transaction.part?.machine?.company?.name) {
          statistics.transactionsByCompany[transaction.part.machine.company.name] = 
            (statistics.transactionsByCompany[transaction.part.machine.company.name] || 0) + 1;
        }
      });

      // Convert sets to counts
      statistics.uniqueParts = statistics.uniqueParts.size;
      statistics.uniqueUsers = statistics.uniqueUsers.size;
      statistics.uniqueMachines = statistics.uniqueMachines.size;
      statistics.uniqueCompanies = statistics.uniqueCompanies.size;

      return {
        transactions,
        statistics,
        filters: filters,
        generatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to generate audit report: ${error.message}`);
    }
  }
}

module.exports = InventoryTransactionService;
