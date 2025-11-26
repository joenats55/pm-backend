const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

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

// Frequency type mapping
const FREQUENCY_TYPE_MAPPING = {
  'hourly': 'HOURLY',
  'daily': 'DAILY',
  'weekly': 'WEEKLY',
  'monthly': 'MONTHLY',
  // Also accept enum values directly
  'HOURLY': 'HOURLY',
  'DAILY': 'DAILY',
  'WEEKLY': 'WEEKLY',
  'MONTHLY': 'MONTHLY'
};

// Helper functions to map values
const mapPMStatus = (status) => {
  if (!status) return 'SCHEDULED';
  return PM_STATUS_MAPPING[status.toLowerCase()] || PM_STATUS_MAPPING[status] || 'SCHEDULED';
};

const mapPMPriority = (priority) => {
  if (!priority) return 'MEDIUM';
  return PM_PRIORITY_MAPPING[priority.toLowerCase()] || PM_PRIORITY_MAPPING[priority] || 'MEDIUM';
};

const mapFrequencyType = (frequencyType) => {
  if (!frequencyType) return 'MONTHLY';
  return FREQUENCY_TYPE_MAPPING[frequencyType.toLowerCase()] || FREQUENCY_TYPE_MAPPING[frequencyType] || 'MONTHLY';
};

