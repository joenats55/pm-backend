const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Status mapping for frontend compatibility
const STATUS_MAPPING = {
  'active': 'ACTIVE',
  'inactive': 'INACTIVE', 
  'maintenance': 'MAINTENANCE',
  'under repair': 'MAINTENANCE',
  'retired': 'RETIRED',
  // Also accept enum values directly
  'ACTIVE': 'ACTIVE',
  'INACTIVE': 'INACTIVE',
  'MAINTENANCE': 'MAINTENANCE',
  'RETIRED': 'RETIRED'
};

// Helper function to map status
const mapStatus = (status) => {
  if (!status) return 'ACTIVE';
  return STATUS_MAPPING[status.toLowerCase()] || STATUS_MAPPING[status] || 'ACTIVE';
};

class MachineService {
  // Get all machines
  async getAllMachines(filters = {}) {
    try {
      const { search, page = 1, limit = 10, companyId, status, category } = filters;
      const skip = (page - 1) * limit;
      
      let where = {};
      
      // Search filter
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { machineCode: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
          { serialNumber: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      // Company filter
      if (companyId) {
        where.companyId = parseInt(companyId);
      }
      
      // Status filter
      if (status) {
        where.status = status;
      }
      
      // Category filter
      if (category) {
        where.category = { contains: category, mode: 'insensitive' };
      }

      const [machines, total] = await Promise.all([
        prisma.machine.findMany({
          where,
          include: {
            company: {
              select: {
                id: true,
                name: true,
                tel: true,
                email: true
              }
            },
            pmSchedules: {
              orderBy: {
                nextDueDate: 'desc'
              },
              take: 10
            },
            repairWorks: {
              select: {
                id: true,
                actualCost: true
              }
            }
          },
          skip: parseInt(skip),
          take: parseInt(limit),
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.machine.count({ where })
      ]);

      // Add PM date information to each machine
      const machinesWithPMDates = machines.map(machine => {
        const now = new Date();
        
        // Find last completed PM (use lastDoneDate or completedAt)
        const lastCompletedPM = machine.pmSchedules
          ?.filter(pm => pm.status === 'COMPLETED' && pm.lastDoneDate)
          ?.sort((a, b) => new Date(b.lastDoneDate).getTime() - new Date(a.lastDoneDate).getTime())[0];
        
        // Find next scheduled PM (use nextDueDate)
        const nextScheduledPM = machine.pmSchedules
          ?.filter(pm => ['SCHEDULED', 'IN_PROGRESS'].includes(pm.status) && new Date(pm.nextDueDate) >= now)
          ?.sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())[0];
        
        return {
          ...machine,
          lastPMDate: lastCompletedPM?.lastDoneDate 
            ? new Date(lastCompletedPM.lastDoneDate).toLocaleDateString('th-TH', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })
            : 'ไม่มีข้อมูล',
          nextPMDate: nextScheduledPM?.nextDueDate 
            ? new Date(nextScheduledPM.nextDueDate).toLocaleDateString('th-TH', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })
            : 'ไม่มีกำหนด',
          // Remove pmSchedules from response to keep it clean
          pmSchedules: undefined,
          
          // Add repair work statistics
          workOrdersCount: machine.repairWorks ? machine.repairWorks.length : 0,
          totalCost: machine.repairWorks 
            ? machine.repairWorks.reduce((sum, work) => sum + (Number(work.actualCost) || 0), 0)
            : 0,
          // Remove repairWorks from response to keep it clean
          repairWorks: undefined
        };
      });

      return {
        machines: machinesWithPMDates,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get machines: ${error.message}`);
    }
  }

  // Get machine by ID
  async getMachineById(id) {
    try {
      const machine = await prisma.machine.findUnique({
        where: { id },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              tel: true,
              email: true,
              address: true
            }
          }
        }
      });

      if (!machine) {
        throw new Error('Machine not found');
      }

      return machine;
    } catch (error) {
      throw new Error(`Failed to get machine: ${error.message}`);
    }
  }

  // Get machine by machine code
  async getMachineByCode(machineCode) {
    try {
      const machine = await prisma.machine.findUnique({
        where: { machineCode },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              tel: true,
              email: true
            }
          }
        }
      });

      if (!machine) {
        throw new Error('Machine not found');
      }

      return machine;
    } catch (error) {
      throw new Error(`Failed to get machine: ${error.message}`);
    }
  }

  // Create new machine
  async createMachine(machineData) {
    try {
      // Validate company exists
      const company = await prisma.company.findUnique({
        where: { id: machineData.companyId }
      });

      if (!company) {
        throw new Error('Company not found');
      }

      // Check if machine code already exists
      const existingMachine = await prisma.machine.findUnique({
        where: { machineCode: machineData.machineCode }
      });

      if (existingMachine) {
        throw new Error('Machine code already exists');
      }

      const machine = await prisma.machine.create({
        data: {
          machineCode: machineData.machineCode,
          name: machineData.name,
          category: machineData.category,
          model: machineData.model,
          serialNumber: machineData.serialNumber,
          installationDate: machineData.installationDate ? new Date(machineData.installationDate) : null,
          location: machineData.location,
          status: mapStatus(machineData.status),
          qrCodeUrl: machineData.qrCodeUrl,
          companyId: machineData.companyId,
          imageUrl: machineData.imageUrl,
          description: machineData.description
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              tel: true,
              email: true
            }
          }
        }
      });

      return machine;
    } catch (error) {
      throw new Error(`Failed to create machine: ${error.message}`);
    }
  }

  // Update machine
  async updateMachine(id, updateData) {
    try {
      // Check if machine exists
      const existingMachine = await prisma.machine.findUnique({
        where: { id }
      });

      if (!existingMachine) {
        throw new Error('Machine not found');
      }

      // If updating company, validate it exists
      if (updateData.companyId) {
        const company = await prisma.company.findUnique({
          where: { id: updateData.companyId }
        });

        if (!company) {
          throw new Error('Company not found');
        }
      }

      // If updating machine code, check for duplicates
      if (updateData.machineCode && updateData.machineCode !== existingMachine.machineCode) {
        const duplicateMachine = await prisma.machine.findUnique({
          where: { machineCode: updateData.machineCode }
        });

        if (duplicateMachine) {
          throw new Error('Machine code already exists');
        }
      }

      const machine = await prisma.machine.update({
        where: { id },
        data: {
          ...updateData,
          status: updateData.status ? mapStatus(updateData.status) : undefined,
          installationDate: updateData.installationDate ? new Date(updateData.installationDate) : undefined
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              tel: true,
              email: true
            }
          }
        }
      });

      return machine;
    } catch (error) {
      throw new Error(`Failed to update machine: ${error.message}`);
    }
  }

  // Delete machine
  async deleteMachine(id) {
    try {
      const machine = await prisma.machine.findUnique({
        where: { id }
      });

      if (!machine) {
        throw new Error('Machine not found');
      }

      await prisma.machine.delete({
        where: { id }
      });

      return { message: 'Machine deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete machine: ${error.message}`);
    }
  }

  // Get machine statistics
  async getMachineStats(companyId = null) {
    try {
      const where = companyId ? { companyId: parseInt(companyId) } : {};

      const [total, statusStats, categoryStats] = await Promise.all([
        prisma.machine.count({ where }),
        prisma.machine.groupBy({
          by: ['status'],
          where,
          _count: {
            status: true
          }
        }),
        prisma.machine.groupBy({
          by: ['category'],
          where,
          _count: {
            category: true
          }
        })
      ]);

      return {
        total,
        statusStats: statusStats.map(stat => ({
          status: stat.status,
          count: stat._count.status
        })),
        categoryStats: categoryStats.map(stat => ({
          category: stat.category,
          count: stat._count.category
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get machine statistics: ${error.message}`);
    }
  }

  // Get machines by company
  async getMachinesByCompany(companyId, filters = {}) {
    try {
      const { search, status, category } = filters;
      
      let where = { companyId: parseInt(companyId) };
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { machineCode: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      if (status) {
        where.status = status;
      }
      
      if (category) {
        where.category = { contains: category, mode: 'insensitive' };
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

      return machines;
    } catch (error) {
      throw new Error(`Failed to get machines by company: ${error.message}`);
    }
  }
}

module.exports = new MachineService();
