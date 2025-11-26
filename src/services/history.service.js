const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Status mapping for PM Schedule compatibility  
const PM_STATUS_MAPPING = {
  'scheduled': 'SCHEDULED',
  'in_progress': 'IN_PROGRESS',
  'completed': 'COMPLETED', 
  'skipped': 'SKIPPED',
  'overdue': 'OVERDUE',
  'cancelled': 'CANCELLED',
  // Also accept enum values directly
  'SCHEDULED': 'SCHEDULED',
  'IN_PROGRESS': 'IN_PROGRESS',
  'COMPLETED': 'COMPLETED',
  'SKIPPED': 'SKIPPED',
  'OVERDUE': 'OVERDUE',
  'CANCELLED': 'CANCELLED'
};

// Priority mapping
const PM_PRIORITY_MAPPING = {
  'low': 'LOW',
  'medium': 'MEDIUM',
  'high': 'HIGH',
  'critical': 'CRITICAL',
  // Also accept enum values directly
  'LOW': 'LOW',
  'MEDIUM': 'MEDIUM', 
  'HIGH': 'HIGH',
  'CRITICAL': 'CRITICAL'
};

// Helper functions to map values
const mapPMStatus = (status) => {
  if (!status) return 'COMPLETED';
  return PM_STATUS_MAPPING[status.toLowerCase()] || PM_STATUS_MAPPING[status] || 'COMPLETED';
};

const mapPMPriority = (priority) => {
  if (!priority) return null;
  return PM_PRIORITY_MAPPING[priority.toLowerCase()] || PM_PRIORITY_MAPPING[priority] || null;
};