class PMScheduleService {
  // Generate schedule code in format PM-<MACHINECODE>-YYYYMMDD-HHMM
  // Fallback order: machine.machineCode -> first 3 letters of machine.name -> 'UNK'
  generateScheduleCode(machine) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    let machineCode = '';
    if (machine) {
      if (machine.machineCode && String(machine.machineCode).trim() !== '') {
        machineCode = String(machine.machineCode).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
      } else if (machine.name) {
        machineCode = machine.name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
      }
    }
    if (!machineCode) machineCode = 'UNK';
    return `PM-${machineCode}-${year}${month}${day}-${hours}${minutes}`;
  }
  // Helper function to calculate next due date
  calculateNextDueDate(startDate, frequencyType, frequencyValue) {
    const date = new Date(startDate);
    const mappedFrequencyType = mapFrequencyType(frequencyType);
    
    switch (mappedFrequencyType) {
      case 'HOURLY':
        date.setHours(date.getHours() + frequencyValue);
        break;
      case 'DAILY':
        date.setDate(date.getDate() + frequencyValue);
        break;
      case 'WEEKLY':
        date.setDate(date.getDate() + (frequencyValue * 7));
        break;
      case 'MONTHLY':
        date.setMonth(date.getMonth() + frequencyValue);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }
    
    return date;
  }

  // Transform assignedTo from JSON string to array
  transformAssignedTo(assignedTo) {
    try {
      return typeof assignedTo === 'string' && assignedTo.startsWith('[') 
        ? JSON.parse(assignedTo) 
        : assignedTo;
    } catch (e) {
      return assignedTo;
    }
  }

  // Helper method to delete photo files from file system
  async deletePhotoFiles(photos) {
    const deletedFiles = [];
    
    for (const photo of photos) {
      try {
        if (!photo.photoUrl || !photo.fileName) {
          continue;
        }

        // Skip base64 encoded images or external URLs
        if (photo.photoUrl.startsWith('data:') || photo.photoUrl.startsWith('http')) {
          continue;
        }

        // Construct file path
        let filePath;
        if (photo.photoUrl.startsWith('/uploads/pm-photos/')) {
          // Server file path
          filePath = path.join(process.cwd(), 'uploads', 'pm-photos', photo.fileName);
        } else if (photo.photoUrl.startsWith('uploads/pm-photos/')) {
          // Relative path
          filePath = path.join(process.cwd(), photo.photoUrl);
        } else {
          // Try to extract filename from URL
          const urlParts = photo.photoUrl.split('/');
          const filename = urlParts[urlParts.length - 1];
          filePath = path.join(process.cwd(), 'uploads', 'pm-photos', filename);
        }

        // Check if file exists and delete it
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          deletedFiles.push(filePath);
          console.log(`Deleted photo file: ${filePath}`);
        } else {
          console.warn(`Photo file not found: ${filePath}`);
        }
      } catch (fileError) {
        console.warn(`Failed to delete photo file ${photo.fileName}:`, fileError.message);
        // Continue with other files even if one fails
      }
    }

    return deletedFiles;
  }

  // Helper method to delete a PM result and its associated photos
  async deletePMResult(resultId) {
    try {
      // Get the result with photos
      const result = await prisma.pMResult.findUnique({
        where: { id: resultId },
        include: {
          photos: true
        }
      });

      if (!result) {
        throw new Error('PM result not found');
      }

      // Delete photo files from file system
      if (result.photos.length > 0) {
        await this.deletePhotoFiles(result.photos);
      }

      // Delete the result (cascade will handle photos)
      await prisma.pMResult.delete({
        where: { id: resultId }
      });

      return {
        message: 'PM result deleted successfully',
        deletedPhotos: result.photos.length
      };
    } catch (error) {
      throw new Error(`Failed to delete PM result: ${error.message}`);
    }
  }

  // Get all PM schedules
  async getAllPMSchedules(filters = {}) {
    try {
      const { 
        machineId, 
        pmTemplateId, 
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
      
      console.log('PM Schedule Service - requestingUser:', requestingUser); // Debug log
      
      const where = {};
      
      if (machineId) {
        where.machineId = machineId;
      }
      
      if (pmTemplateId) {
        where.pmTemplateId = pmTemplateId;
      }
      
      if (status) {
        where.status = mapPMStatus(status);
      }
      
      if (priority) {
        where.priority = mapPMPriority(priority);
      }
      
      if (dueDateFrom && dueDateTo) {
        where.nextDueDate = {
          gte: new Date(dueDateFrom),
          lte: new Date(dueDateTo)
        };
      }
      
      // Role-based filtering
      if (requestingUser && requestingUser.role !== 'ADMIN') {
        console.log('Applying non-admin filtering for user:', requestingUser.id, 'role:', requestingUser.role); // Debug log
        // Non-admin users can only see tasks assigned to them
        if (assignedTo) {
          where.assignedUsers = {
            some: {
              userId: assignedTo
            }
          };
        } else {
          // If no specific assignedTo filter and user is not admin, 
          // show only tasks assigned to the requesting user
          where.assignedUsers = {
            some: {
              userId: requestingUser.id
            }
          };
        }
      } else if (assignedTo) {
        console.log('Admin user with assignedTo filter:', assignedTo); // Debug log
        // Admin users can filter by any assignedTo value
        where.assignedUsers = {
          some: {
            userId: assignedTo
          }
        };
      } else {
        console.log('Admin user - no additional filtering applied (showing all tasks)'); // Debug log
      }
      // Note: If requestingUser.role === 'ADMIN' and no assignedTo filter, 
      // no additional filtering is applied (admin sees all tasks)
      
      if (search) {
        const searchConditions = [
          { 
            machine: {
              name: { contains: search, mode: 'insensitive' }
            }
          },
          {
            pmTemplate: {
              name: { contains: search, mode: 'insensitive' }
            }
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
      let orderBy = { completedAt: 'desc' }; // Default sorting
      
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
              items: {
                orderBy: {
                  stepOrder: 'asc'
                }
              }
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
          completedByUser:{
            select: {
              fullName: true,
            }
          }
        },
        orderBy,
        skip: offset,
        take: parseInt(limit)
      });

      const total = await prisma.pMSchedule.count({ where });

      // Transform assignedTo from new relationship structure to array for backward compatibility
      const transformedSchedules = schedules.map(schedule => ({
        ...schedule,
        assignedTo: schedule.assignedUsers.map(au => au.userId)
      }));

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
      throw new Error(`Failed to fetch PM schedules: ${error.message}`);
    }
  }

  // Get PM schedule by ID
  async getPMScheduleById(id) {
    try {
      const schedule = await prisma.pMSchedule.findUnique({
        where: { id },
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
            include: {
              creator: {
                select: {
                  id: true,
                  fullName: true,
                  email: true
                }
              },
              items: {
                orderBy: {
                  stepOrder: 'asc'
                }
              }
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
          results: {
            include: {
              pmTemplateItem: true,
              photos: true
            }
          }
        }
      });

      if (!schedule) {
        throw new Error('PM schedule not found');
      }

      // Transform assignedTo from new relationship structure to array for backward compatibility
      const transformedSchedule = {
        ...schedule,
        assignedTo: schedule.assignedUsers.map(au => au.userId)
      };

      return transformedSchedule;
    } catch (error) {
      throw new Error(`Failed to fetch PM schedule: ${error.message}`);
    }
  }

  // Get execution history for PM schedule
  async getExecutionHistory(scheduleId) {
    try {
      // Get all historical PM schedules for the same machine and template
      const currentSchedule = await prisma.pMSchedule.findUnique({
        where: { id: scheduleId },
        include: {
          machine: true,
          pmTemplate: true
        }
      });

      if (!currentSchedule) {
        throw new Error('PM schedule not found');
      }

      // Get historical executions for the same machine and template
      const history = await prisma.pMSchedule.findMany({
        where: {
          machineId: currentSchedule.machineId,
          pmTemplateId: currentSchedule.pmTemplateId,
          status: mapPMStatus('completed'),
          completedAt: {
            not: null
          }
        },
        include: {
          results: {
            include: {
              pmTemplateItem: true,
              photos: true, // Include photos
              checkedByUser: {
                select: {
                  id: true,
                  fullName: true,
                  email: true
                }
              },
              approvedByUser: {
                select: {
                  id: true,
                  fullName: true,
                  email: true
                }
              }
            }
          },
          completedByUser: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        },
        orderBy: {
          completedAt: 'desc'
        }
      });

      return history;
    } catch (error) {
      throw new Error(`Failed to fetch execution history: ${error.message}`);
    }
  }

  // Create new PM schedule
  async createPMSchedule(data) {
    try {
      const {
        pmTemplateId,
        machineId,
        scheduleCode: providedScheduleCode,
        nextDueDate: providedDueDate,
        priority = 'medium',
        assignedTo,
        assignedBy, // เพิ่มฟิลด์ assignedBy
        remarks,
        estimatedHours
      } = data;

      // Validate required fields
      if (!pmTemplateId || !machineId || !providedDueDate) {
        throw new Error('PM Template ID, Machine ID, and Due Date are required');
      }

      // Get template to calculate next due date
      const template = await prisma.pMTemplate.findUnique({
        where: { id: pmTemplateId }
      });

      if (!template) {
        throw new Error('PM template not found');
      }

      // Calculate next due date or use provided due date
      const nextDueDate = providedDueDate ? new Date(providedDueDate) : this.calculateNextDueDate(
        new Date(), 
        template.frequencyType, 
        template.frequencyValue
      );

      // Use provided schedule code or generate one with machine context
      let scheduleCode = providedScheduleCode;
      if (!scheduleCode) {
        const machine = await prisma.machine.findUnique({
          where: { id: machineId },
          select: { id: true, name: true, machineCode: true }
        });
        scheduleCode = this.generateScheduleCode(machine);
      }

      // Prepare assignedTo as array
      const assignedUsers = Array.isArray(assignedTo) ? assignedTo : (assignedTo ? [assignedTo] : []);

      const schedule = await prisma.pMSchedule.create({
        data: {
          pmTemplateId,
          machineId,
          scheduleCode,
          nextDueDate,
          priority: mapPMPriority(priority),
          estimatedHours,
          remarks,
          status: mapPMStatus('scheduled'),
          assignedUsers: {
            create: assignedUsers.map(userId => ({
              userId: userId,
              assignedAt: new Date(),
              assignedBy: assignedBy // เพิ่มข้อมูลผู้มอบหมาย
            }))
          }
        },
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
              }
            }
          },
          pmTemplate: {
            select: {
              id: true,
              name: true,
              description: true
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
          }
        }
      });

      // Transform the result to include assignedTo as array for backward compatibility
      const transformedSchedule = {
        ...schedule,
        assignedTo: schedule.assignedUsers.map(au => au.userId)
      };

      return transformedSchedule;
    } catch (error) {
      throw new Error(`Failed to create PM schedule: ${error.message}`);
    }
  }

  // Update PM schedule
  async updatePMSchedule(id, data) {
    try {
      const {
        scheduledDate,
        nextDueDate, // เพิ่มฟิลด์ nextDueDate
        priority,
        assignedTo,
        assignedBy, // เพิ่มฟิลด์ assignedBy
        notes,
        remarks, // เพิ่มฟิลด์ remarks
        estimatedHours, // เพิ่มฟิลด์ estimatedHours
        status
      } = data;

      const existingSchedule = await prisma.pMSchedule.findUnique({
        where: { id },
        include: {
          pmTemplate: true
        }
      });

      if (!existingSchedule) {
        throw new Error('PM schedule not found');
      }

      const updateData = {};
      
      if (scheduledDate) {
        updateData.scheduledDate = new Date(scheduledDate);
        // Recalculate next due date if scheduled date changes
        updateData.nextDueDate = this.calculateNextDueDate(
          scheduledDate,
          existingSchedule.pmTemplate.frequencyType,
          existingSchedule.pmTemplate.frequencyValue
        );
      }
      
      // Allow direct nextDueDate update
      if (nextDueDate) {
        updateData.nextDueDate = new Date(nextDueDate);
      }
      
      if (priority) updateData.priority = mapPMPriority(priority);
      if (notes !== undefined) updateData.notes = notes;
      if (remarks !== undefined) updateData.remarks = remarks;
      if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours;
      if (status) updateData.status = mapPMStatus(status);

      // Handle assignedUsers relationship update
      if (assignedTo) {
        const assignedUsers = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
        updateData.assignedUsers = {
          deleteMany: {}, // Remove all existing assignments
          create: assignedUsers.map(userId => ({
            userId: userId,
            assignedAt: new Date(),
            assignedBy: assignedBy // เพิ่มข้อมูลผู้มอบหมาย
          }))
        };
      }

      const schedule = await prisma.pMSchedule.update({
        where: { id },
        data: updateData,
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
              }
            }
          },
          pmTemplate: {
            select: {
              id: true,
              name: true,
              description: true
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
          }
        }
      });

      return schedule;
    } catch (error) {
      throw new Error(`Failed to update PM schedule: ${error.message}`);
    }
  }

  // Delete PM schedule
  async deletePMSchedule(id) {
    try {
      const existingSchedule = await prisma.pMSchedule.findUnique({
        where: { id },
        include: {
          results: {
            include: {
              photos: true
            }
          }
        }
      });

      if (!existingSchedule) {
        throw new Error('PM schedule not found');
      }

      // Collect all photo files that need to be deleted
      const allPhotos = [];
      for (const result of existingSchedule.results) {
        allPhotos.push(...result.photos);
      }

      // Signature file deletion (if exists)
      let signatureDeleted = false;
      if (existingSchedule.customerSignatureUrl) {
        try {
          // Only delete local files under /uploads/signatures/
            if (existingSchedule.customerSignatureUrl.startsWith('/uploads/signatures/')) {
              const path = require('path');
              const fs = require('fs');
              const sigPath = path.join(__dirname, '../../', existingSchedule.customerSignatureUrl);
              if (fs.existsSync(sigPath)) {
                fs.unlinkSync(sigPath);
                signatureDeleted = true;
              }
            }
        } catch (sigErr) {
          console.warn('Failed to delete signature file:', sigErr.message);
        }
      }

      // Delete photo files from file system
      const deletedFiles = await this.deletePhotoFiles(allPhotos);

      // Delete related results and photos (cascade will handle PMResultPhoto)
      await prisma.pMResult.deleteMany({
        where: { pmScheduleId: id }
      });

      // Delete the schedule
      await prisma.pMSchedule.delete({
        where: { id }
      });

      return { 
        message: 'PM schedule deleted successfully',
        deletedPhotos: allPhotos.length,
        deletedFiles: deletedFiles.length,
        signatureDeleted
      };
    } catch (error) {
      throw new Error(`Failed to delete PM schedule: ${error.message}`);
    }
  }

  // Execute PM schedule
  // Start PM schedule execution
  async startPMSchedule(id, userId) {
    try {
      const schedule = await prisma.pMSchedule.findUnique({
        where: { id },
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
              }
            }
          },
          pmTemplate: {
            include: {
              items: true
            }
          }
        }
      });

      if (!schedule) {
        throw new Error('PM schedule not found');
      }

      if (schedule.status === mapPMStatus('completed')) {
        throw new Error('PM schedule is already completed');
      }

      // Update schedule: set status in_progress and startedAt if not already set
      const updateData = {
        status: mapPMStatus('in_progress'),
        startedAt: schedule.startedAt ? schedule.startedAt : new Date()
      };

      const updatedSchedule = await prisma.pMSchedule.update({
        where: { id },
        data: updateData,
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
              }
            }
          },
          pmTemplate: {
            include: {
              items: true
            }
          }
        }
      });

  return updatedSchedule;
    } catch (error) {
      console.error('Error starting PM schedule:', error);
      throw new Error(`Failed to start PM schedule: ${error.message}`);
    }
  }

  // Save individual PM step result
  async savePMStepResult(scheduleId, stepData, userId) {
    try {
      const {
        pmTemplateItemId,
        result,
        measuredValue,
        remarks,
        beforePhotos = [],
        afterPhotos = [],
        stepOrder
      } = stepData;

      const schedule = await prisma.pMSchedule.findUnique({
        where: { id: scheduleId },
        include: {
          pmTemplate: {
            include: {
              items: true
            }
          }
        }
      });

      if (!schedule) {
        throw new Error('PM schedule not found');
      }

      // Validate that the PM template item exists
      const templateItem = schedule.pmTemplate?.items.find(item => item.id === pmTemplateItemId);
      if (!templateItem) {
        throw new Error('PM template item not found');
      }

      // Check if PM result already exists for this step
      let pmResult = await prisma.pMResult.findFirst({
        where: {
          pmScheduleId: scheduleId,
          pmTemplateItemId: pmTemplateItemId
        }
      });

      // If PM result exists, update it. Otherwise, create new one.
      if (pmResult) {
        pmResult = await prisma.pMResult.update({
          where: { id: pmResult.id },
          data: {
            result: result || null,
            measuredValue: measuredValue || null,
            checkedBy: userId || 'system',
            checkedAt: new Date(),
            remarks: remarks || null
          }
        });
      } else {
        pmResult = await prisma.pMResult.create({
          data: {
            pmScheduleId: scheduleId,
            pmTemplateItemId: pmTemplateItemId,
            result: result || null,
            measuredValue: measuredValue || null,
            checkedBy: userId || 'system',
            checkedAt: new Date(),
            remarks: remarks || null
          }
        });
      }

      // Handle photos - delete existing photos first if updating
      if (pmResult) {
        // Get existing photos before deleting from database
        const existingPhotos = await prisma.pMResultPhoto.findMany({
          where: { pmResultId: pmResult.id }
        });

        // Delete existing photo files from file system
        if (existingPhotos.length > 0) {
          await this.deletePhotoFiles(existingPhotos);
        }

        // Delete existing photo records from database
        await prisma.pMResultPhoto.deleteMany({
          where: { pmResultId: pmResult.id }
        });

        // Prepare photo entries
        const photoEntries = [];

        // Add before photos
        if (beforePhotos && beforePhotos.length > 0) {
          beforePhotos.forEach((photoUrl, index) => {
            let fileName = `before_${index + 1}.jpg`;
            if (photoUrl.includes('/uploads/')) {
              fileName = photoUrl.split('/').pop() || fileName;
            } else if (photoUrl.startsWith('data:image')) {
              fileName = `before_${Date.now()}_${index + 1}.jpg`;
            }
            
            photoEntries.push({
              pmResultId: pmResult.id,
              photoUrl: photoUrl,
              fileName: fileName,
              photoType: 'BEFORE',
              description: `Before maintenance photo ${index + 1}`
            });
          });
        }

        // Add after photos
        if (afterPhotos && afterPhotos.length > 0) {
          afterPhotos.forEach((photoUrl, index) => {
            let fileName = `after_${index + 1}.jpg`;
            if (photoUrl.includes('/uploads/')) {
              fileName = photoUrl.split('/').pop() || fileName;
            } else if (photoUrl.startsWith('data:image')) {
              fileName = `after_${Date.now()}_${index + 1}.jpg`;
            }
            
            photoEntries.push({
              pmResultId: pmResult.id,
              photoUrl: photoUrl,
              fileName: fileName,
              photoType: 'AFTER',
              description: `After maintenance photo ${index + 1}`
            });
          });
        }

        // Create photo records if any exist
        if (photoEntries.length > 0) {
          await prisma.pMResultPhoto.createMany({
            data: photoEntries
          });
        }
      }

      // Check if this is the first step being saved (no other results exist yet)
      const existingResultsCount = await prisma.pMResult.count({
        where: { 
          pmScheduleId: scheduleId,
          id: { not: pmResult.id } // Exclude the current result we just created/updated
        }
      });

      // Update schedule status to IN_PROGRESS and set startedAt if not already
      const updateData = {};
      if (schedule.status === 'SCHEDULED') {
        updateData.status = 'IN_PROGRESS';
      }
      
      // Set startedAt if this is the first step being saved and startedAt is not set
      if (existingResultsCount === 0 && !schedule.startedAt) {
        updateData.startedAt = new Date();
      }

      // Only update if there's data to update
      if (Object.keys(updateData).length > 0) {
        await prisma.pMSchedule.update({
          where: { id: scheduleId },
          data: updateData
        });
      }

      // Return the updated PM result with photos
      const updatedResult = await prisma.pMResult.findUnique({
        where: { id: pmResult.id },
        include: {
          photos: true,
          pmTemplateItem: true,
          checkedByUser: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      });

      return updatedResult;
    } catch (error) {
      throw new Error(`Failed to save PM step result: ${error.message}`);
    }
  }

  // Execute PM schedule
  async executePMSchedule(id, data, userId) {
    try {
      const {
        results,
        overallStatus,
        executorNotes,
        startedAt,
        completedAt = new Date()
      } = data;

      const schedule = await prisma.pMSchedule.findUnique({
        where: { id },
        include: {
          pmTemplate: true
        }
      });

      if (!schedule) {
        throw new Error('PM schedule not found');
      }

      // Start transaction
      const result = await prisma.$transaction(async (prisma) => {
        // Create PM results only if results array is not empty
        // (Skip if results were already saved step by step)
        if (results && results.length > 0) {
          for (const result of results) {
            // Validate required fields
            if (!result.templateItemId) {
              console.warn('Missing templateItemId for result:', result);
              continue; // Skip this result if templateItemId is missing
            }

            // Check if PM result already exists for this step
            let pmResult = await prisma.pMResult.findFirst({
              where: {
                pmScheduleId: id,
                pmTemplateItemId: result.templateItemId
              }
            });

            // If PM result exists, update it. Otherwise, create new one.
            if (pmResult) {
              // Update existing result
              pmResult = await prisma.pMResult.update({
                where: { id: pmResult.id },
                data: {
                  result: result.status === 'PASS' ? 'ปกติ' : result.status === 'FAIL' ? 'ผิดปกติ' : 'ไม่สามารถตรวจสอบได้',
                  measuredValue: result.measuredValue,
                  checkedBy: userId || 'system',
                  checkedAt: new Date(result.completedAt || completedAt),
                  remarks: result.notes
                }
              });
            } else {
              // Create new result
              pmResult = await prisma.pMResult.create({
                data: {
                  pmScheduleId: id,
                  pmTemplateItemId: result.templateItemId, // Correct field mapping
                  result: result.status === 'PASS' ? 'ปกติ' : result.status === 'FAIL' ? 'ผิดปกติ' : 'ไม่สามารถตรวจสอบได้',
                  measuredValue: result.measuredValue,
                  checkedBy: userId || 'system',
                  checkedAt: new Date(result.completedAt || completedAt),
                  remarks: result.notes
                }
              });
            }

            // Handle photos - delete existing photos first if updating
            if (pmResult) {
              await prisma.pMResultPhoto.deleteMany({
                where: { pmResultId: pmResult.id }
              });
            }

            // Handle before and after photos using PMResultPhoto model
            const photoEntries = [];
            
            // Add before photos
            if (result.beforePhotos && Array.isArray(result.beforePhotos)) {
              result.beforePhotos.forEach((photoUrl, index) => {
                // Extract filename from URL for file_name field
                let fileName = `before_${index + 1}.jpg`;
                if (photoUrl.includes('/uploads/')) {
                  fileName = photoUrl.split('/').pop() || fileName;
                } else if (photoUrl.startsWith('data:image')) {
                  fileName = `before_${Date.now()}_${index + 1}.jpg`;
                }
                
                photoEntries.push({
                  pmResultId: pmResult.id,
                  photoUrl: photoUrl,
                  fileName: fileName,
                  photoType: 'BEFORE',
                  description: `Before maintenance photo ${index + 1}`
                });
              });
            }

            // Add after photos
            if (result.afterPhotos && Array.isArray(result.afterPhotos)) {
              result.afterPhotos.forEach((photoUrl, index) => {
                // Extract filename from URL for file_name field
                let fileName = `after_${index + 1}.jpg`;
                if (photoUrl.includes('/uploads/')) {
                  fileName = photoUrl.split('/').pop() || fileName;
                } else if (photoUrl.startsWith('data:image')) {
                  fileName = `after_${Date.now()}_${index + 1}.jpg`;
                }
                
                photoEntries.push({
                  pmResultId: pmResult.id,
                  photoUrl: photoUrl,
                  fileName: fileName,
                  photoType: 'AFTER',
                  description: `After maintenance photo ${index + 1}`
                });
              });
            }

            // Handle new unified photos array
            if (result.photos && Array.isArray(result.photos)) {
              result.photos.forEach((photo, index) => {
                const photoUrl = photo.photoUrl || photo.url || photo;
                
                // Extract filename from URL for file_name field
                let fileName = `photo_${index + 1}.jpg`;
                if (photoUrl.includes('/uploads/')) {
                  fileName = photoUrl.split('/').pop() || fileName;
                } else if (photoUrl.startsWith('data:image')) {
                  fileName = `photo_${Date.now()}_${index + 1}.jpg`;
                }
                
                photoEntries.push({
                  pmResultId: pmResult.id,
                  photoUrl: photoUrl,
                  fileName: fileName,
                  photoType: photo.photoType || 'EVIDENCE',
                  description: photo.description || 'Maintenance photo'
                });
              });
            }

            // Create photo records if any exist
            if (photoEntries.length > 0) {
              console.log('Creating photo entries:', photoEntries);
              await prisma.pMResultPhoto.createMany({
                data: photoEntries
              });
            }
          }
        }

        // Calculate next due date
        const nextDueDate = this.calculateNextDueDate(
          new Date(),
          schedule.pmTemplate.frequencyType,
          schedule.pmTemplate.frequencyValue
        );

        // Update schedule
        const updatedSchedule = await prisma.pMSchedule.update({
          where: { id },
          data: {
            status: mapPMStatus('completed'),
            lastDoneDate: new Date(completedAt),
            nextDueDate,
            remarks: executorNotes,
            startedAt: startedAt ? new Date(startedAt) : null,
            completedAt: new Date(completedAt),
            completedBy: userId || 'system'
          },
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
                }
              }
            },
            pmTemplate: {
              select: {
                id: true,
                name: true,
                description: true
              }
            },
            results: {
              include: {
                pmTemplateItem: true,
                photos: true
              }
            }
          }
        });

        return updatedSchedule;
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to execute PM schedule: ${error.message}`);
    }
  }

  // Upload photos for PM Result
  async uploadPMResultPhotos(pmResultId, photos, userId) {
    try {
      // Validate PM result exists
      const pmResult = await prisma.pMResult.findUnique({
        where: { id: pmResultId }
      });

      if (!pmResult) {
        throw new Error('PM result not found');
      }

      // Process and create photo records
      const photoData = photos.map(photo => ({
        pmResultId,
        photoUrl: photo.url,
        photoType: photo.type || 'EVIDENCE', // BEFORE, AFTER, EVIDENCE, REFERENCE
        fileName: photo.fileName || 'unknown',
        description: photo.description || null
      }));

      const createdPhotos = await prisma.pMResultPhoto.createMany({
        data: photoData,
        skipDuplicates: true
      });

      return createdPhotos;
    } catch (error) {
      throw new Error(`Failed to upload PM result photos: ${error.message}`);
    }
  }

  // Get photos for PM Result
  async getPMResultPhotos(pmResultId, photoType = null) {
    try {
      const whereClause = { pmResultId };
      if (photoType) {
        whereClause.photoType = photoType;
      }

      const photos = await prisma.pMResultPhoto.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'asc'
        }
      });

      return photos;
    } catch (error) {
      throw new Error(`Failed to fetch PM result photos: ${error.message}`);
    }
  }

  // Delete PM Result photo
  async deletePMResultPhoto(photoId, userId) {
    try {
      const photo = await prisma.pMResultPhoto.findUnique({
        where: { id: photoId }
      });

      if (!photo) {
        throw new Error('Photo not found');
      }

      // Optional: Check if user has permission to delete this photo
      // You can add role-based checks here

      await prisma.pMResultPhoto.delete({
        where: { id: photoId }
      });

      return { message: 'Photo deleted successfully', deletedPhoto: photo };
    } catch (error) {
      throw new Error(`Failed to delete PM result photo: ${error.message}`);
    }
  }

  // Update before/after photos arrays in PMResult (for backward compatibility)
  async updatePMResultPhotos(pmResultId, beforePhotos = [], afterPhotos = []) {
    try {
      const updatedResult = await prisma.pMResult.update({
        where: { id: pmResultId },
        data: {
          beforePhotos: beforePhotos,
          afterPhotos: afterPhotos
        },
        include: {
          photos: true
        }
      });

      return updatedResult;
    } catch (error) {
      throw new Error(`Failed to update PM result photos: ${error.message}`);
    }
  }

  // Complete PM Schedule
  async completePMSchedule(id, completionData) {
    try {
  const { completedBy: userId, startedAt, overallStatus, remarks, customerSignatureUrl, customerSignerName, customerSignedAt } = completionData;
      
      const schedule = await prisma.pMSchedule.findUnique({
        where: { id: id },
        include: {
          results: {
            include: {
              photos: true
            }
          },
          pmTemplate: {
            include: {
              items: true
            }
          },
          assignedUsers: true,
          machine: { select: { id: true, name: true, machineCode: true } }
        }
      });

      if (!schedule) {
        throw new Error('PM Schedule not found');
      }

      // Calculate next due date based on PM template frequency
      const nextDueDate = this.calculateNextDueDateFromTemplate(schedule.pmTemplate, new Date());

      // Update current schedule status to completed
      const updateData = {
        status: mapPMStatus('completed'),
        completedAt: new Date(),
        remarks: remarks,
        lastDoneDate: new Date(),
        customerSignatureUrl: customerSignatureUrl || null,
        customerSignerName: customerSignerName || null,
        customerSignedAt: customerSignatureUrl ? (customerSignedAt || new Date()) : null,
        ...(userId ? { completedByUser: { connect: { id: userId } } } : {})
      };

      let updatedSchedule;
      try {
        updatedSchedule = await prisma.pMSchedule.update({
          where: { id: id },
          data: updateData,
          include: {
            machine: true,
            assignedUsers: {
              include: {
                user: {
                  select: { id: true, username: true, fullName: true, email: true }
                }
              }
            },
            completedByUser: { select: { id: true, username: true, fullName: true, email: true } },
            results: { include: { photos: true } }
          }
        });
      } catch (err) {
        if (/(customerSignatureUrl|customerSignerName|customerSignedAt|completedByUser)/i.test(err.message)) {
          console.warn('[PM Schedule] Signature fields missing in Prisma client or DB. Run migration to add signature fields. Falling back without signature fields.');
          const fallbackData = { ...updateData };
          delete fallbackData.customerSignatureUrl;
          delete fallbackData.customerSignerName;
          delete fallbackData.customerSignedAt;
          // Also remove relation if causes issue
          delete fallbackData.completedByUser;
          updatedSchedule = await prisma.pMSchedule.update({
            where: { id: id },
            data: fallbackData,
            include: {
              machine: true,
              assignedUsers: { include: { user: { select: { id: true, username: true, fullName: true, email: true } } } },
              completedByUser: { select: { id: true, username: true, fullName: true, email: true } },
              results: { include: { photos: true } }
            }
          });
          // Attach a transient warning flag
          updatedSchedule.__missingSignatureMigration = true;
        } else {
          throw err;
        }
      }

      // Create next PM schedule automatically using reusable generator
      const newScheduleCode = this.generateScheduleCode(schedule.machine);
      
      // Get assigned users for new schedule
      const assignedUserIds = schedule.assignedUsers.map(assignment => assignment.userId);
      
      const newSchedule = await prisma.pMSchedule.create({
        data: {
          pmTemplateId: schedule.pmTemplateId,
          machineId: schedule.machineId,
          scheduleCode: newScheduleCode,
          nextDueDate: nextDueDate,
          priority: schedule.priority, // Use same priority as completed schedule
          estimatedHours: schedule.estimatedHours,
          remarks: `สร้างจากการเสร็จสิ้น PM: ${schedule.scheduleCode}`,
          status: mapPMStatus('scheduled'),
          assignedUsers: {
            create: assignedUserIds.map(userId => ({
              userId: userId,
              assignedAt: new Date(),
              assignedBy: userId // ใช้ userId ของผู้ทำ PM เป็นผู้มอบหมาย
            }))
          }
        },
        include: {
          machine: {
            select: {
              id: true,
              name: true,
              machineCode: true,
              location: true
            }
          },
          pmTemplate: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          assignedUsers: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true
                }
              }
            }
          }
        }
      });

      // Return both completed schedule and new schedule info
      return {
        ...updatedSchedule,
        nextSchedule: newSchedule
      };
    } catch (error) {
      throw new Error(`Failed to complete PM schedule: ${error.message}`);
    }
  }

  // Helper method to calculate next due date from PM template
  calculateNextDueDateFromTemplate(pmTemplate, fromDate) {
    const date = new Date(fromDate);
    
    if (!pmTemplate) {
      // Default to monthly if no template
      date.setMonth(date.getMonth() + 1);
      return date;
    }
    
    const { frequencyType, frequencyValue } = pmTemplate;
    
    switch (frequencyType?.toLowerCase()) {
      case 'daily':
        date.setDate(date.getDate() + (frequencyValue || 1));
        break;
      case 'weekly':
        date.setDate(date.getDate() + (frequencyValue || 1) * 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + (frequencyValue || 1));
        break;
      case 'hourly':
        date.setHours(date.getHours() + (frequencyValue || 1));
        break;
      default:
        // Default to monthly if frequency type is not recognized
        date.setMonth(date.getMonth() + 1);
    }
    
    return date;
  }

  // Helper method to calculate next due date (legacy method, kept for compatibility)
  calculateNextDueDate(frequency, fromDate) {
    const date = new Date(fromDate);
    
    switch (frequency?.toLowerCase()) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'semi-annually':
        date.setMonth(date.getMonth() + 6);
        break;
      case 'annually':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        // Default to monthly if frequency is not recognized
        date.setMonth(date.getMonth() + 1);
    }
    
    return date;
  }

  // Get dashboard statistics
  async getDashboardStats() {
    try {
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const [
        totalSchedules,
        overdueSchedules,
        dueThisWeek,
        dueThisMonth,
        completedThisMonth,
        inProgress
      ] = await Promise.all([
        prisma.pMSchedule.count(),
        prisma.pMSchedule.count({
          where: {
            nextDueDate: { lt: now },
            status: { in: [mapPMStatus('scheduled'), mapPMStatus('in_progress')] }
          }
        }),
        prisma.pMSchedule.count({
          where: {
            nextDueDate: { 
              gte: now,
              lte: weekFromNow 
            },
            status: { in: [mapPMStatus('scheduled'), mapPMStatus('in_progress')] }
          }
        }),
        prisma.pMSchedule.count({
          where: {
            nextDueDate: { 
              gte: now,
              lte: monthFromNow 
            },
            status: { in: [mapPMStatus('scheduled'), mapPMStatus('in_progress')] }
          }
        }),
        prisma.pMSchedule.count({
          where: {
            status: mapPMStatus('completed'),
            lastDoneDate: {
              gte: new Date(now.getFullYear(), now.getMonth(), 1)
            }
          }
        }),
        prisma.pMSchedule.count({
          where: {
            status: mapPMStatus('in_progress')
          }
        })
      ]);

      return {
        totalSchedules,
        overdueSchedules,
        dueThisWeek,
        dueThisMonth,
        completedThisMonth,
        inProgress,
        upcomingSchedules: dueThisWeek
      };
    } catch (error) {
      throw new Error(`Failed to fetch dashboard statistics: ${error.message}`);
    }
  }
}

module.exports = new PMScheduleService();
