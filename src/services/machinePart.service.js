const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllMachineParts = async () => {
  return await prisma.machinePart.findMany({
    include: {
      machine: {
        select: {
          id: true,
          name: true,
          machineCode: true,
          category: true,
          location: true
        }
      }
    },
    orderBy: {
      partCode: 'asc'
    }
  });
};

const getMachinePartsByMachineId = async (machineId) => {
  return await prisma.machinePart.findMany({
    where: {
      machineId: machineId
    },
    include: {
      machine: {
        select: {
          id: true,
          name: true,
          machineCode: true
        }
      }
    },
    orderBy: {
      partCode: 'asc'
    }
  });
};

const getMachinePartById = async (id) => {
  return await prisma.machinePart.findUnique({
    where: { id },
    include: {
      machine: {
        select: {
          id: true,
          name: true,
          machineCode: true
        }
      }
    }
  });
};

const createMachinePart = async (partData) => {
  const {
    machineId,
    partCode,
    partName,
    description,
    partCategory,
    uom = 'pcs',
    quantityOnHand = 0,
    minStockLevel,
    location,
    vendorName,
    costPerUnit
  } = partData;

  return await prisma.machinePart.create({
    data: {
      machineId,
      partCode,
      partName,
      description,
      partCategory,
      uom,
      quantityOnHand,
      minStockLevel,
      location,
      vendorName,
      costPerUnit: costPerUnit ? parseFloat(costPerUnit) : null
    },
    include: {
      machine: {
        select: {
          id: true,
          name: true,
          machineCode: true
        }
      }
    }
  });
};

const updateMachinePart = async (id, updateData) => {
  const {
    partCode,
    partName,
    description,
    partCategory,
    uom,
    quantityOnHand,
    minStockLevel,
    location,
    vendorName,
    costPerUnit
  } = updateData;

  return await prisma.machinePart.update({
    where: { id },
    data: {
      ...(partCode && { partCode }),
      ...(partName && { partName }),
      ...(description !== undefined && { description }),
      ...(partCategory !== undefined && { partCategory }),
      ...(uom && { uom }),
      ...(quantityOnHand !== undefined && { quantityOnHand }),
      ...(minStockLevel !== undefined && { minStockLevel }),
      ...(location !== undefined && { location }),
      ...(vendorName !== undefined && { vendorName }),
      ...(costPerUnit !== undefined && { costPerUnit: costPerUnit ? parseFloat(costPerUnit) : null })
    },
    include: {
      machine: {
        select: {
          id: true,
          name: true,
          machineCode: true
        }
      }
    }
  });
};

const deleteMachinePart = async (id) => {
  return await prisma.machinePart.delete({
    where: { id }
  });
};

const getLowStockParts = async (machineId) => {
  return await prisma.machinePart.findMany({
    where: {
      machineId: machineId,
      AND: [
        {
          minStockLevel: {
            not: null
          }
        },
        {
          OR: [
            {
              quantityOnHand: {
                lte: prisma.machinePart.fields.minStockLevel
              }
            }
          ]
        }
      ]
    },
    include: {
      machine: {
        select: {
          id: true,
          name: true,
          machineCode: true
        }
      }
    },
    orderBy: {
      partCode: 'asc'
    }
  });
};

// Alternative implementation for low stock using raw query for better performance
const getLowStockPartsRaw = async (machineId) => {
  return await prisma.$queryRaw`
    SELECT mp.*, m.name as machine_name, m.machine_code
    FROM machine_parts mp
    JOIN machines m ON mp.machine_id = m.id
    WHERE mp.machine_id = ${machineId}::uuid
    AND mp.min_stock_level IS NOT NULL
    AND mp.quantity_on_hand <= mp.min_stock_level
    ORDER BY mp.part_code ASC
  `;
};

const updatePartStock = async (id, quantity, operation, userId, remarks = '') => {
  const InventoryTransactionService = require('./inventoryTransaction.service');
  
  const part = await prisma.machinePart.findUnique({
    where: { id }
  });

  if (!part) {
    throw new Error('Machine part not found');
  }

  // Create inventory transaction instead of directly updating stock
  const transactionData = {
    partId: id,
    transactionType: operation === 'add' ? 'IN' : 'OUT',
    quantity: Math.abs(quantity),
    referenceType: 'manual',
    remarks: remarks || `${operation === 'add' ? 'เพิ่ม' : 'ลด'}สต็อก ${Math.abs(quantity)} หน่วย`,
  };

  // The inventory transaction service will handle the stock update
  await InventoryTransactionService.createTransaction(transactionData, userId);

  // Return the updated part
  return await prisma.machinePart.findUnique({
    where: { id },
    include: {
      machine: {
        select: {
          id: true,
          name: true,
          machineCode: true
        }
      }
    }
  });
};

const searchParts = async (machineId, filters) => {
  const { search, category, lowStock } = filters;
  
  let where = {
    machineId: machineId
  };

  // Add search filter
  if (search) {
    where.OR = [
      { partCode: { contains: search, mode: 'insensitive' } },
      { partName: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { vendorName: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Add category filter
  if (category) {
    where.partCategory = category;
  }

  // Add low stock filter
  if (lowStock) {
    where.AND = [
      {
        minStockLevel: {
          not: null
        }
      }
    ];
    // This is a simplified version - for production, use the raw query approach
  }

  return await prisma.machinePart.findMany({
    where,
    include: {
      machine: {
        select: {
          id: true,
          name: true,
          machineCode: true
        }
      }
    },
    orderBy: {
      partCode: 'asc'
    }
  });
};

const getPartCategories = async (machineId) => {
  const categories = await prisma.machinePart.findMany({
    where: {
      machineId: machineId,
      partCategory: {
        not: null
      }
    },
    select: {
      partCategory: true
    },
    distinct: ['partCategory']
  });
  
  return categories.map(cat => cat.partCategory);
};

const getPartStatistics = async (machineId) => {
  const stats = await prisma.machinePart.aggregate({
    where: {
      machineId: machineId
    },
    _count: {
      id: true
    },
    _sum: {
      quantityOnHand: true,
      costPerUnit: true
    },
    _avg: {
      costPerUnit: true
    }
  });

  const lowStockCount = await prisma.machinePart.count({
    where: {
      machineId: machineId,
      minStockLevel: {
        not: null
      },
      quantityOnHand: {
        lte: prisma.machinePart.fields.minStockLevel
      }
    }
  });

  return {
    totalParts: stats._count.id,
    totalQuantity: stats._sum.quantityOnHand || 0,
    totalValue: stats._sum.costPerUnit || 0,
    averageCost: stats._avg.costPerUnit || 0,
    lowStockCount
  };
};

module.exports = {
  getAllMachineParts,
  getMachinePartsByMachineId,
  getMachinePartById,
  createMachinePart,
  updateMachinePart,
  deleteMachinePart,
  getLowStockParts,
  getLowStockPartsRaw,
  updatePartStock,
  searchParts,
  getPartCategories,
  getPartStatistics
};