class HistoryService {
  /**
   * Get completed PM schedule history with filtering, sorting, and pagination
   * @param {Object} filters - Filter parameters
   * @returns {Object} - Returns schedules and pagination info
   */
  async getCompletedHistory(filters = {}) {
    try {
      const { 
        machineId, 
        status, 
        priority, 
        dueDateFrom, 
        dueDateTo, 
        assignedTo, 
        search,
        page = 1,
        limit = 10,
        sortBy,
        sortOrder = 'desc',
        requestingUser // User info for role-based filtering
      } = filters;
      
      console.log('History Service - Fetching completed history with filters:', filters);
      
      const where = {
        // Only show completed or skipped schedules in history
        status: {
          in: ['COMPLETED', 'SKIPPED']
        }
      };
      
      // Add additional status filter if provided
      if (status) {
        const mappedStatus = mapPMStatus(status);
        if (mappedStatus === 'COMPLETED' || mappedStatus === 'SKIPPED') {
          where.status = mappedStatus;
        }
      }
      
      if (machineId) {
        where.machineId = machineId;
      }
      
      if (priority) {
        const mappedPriority = mapPMPriority(priority);
        if (mappedPriority) {
          where.priority = mappedPriority;
        }
      }
      
      // Filter by completion date range
      if (dueDateFrom || dueDateTo) {
        where.completedAt = {};
        if (dueDateFrom) {
          where.completedAt.gte = new Date(dueDateFrom + 'T00:00:00.000Z');
        }
        if (dueDateTo) {
          where.completedAt.lte = new Date(dueDateTo + 'T23:59:59.999Z');
        }
      }
      
      // Role-based filtering
      if (requestingUser && requestingUser.role !== 'ADMIN') {
        console.log('Applying non-admin filtering for user:', requestingUser.id, 'role:', requestingUser.role);
        // Non-admin users can only see tasks assigned to them or completed by them
        if (assignedTo) {
          where.OR = [
            {
              assignedUsers: {
                some: {
                  userId: assignedTo
                }
              }
            },
            {
              completedBy: assignedTo
            }
          ];
        } else {
          // Show tasks assigned to or completed by the requesting user
          where.OR = [
            {
              assignedUsers: {
                some: {
                  userId: requestingUser.id
                }
              }
            },
            {
              completedBy: requestingUser.id
            }
          ];
        }
      } else if (assignedTo) {
        console.log('Admin user with assignedTo filter:', assignedTo);
        // Admin users can filter by any assignedTo or completedBy value
        where.OR = [
          {
            assignedUsers: {
              some: {
                userId: assignedTo
              }
            }
          },
          {
            completedBy: assignedTo
          }
        ];
      } else {
        console.log('Admin user - showing all completed/skipped tasks');
      }
      
      // Search functionality
      if (search) {
        const searchConditions = [
          { 
            machine: {
              name: { contains: search, mode: 'insensitive' }
            }
          },
          {
            machine: {
              machineCode: { contains: search, mode: 'insensitive' }
            }
          },
          {
            pmTemplate: {
              name: { contains: search, mode: 'insensitive' }
            }
          },
          {
            scheduleCode: { contains: search, mode: 'insensitive' }
          }
        ];
        
        // Combine search with existing OR conditions if they exist
        if (where.OR) {
          where.AND = [
            { OR: where.OR },
            { OR: searchConditions }
          ];
          delete where.OR;
        } else {
          where.OR = searchConditions;
        }
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build dynamic orderBy based on sortBy and sortOrder
      let orderBy = { completedAt: 'desc' }; // Default sorting - most recent first
      
      if (sortBy) {
        const validSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
        
        switch (sortBy) {
          case 'id':
            orderBy = { id: validSortOrder };
            break;
          case 'template_name':
            orderBy = { pmTemplate: { name: validSortOrder } };
            break;
          case 'machine_name':
            orderBy = { machine: { name: validSortOrder } };
            break;
          case 'company':
            orderBy = { machine: { company: { name: validSortOrder } } };
            break;
          case 'location':
            orderBy = { machine: { location: validSortOrder } };
            break;
          case 'status':
            orderBy = { status: validSortOrder };
            break;
          case 'priority':
            orderBy = { priority: validSortOrder };
            break;
          case 'completed_date':
          case 'completedAt':
            orderBy = { completedAt: validSortOrder };
            break;
          case 'operator_name':
            orderBy = { completedByUser: { fullName: validSortOrder } };
            break;
          case 'time_taken':
            orderBy = { startedAt: validSortOrder };
            break;
          default:
            // Keep default sorting if invalid sortBy
            orderBy = { completedAt: 'desc' };
        }
      }

      // Fetch history records
      const schedules = await prisma.pMSchedule.findMany({
        where,
        include: {
          machine: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  tel: true,
                  email: true,
                  address: true
                }
              },
              documents: true
            }
          },
          pmTemplate: {
            select: {
              id: true,
              name: true,
              description: true,
              durationMinutes: true,
              machineType: true,
              creator: {
                select: {
                  id: true,
                  fullName: true,
                  email: true
                }
              },
              items: true
            }
          },
          assignedUsers: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phoneNumber: true
                }
              },
              assignedByUser: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phoneNumber: true
                }
              }
            }
          },
          completedByUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true
            }
          },
          results: {
            include: {
              pmTemplateItem: true,
              photos: true
            }
          }
        },
        orderBy,
        skip: offset,
        take: parseInt(limit)
      });

      const total = await prisma.pMSchedule.count({ where });

      // Transform data for frontend
      const transformedSchedules = schedules.map(schedule => {
        // Calculate duration in hours
        let durationHours = null;
        if (schedule.startedAt && schedule.completedAt) {
          const duration = new Date(schedule.completedAt) - new Date(schedule.startedAt);
          durationHours = duration / (1000 * 60 * 60); // Convert milliseconds to hours
        }

        return {
          ...schedule,
          assignedTo: schedule.assignedUsers.map(au => au.userId),
          durationHours
        };
      });

      return {
        schedules: transformedSchedules,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      };
    } catch (error) {
      console.error('History Service Error:', error);
      throw new Error(`Failed to fetch history: ${error.message}`);
    }
  }

  /**
   * Get statistics for completed PM schedules
   * @param {Object} filters - Filter parameters (same as getCompletedHistory)
   * @returns {Object} - Statistics object
   */
  async getHistoryStats(filters = {}) {
    try {
      const { 
        machineId, 
        priority, 
        dueDateFrom, 
        dueDateTo, 
        assignedTo,
        requestingUser
      } = filters;
      
      const where = {
        status: {
          in: ['COMPLETED', 'SKIPPED']
        }
      };
      
      if (machineId) {
        where.machineId = machineId;
      }
      
      if (priority) {
        const mappedPriority = mapPMPriority(priority);
        if (mappedPriority) {
          where.priority = mappedPriority;
        }
      }
      
      if (dueDateFrom || dueDateTo) {
        where.completedAt = {};
        if (dueDateFrom) {
          where.completedAt.gte = new Date(dueDateFrom + 'T00:00:00.000Z');
        }
        if (dueDateTo) {
          where.completedAt.lte = new Date(dueDateTo + 'T23:59:59.999Z');
        }
      }
      
      // Role-based filtering
      if (requestingUser && requestingUser.role !== 'ADMIN') {
        if (assignedTo) {
          where.OR = [
            {
              assignedUsers: {
                some: {
                  userId: assignedTo
                }
              }
            },
            {
              completedBy: assignedTo
            }
          ];
        } else {
          where.OR = [
            {
              assignedUsers: {
                some: {
                  userId: requestingUser.id
                }
              }
            },
            {
              completedBy: requestingUser.id
            }
          ];
        }
      } else if (assignedTo) {
        where.OR = [
          {
            assignedUsers: {
              some: {
                userId: assignedTo
              }
            }
          },
          {
            completedBy: assignedTo
          }
        ];
      }

      // Get total count
      const total = await prisma.pMSchedule.count({ where });

      // Get completed count
      const completed = await prisma.pMSchedule.count({
        where: {
          ...where,
          status: 'COMPLETED'
        }
      });

      // Get skipped count
      const skipped = await prisma.pMSchedule.count({
        where: {
          ...where,
          status: 'SKIPPED'
        }
      });

      // Get priority breakdown
      const priorityBreakdown = await prisma.pMSchedule.groupBy({
        by: ['priority'],
        where,
        _count: true
      });

      const stats = {
        total,
        completed,
        skipped,
        byPriority: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        }
      };

      priorityBreakdown.forEach(item => {
        const priority = item.priority.toLowerCase();
        stats.byPriority[priority] = item._count;
      });

      return stats;
    } catch (error) {
      console.error('History Stats Service Error:', error);
      throw new Error(`Failed to fetch history stats: ${error.message}`);
    }
  }

  /**
   * Get unique machines that have completed PM schedules
   * @param {Object} filters - Filter parameters
   * @returns {Array} - Array of unique machines
   */
  async getUniqueMachines(filters = {}) {
    try {
      const { requestingUser } = filters;
      
      const where = {
        status: {
          in: ['COMPLETED', 'SKIPPED']
        }
      };

      // Role-based filtering
      if (requestingUser && requestingUser.role !== 'ADMIN') {
        where.OR = [
          {
            assignedUsers: {
              some: {
                userId: requestingUser.id
              }
            }
          },
          {
            completedBy: requestingUser.id
          }
        ];
      }

      const machines = await prisma.pMSchedule.findMany({
        where,
        distinct: ['machineId'],
        select: {
          machine: {
            select: {
              id: true,
              name: true,
              machineCode: true
            }
          }
        }
      });

      return machines.map(item => item.machine).filter(m => m !== null);
    } catch (error) {
      console.error('Get Unique Machines Error:', error);
      throw new Error(`Failed to fetch unique machines: ${error.message}`);
    }
  }

  /**
   * Get unique technicians who have completed PM schedules
   * @param {Object} filters - Filter parameters
   * @returns {Array} - Array of unique technicians
   */
  async getUniqueTechnicians(filters = {}) {
    try {
      const { requestingUser } = filters;
      
      const where = {
        status: {
          in: ['COMPLETED', 'SKIPPED']
        },
        completedBy: {
          not: null
        }
      };

      // Role-based filtering
      if (requestingUser && requestingUser.role !== 'ADMIN') {
        where.OR = [
          {
            assignedUsers: {
              some: {
                userId: requestingUser.id
              }
            }
          },
          {
            completedBy: requestingUser.id
          }
        ];
      }

      const technicians = await prisma.pMSchedule.findMany({
        where,
        distinct: ['completedBy'],
        select: {
          completedByUser: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      });

      return technicians.map(item => item.completedByUser).filter(t => t !== null);
    } catch (error) {
      console.error('Get Unique Technicians Error:', error);
      throw new Error(`Failed to fetch unique technicians: ${error.message}`);
    }
  }
}

module.exports = new HistoryService();
