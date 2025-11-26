const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Frequency type mapping for PM Template compatibility
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

// Helper function to map frequency type
const mapFrequencyType = (frequencyType) => {
  if (!frequencyType) return 'MONTHLY';
  return FREQUENCY_TYPE_MAPPING[frequencyType.toLowerCase()] || FREQUENCY_TYPE_MAPPING[frequencyType] || 'MONTHLY';
};

class PMTemplateService {
  // Get all PM templates
  async getAllPMTemplates(filters = {}) {
    try {
      const { 
        search,
        machineType,
        frequencyType,
        isActive,
        page = 1,
        limit = 10
      } = filters;
      
      const where = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      if (machineType) {
        where.machineType = machineType;
      }
      
      if (frequencyType) {
        where.frequencyType = frequencyType;
      }
      
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const templates = await prisma.pMTemplate.findMany({
        where,
        include: {
          items: {
            orderBy: {
              stepOrder: 'asc'
            }
          },
          creator: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          _count: {
            select: {
              schedules: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: parseInt(limit)
      });

      const total = await prisma.pMTemplate.count({ where });

      return {
        templates,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch PM templates: ${error.message}`);
    }
  }

  // Get PM template by ID
  async getPMTemplateById(id) {
    try {
      const template = await prisma.pMTemplate.findUnique({
        where: { id },
        include: {
          items: {
            orderBy: {
              stepOrder: 'asc'
            }
          },
          creator: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          schedules: {
            select: {
              id: true,
              scheduleCode: true,
              status: true,
              nextDueDate: true,
              machine: {
                select: {
                  id: true,
                  name: true,
                  machineCode: true
                }
              }
            },
            orderBy: {
              nextDueDate: 'asc'
            }
          }
        }
      });

      if (!template) {
        throw new Error('PM template not found');
      }

      return template;
    } catch (error) {
      throw new Error(`Failed to fetch PM template: ${error.message}`);
    }
  }

  // Create new PM template
  async createPMTemplate(data) {
    try {
      const {
        name,
        description,
        machineType,
        frequencyType,
        frequencyValue,
        durationMinutes,
        isActive = true,
        items = [],
        createdBy
      } = data;

      // Validate required fields
      if (!name || !frequencyType || !frequencyValue) {
        throw new Error('Name, frequency type, and frequency value are required');
      }

      const template = await prisma.pMTemplate.create({
        data: {
          name,
          description,
          machineType,
          frequencyType: mapFrequencyType(frequencyType),
          frequencyValue: parseInt(frequencyValue),
          durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
          isActive,
          createdBy,
          items: {
            create: items.map((item, index) => ({
              checkItem: item.description,
              stepOrder: item.stepOrder || index + 1,
              category: item.category,
              standardValue: item.expectedValue,
              unit: item.unit,
              method: item.instructions,
              toolsRequired: item.requiredTools ? item.requiredTools.join(', ') : undefined,
              isRequired: item.isRequired || false,
              hasPhoto: item.requiresPhoto || false,
              remarks: item.notes
            }))
          }
        },
        include: {
          items: {
            orderBy: {
              stepOrder: 'asc'
            }
          },
          creator: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      });

      return template;
    } catch (error) {
      throw new Error(`Failed to create PM template: ${error.message}`);
    }
  }

  // Update PM template
  async updatePMTemplate(id, data) {
    try {
      const {
        name,
        description,
        machineType,
        frequencyType,
        frequencyValue,
        durationMinutes,
        isActive,
        items = []
      } = data;

      const existingTemplate = await prisma.pMTemplate.findUnique({
        where: { id },
        include: {
          items: true
        }
      });

      if (!existingTemplate) {
        throw new Error('PM template not found');
      }

      // Use transaction to update template and items
      const template = await prisma.$transaction(async (prisma) => {
        // Update template
        const updatedTemplate = await prisma.pMTemplate.update({
          where: { id },
          data: {
            name,
            description,
            machineType,
            frequencyType: frequencyType ? mapFrequencyType(frequencyType) : undefined,
            frequencyValue: frequencyValue ? parseInt(frequencyValue) : undefined,
            durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
            isActive
          }
        });

        // Update items if provided
        if (items.length > 0) {
          // Get existing items
          const existingItems = await prisma.pMTemplateItem.findMany({
            where: { pmTemplateId: id },
            include: {
              _count: {
                select: { results: true }
              }
            }
          });

          // Track which existing items to keep (by ID)
          const existingItemIds = new Set(existingItems.map(item => item.id));
          const processedItemIds = new Set();

          // Update or create items
          for (let index = 0; index < items.length; index++) {
            const item = items[index];
            const itemData = {
              checkItem: item.description,
              stepOrder: item.stepOrder || index + 1,
              standardValue: item.expectedValue,
              unit: item.unit,
              remarks: item.notes,
              isRequired: item.isRequired || false,
              method: item.instructions,
              toolsRequired: item.requiredTools ? item.requiredTools.join(', ') : undefined,
              hasPhoto: item.requiresPhoto || false
            };

            // If item has an ID and exists, update it
            if (item.id && existingItemIds.has(item.id)) {
              await prisma.pMTemplateItem.update({
                where: { id: item.id },
                data: itemData
              });
              processedItemIds.add(item.id);
            } else {
              // Create new item
              const newItem = await prisma.pMTemplateItem.create({
                data: {
                  pmTemplateId: id,
                  ...itemData
                }
              });
              processedItemIds.add(newItem.id);
            }
          }

          // Delete only items that:
          // 1. Are not in the new items list
          // 2. Are not referenced by any PM results
          const itemsToDelete = existingItems.filter(
            item => !processedItemIds.has(item.id) && item._count.results === 0
          );

          if (itemsToDelete.length > 0) {
            await prisma.pMTemplateItem.deleteMany({
              where: {
                id: { in: itemsToDelete.map(item => item.id) }
              }
            });
          }

          // Log warning if some items couldn't be deleted due to references
          const itemsWithReferences = existingItems.filter(
            item => !processedItemIds.has(item.id) && item._count.results > 0
          );
          if (itemsWithReferences.length > 0) {
            console.warn(
              `Cannot delete ${itemsWithReferences.length} template items as they are referenced by PM results:`,
              itemsWithReferences.map(item => ({ id: item.id, checkItem: item.checkItem, resultCount: item._count.results }))
            );
          }
        }

        // Return updated template with items
        return await prisma.pMTemplate.findUnique({
          where: { id },
          include: {
            items: {
              orderBy: {
                stepOrder: 'asc'
              }
            },
            creator: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          }
        });
      });

      return template;
    } catch (error) {
      throw new Error(`Failed to update PM template: ${error.message}`);
    }
  }

  // Notify about template update (to be called after successful update)
  notifyTemplateUpdate(templateName, action = 'updated') {
    // This can be extended to send notifications via WebSocket, email, etc.
    console.log(`PM Template "${templateName}" has been ${action}`);
    return {
      type: 'template_update',
      templateName,
      action,
      timestamp: new Date(),
      message: `PM Template "${templateName}" ถูก${action === 'updated' ? 'อัปเดต' : action === 'created' ? 'สร้าง' : 'ดำเนินการ'}เรียบร้อยแล้ว`
    };
  }

  // Delete PM template
  async deletePMTemplate(id) {
    try {
      const existingTemplate = await prisma.pMTemplate.findUnique({
        where: { id },
        include: {
          schedules: true
        }
      });

      if (!existingTemplate) {
        throw new Error('PM template not found');
      }

      // Check if template has associated schedules
      if (existingTemplate.schedules.length > 0) {
        throw new Error('Cannot delete template with associated schedules');
      }

      // Delete template items first
      await prisma.pMTemplateItem.deleteMany({
        where: { pmTemplateId: id }
      });

      // Delete the template
      await prisma.pMTemplate.delete({
        where: { id }
      });

      return { message: 'PM template deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete PM template: ${error.message}`);
    }
  }

  // Get PM template categories
  async getPMTemplateCategories() {
    try {
      const categories = await prisma.pMTemplate.findMany({
        select: {
          category: true
        },
        distinct: ['category'],
        where: {
          category: {
            not: null
          }
        }
      });

      return categories.map(c => c.category).filter(Boolean);
    } catch (error) {
      throw new Error(`Failed to fetch PM template categories: ${error.message}`);
    }
  }

  // Get PM template statistics
  async getPMTemplateStats() {
    try {
      const [
        totalTemplates,
        activeTemplates,
        templatesByCategory,
        templatesByFrequency
      ] = await Promise.all([
        prisma.pMTemplate.count(),
        prisma.pMTemplate.count({ where: { isActive: true } }),
        prisma.pMTemplate.groupBy({
          by: ['category'],
          _count: {
            id: true
          },
          where: {
            category: {
              not: null
            }
          }
        }),
        prisma.pMTemplate.groupBy({
          by: ['frequencyType'],
          _count: {
            id: true
          }
        })
      ]);

      return {
        totalTemplates,
        activeTemplates,
        inactiveTemplates: totalTemplates - activeTemplates,
        templatesByCategory,
        templatesByFrequency
      };
    } catch (error) {
      throw new Error(`Failed to fetch PM template statistics: ${error.message}`);
    }
  }

  // Generate notification for template actions
  async notifyTemplateUpdate(action, template, userId) {
    try {
      const notificationData = {
        type: 'pm_template',
        action: action, // 'created', 'updated', 'deleted'
        title: '',
        message: '',
        data: {
          templateId: template.id,
          templateName: template.name,
          machineType: template.machineType,
          userId: userId,
          timestamp: new Date().toISOString()
        }
      };

      switch (action) {
        case 'created':
          notificationData.title = 'PM Template สร้างเรียบร้อย';
          notificationData.message = `เทมเพลต "${template.name}" ถูกสร้างเรียบร้อยแล้ว`;
          break;
        case 'updated':
          notificationData.title = 'PM Template อัปเดตเรียบร้อย';
          notificationData.message = `เทมเพลต "${template.name}" ถูกอัปเดตเรียบร้อยแล้ว`;
          break;
        case 'deleted':
          notificationData.title = 'PM Template ลบเรียบร้อย';
          notificationData.message = `เทมเพลต "${template.name}" ถูกลบเรียบร้อยแล้ว`;
          break;
        default:
          notificationData.title = 'PM Template';
          notificationData.message = `เทมเพลต "${template.name}" มีการเปลี่ยนแปลง`;
      }

      return notificationData;
    } catch (error) {
      throw new Error(`Failed to generate notification: ${error.message}`);
    }
  }
}

module.exports = new PMTemplateService();
