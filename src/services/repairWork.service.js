const { PrismaClient } = require("@prisma/client");
const path = require("path");
const fs = require("fs");
const notificationService = require("./notification.service");

const prisma = new PrismaClient();

class RepairWorkService {
  // Get all repair works with filtering and pagination
  async getAllRepairWorks(filters = {}, pagination = {}) {
    try {
      const {
        status,
        excludeStatus,
        priority,
        machineId,
        assignedTo,
        reportedBy,
      } = filters;

      const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = pagination;

      const where = {};

      if (status) where.status = status;
      if (excludeStatus) where.status = { not: excludeStatus };
      if (priority) where.priority = priority;
      if (machineId) where.machineId = machineId;
      if (assignedTo) where.assignedTo = assignedTo;
      if (reportedBy) where.reportedBy = reportedBy;

      const skip = (page - 1) * limit;

      const [repairWorks, total] = await Promise.all([
        prisma.repairWork.findMany({
          where,
          include: {
            machine: {
              select: {
                id: true,
                name: true,
                machineCode: true,
                location: true,
                company: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            reportedByUser: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            assignedToUser: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            pmSchedule: {
              select: {
                id: true,
                scheduleCode: true,
              },
            },
            items: {
              orderBy: {
                itemOrder: "asc",
              },
            },
            _count: {
              select: {
                photos: true,
                partsUsed: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: {
            [sortBy]: sortOrder,
          },
        }),
        prisma.repairWork.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        repairWorks: await Promise.all(
          repairWorks.map(async (rw) => {
            let assignedToUsers = [];
            try {
              // Try loading assignments if the relation exists in the client
              const assignments = await prisma.repairWorkAssignment.findMany({
                where: { repairWorkId: rw.id },
                include: {
                  user: { select: { id: true, fullName: true, email: true } },
                  assignedByUser: {
                    select: { id: true, fullName: true, email: true },
                  },
                },
              });
              assignedToUsers = assignments.map((a) => ({
                ...a.user,
                assignedBy: a.assignedByUser
                  ? {
                      id: a.assignedByUser.id,
                      fullName: a.assignedByUser.fullName,
                    }
                  : null,
                assignedAt: a.assignedAt,
              }));
            } catch (e) {
              // Likely client generated before schema update; silently ignore
            }
            return { ...rw, assignedToUsers };
          })
        ),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get repair works: ${error.message}`);
    }
  }

  // Get repair work by ID
  async getRepairWorkById(id) {
    try {
      const repairWork = await prisma.repairWork.findUnique({
        where: { id },
        include: {
          machine: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          pmSchedule: {
            include: {
              pmTemplate: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          reportedByUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
            },
          },
          assignedToUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
            },
          },
          approvedByUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          items: {
            include: {
              assignedToUser: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
              completedByUser: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
            orderBy: {
              itemOrder: "asc",
            },
          },
          photos: {
            include: {
              takenByUser: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
            orderBy: {
              takenAt: "desc",
            },
          },
          partsUsed: {
            include: {
              machinePart: {
                select: {
                  id: true,
                  partCode: true,
                  partName: true,
                  uom: true,
                },
              },
              usedByUser: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
      });

      if (!repairWork) {
        throw new Error("Repair work not found");
      }

      let assignedToUsers = [];
      try {
        const assignments = await prisma.repairWorkAssignment.findMany({
          where: { repairWorkId: id },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
              },
            },
            assignedByUser: { select: { id: true, fullName: true } },
          },
        });
        assignedToUsers = assignments.map((a) => ({
          ...a.user,
          assignedBy: a.assignedByUser
            ? { id: a.assignedByUser.id, fullName: a.assignedByUser.fullName }
            : null,
          assignedAt: a.assignedAt,
        }));
      } catch (e) {
        // ignore if relation not available
      }
      return { ...repairWork, assignedToUsers };
    } catch (error) {
      throw new Error(`Failed to get repair work: ${error.message}`);
    }
  }

  // Create new repair work
  async createRepairWork(data) {
    try {
      // Strip unsupported fields (pmResultId was removed from schema)
      const { items = [], pmResultId, ...repairWorkData } = data;

      // Generate work order number
      const workOrderNumber = await this.generateWorkOrderNumber();

      const repairWork = await prisma.$transaction(async (tx) => {
        // Create repair work
        const createdRepairWork = await tx.repairWork.create({
          data: {
            ...repairWorkData,
            workOrderNumber,
          },
        });

        // Update machine status to MAINTENANCE when a repair work is opened
        if (createdRepairWork.machineId) {
          await tx.machine.update({
            where: { id: createdRepairWork.machineId },
            data: { status: "MAINTENANCE" },
          });
        }

        // Create repair work items if provided
        if (items.length > 0) {
          await tx.repairWorkItem.createMany({
            data: items.map((item, index) => ({
              repairWorkId: createdRepairWork.id,
              itemOrder: item.itemOrder || index + 1,
              description: item.description,
              assignedTo: item.assignedTo || null,
            })),
          });
        }

        return createdRepairWork;
      });

      // Notify assigned technician if any
      if (repairWork.assignedTo) {
        notificationService
          .sendNotification(repairWork.assignedTo, {
            title: "มีงานซ่อมใหม่",
            body: `งานซ่อม ${repairWork.workOrderNumber}: ${repairWork.title}`,
            url: `/repair-works/${repairWork.id}`,
          })
          .catch((err) => console.error("Failed to send notification:", err));
      }

      return this.getRepairWorkById(repairWork.id);
    } catch (error) {
      throw new Error(`Failed to create repair work: ${error.message}`);
    }
  }

  // Create repair work from PM result
  async createRepairWorkFromPMResult(pmResultId, data) {
    try {
      const pmResult = await prisma.pMResult.findUnique({
        where: { id: pmResultId },
        include: {
          pmSchedule: {
            include: {
              machine: true,
            },
          },
          pmTemplateItem: true,
        },
      });

      if (!pmResult) {
        throw new Error("PM result not found");
      }

      const workOrderNumber = await this.generateWorkOrderNumber();

      const repairWorkData = {
        ...data,
        workOrderNumber,
        machineId: pmResult.pmSchedule.machineId,
        pmScheduleId: pmResult.pmScheduleId,
        title:
          data.title || `ซ่อมแซมจาก PM: ${pmResult.pmTemplateItem.checkItem}`,
        description:
          data.description ||
          `พบความผิดปกติ: ${pmResult.result} (${
            pmResult.remarks || "ไม่มีหมายเหตุ"
          })`,
      };

      const repairWork = await prisma.$transaction(async (tx) => {
        const created = await tx.repairWork.create({
          data: repairWorkData,
        });

        // Set machine status to MAINTENANCE when creating repair from PM result
        if (created.machineId) {
          await tx.machine.update({
            where: { id: created.machineId },
            data: { status: "MAINTENANCE" },
          });
        }

        return created;
      });

      return this.getRepairWorkById(repairWork.id);
    } catch (error) {
      throw new Error(
        `Failed to create repair work from PM result: ${error.message}`
      );
    }
  }

  // Update repair work
  async updateRepairWork(id, data) {
    try {
      const { items, ...updateData } = data;

      // Auto-set customerSignedAt when a signature is newly provided and timestamp not supplied
      if (updateData.customerSignatureUrl && !updateData.customerSignedAt) {
        updateData.customerSignedAt = new Date();
      }

      const repairWork = await prisma.$transaction(async (tx) => {
        // Update repair work
        const updatedRepairWork = await tx.repairWork.update({
          where: { id },
          data: updateData,
        });

        // Update items if provided
        if (items) {
          // Delete existing items
          await tx.repairWorkItem.deleteMany({
            where: { repairWorkId: id },
          });

          // Create new items
          if (items.length > 0) {
            await tx.repairWorkItem.createMany({
              data: items.map((item, index) => ({
                repairWorkId: id,
                itemOrder: item.itemOrder || index + 1,
                description: item.description,
                status: item.status || "PENDING",
                assignedTo: item.assignedTo || null,
              })),
            });
          }
        }

        return updatedRepairWork;
      });

      return this.getRepairWorkById(repairWork.id);
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error("Repair work not found");
      }
      throw new Error(`Failed to update repair work: ${error.message}`);
    }
  }

  // Assign repair work to technician (capture assigning user)
  async assignRepairWork(id, assignedTo, assignedBy = null) {
    try {
      // Fetch existing to decide whether to set primary assignedTo
      const existing = await prisma.repairWork.findUnique({
        where: { id },
        select: { assignedTo: true, status: true },
      });
      if (!existing) throw new Error("Repair work not found");

      const updateData = {};
      // Only set primary technician if not previously assigned
      if (!existing.assignedTo) {
        updateData.assignedTo = assignedTo;
      }
      // Move to IN_PROGRESS only if currently OPEN
      if (existing.status === "OPEN") {
        updateData.status = "IN_PROGRESS";
      }
      if (Object.keys(updateData).length > 0) {
        await prisma.repairWork.update({ where: { id }, data: updateData });
      }
      // Create assignment record if not exists
      try {
        await prisma.repairWorkAssignment.create({
          data: {
            repairWorkId: id,
            userId: assignedTo,
            assignedBy: assignedBy || undefined,
          },
        });
      } catch (e) {
        // ignore duplicate unique constraint; if we have assignedBy, try to backfill
        if (assignedBy) {
          try {
            await prisma.repairWorkAssignment.updateMany({
              where: { repairWorkId: id, userId: assignedTo, assignedBy: null },
              data: { assignedBy },
            });
          } catch (_) {
            /* noop */
          }
        }
      }

      // Notify the assigned technician
      const rw = await prisma.repairWork.findUnique({ where: { id } });
      if (rw) {
        notificationService
          .sendNotification(assignedTo, {
            title: "คุณได้รับมอบหมายงานซ่อม",
            body: `งานซ่อม ${rw.workOrderNumber}: ${rw.title}`,
            url: `/repair-works/${id}`,
          })
          .catch((err) => console.error("Failed to send notification:", err));
      }

      return this.getRepairWorkById(id);
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error("Repair work not found");
      }
      throw new Error(`Failed to assign repair work: ${error.message}`);
    }
  }

  // Unassign all technicians from repair work
  async unassignAllRepairWork(id) {
    try {
      const repairWork = await prisma.$transaction(async (tx) => {
        // Clear primary assignment
        const updated = await tx.repairWork.update({
          where: { id },
          data: { assignedTo: null },
        });

        // Remove all assignment records
        await tx.repairWorkAssignment.deleteMany({
          where: { repairWorkId: id },
        });

        return updated;
      });

      return this.getRepairWorkById(repairWork.id);
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error("Repair work not found");
      }
      throw new Error(`Failed to unassign repair work: ${error.message}`);
    }
  }

  // Start repair work
  async startRepairWork(id, userId) {
    try {
      // Ensure both repair work status and machine status are updated atomically
      const repairWork = await prisma.$transaction(async (tx) => {
        const updated = await tx.repairWork.update({
          where: { id },
          data: {
            status: "IN_PROGRESS",
            startedAt: new Date(),
          },
        });

        if (updated.machineId) {
          await tx.machine.update({
            where: { id: updated.machineId },
            data: { status: "MAINTENANCE" },
          });
        }

        return updated;
      });

      return this.getRepairWorkById(repairWork.id);
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error("Repair work not found");
      }
      throw new Error(`Failed to start repair work: ${error.message}`);
    }
  }

  // Complete repair work
  async completeRepairWork(id, data) {
    try {
      const { partsUsed = [], ...completionData } = data;

      const repairWork = await prisma.$transaction(async (tx) => {
        // Ensure all items are completed before allowing closure
        const incompleteCount = await tx.repairWorkItem.count({
          where: { repairWorkId: id, status: { not: "COMPLETED" } },
        });
        if (incompleteCount > 0) {
          throw new Error("ต้องทำรายการซ่อมให้ครบทุกข้อก่อนปิดงาน");
        }
        // Ensure each completed item has non-empty description & remarks
        const items = await tx.repairWorkItem.findMany({
          where: { repairWorkId: id },
        });
        const invalid = items.filter(
          (it) =>
            !it.description ||
            it.description.trim() === "" ||
            !it.remarks ||
            it.remarks.trim() === ""
        );
        if (invalid.length > 0) {
          throw new Error("กรุณากรอกหมายเหตุให้ครบทุกข้อก่อนปิดงาน");
        }
        // Validate required photos (at least one BEFORE and one PROGRESS)
        const [beforeCount, progressCount] = await Promise.all([
          tx.repairWorkPhoto.count({
            where: { repairWorkId: id, photoType: "BEFORE" },
          }),
          tx.repairWorkPhoto.count({
            where: { repairWorkId: id, photoType: "PROGRESS" },
          }),
        ]);
        if (beforeCount === 0) {
          throw new Error("ต้องอัปโหลดรูป (ก่อนซ่อม) อย่างน้อย 1 รูป");
        }
        if (progressCount === 0) {
          throw new Error("ต้องอัปโหลดรูป (ระหว่าง/หลังซ่อม) อย่างน้อย 1 รูป");
        }
        // Update repair work
        // Destructure fields we don't want to pass directly (like completionNotes)
        const {
          completionNotes,
          completedBy,
          customerSignatureUrl,
          customerSignerName,
          ...restCompletion
        } = completionData;
        const updatedRepairWork = await tx.repairWork.update({
          where: { id },
          data: {
            ...restCompletion,
            status: "COMPLETED",
            completedAt: new Date(),
            remarks: completionNotes,
            completedBy,
            customerSignatureUrl: customerSignatureUrl || null,
            customerSignerName: customerSignerName || null,
            customerSignedAt: customerSignatureUrl ? new Date() : null,
          },
        });

        // When the repair work is completed, restore machine status to ACTIVE if it was set to MAINTENANCE
        if (updatedRepairWork.machineId) {
          try {
            const machine = await tx.machine.findUnique({
              where: { id: updatedRepairWork.machineId },
              select: { status: true },
            });
            if (machine && machine.status === "MAINTENANCE") {
              await tx.machine.update({
                where: { id: updatedRepairWork.machineId },
                data: { status: "ACTIVE" },
              });
            }
          } catch (e) {
            // Non-fatal: log and proceed
            console.warn(
              "Failed to update machine status after repair completion",
              e.message
            );
          }
        }

        // Record parts used
        if (partsUsed.length > 0) {
          for (const part of partsUsed) {
            // Create repair work part record
            await tx.repairWorkPart.create({
              data: {
                repairWorkId: id,
                machinePartId: part.machinePartId,
                quantityUsed: part.quantityUsed,
                costPerUnit: part.costPerUnit,
                totalCost: part.totalCost,
                usedBy: data.completedBy,
              },
            });

            // Update machine part stock
            await tx.machinePart.update({
              where: { id: part.machinePartId },
              data: {
                quantityOnHand: {
                  decrement: part.quantityUsed,
                },
              },
            });

            // Create inventory transaction
            await tx.inventoryTransaction.create({
              data: {
                partId: part.machinePartId,
                transactionType: "OUT",
                referenceType: "WORK_ORDER",
                quantity: part.quantityUsed,
                referenceId: updatedRepairWork.id,
                remarks: `ใช้ในงานซ่อม: ${updatedRepairWork.title} (งานซ่อม ID: ${updatedRepairWork.id})`,
                performedBy: data.completedBy,
              },
            });
          }
        }

        return updatedRepairWork;
      });

      return this.getRepairWorkById(repairWork.id);
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error("Repair work not found");
      }
      throw new Error(`Failed to complete repair work: ${error.message}`);
    }
  }

  // Upload repair work photos
  async uploadRepairWorkPhotos(
    repairWorkId,
    photoFiles,
    photoType,
    description,
    takenBy,
    repairWorkItemId = null
  ) {
    try {
      const uploadDir = path.join(process.cwd(), "uploads", "repair-photos");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const photos = [];

      for (const file of photoFiles) {
        const fileName = `${Date.now()}-${file.originalname}`;
        const filePath = path.join(uploadDir, fileName);
        const photoUrl = `/uploads/repair-photos/${fileName}`;

        // Save file to disk
        fs.writeFileSync(filePath, file.buffer);

        // Save to database
        const photo = await prisma.repairWorkPhoto.create({
          data: {
            repairWorkId,
            repairWorkItemId: repairWorkItemId || undefined,
            photoUrl,
            fileName,
            photoType,
            description,
            takenBy,
          },
        });

        photos.push(photo);
      }

      return photos;
    } catch (error) {
      throw new Error(`Failed to upload photos: ${error.message}`);
    }
  }

  // Delete repair work
  async deleteRepairWork(id) {
    try {
      // Fetch associated photo file names first (cascade will remove DB rows)
      const photos = await prisma.repairWorkPhoto.findMany({
        where: { repairWorkId: id },
        select: { fileName: true },
      });

      await prisma.repairWork.delete({ where: { id } });

      // Attempt to remove files from disk (best-effort, non-blocking)
      const baseDir = path.join(process.cwd(), "uploads", "repair-photos");
      photos.forEach((p) => {
        if (!p.fileName) return;
        const filePath = path.join(baseDir, p.fileName);
        fs.unlink(filePath, (err) => {
          if (err && err.code !== "ENOENT") {
            console.warn("Failed to delete photo file:", filePath, err.message);
          }
        });
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error("Repair work not found");
      }
      throw new Error(`Failed to delete repair work: ${error.message}`);
    }
  }

  // Delete single repair work photo
  async deleteRepairWorkPhoto(repairWorkId, photoId) {
    try {
      const photo = await prisma.repairWorkPhoto.findUnique({
        where: { id: photoId },
      });
      if (!photo || photo.repairWorkId !== repairWorkId) {
        throw new Error("Photo not found");
      }
      await prisma.repairWorkPhoto.delete({ where: { id: photoId } });
      // Remove file from disk (best-effort)
      if (photo.fileName) {
        const filePath = path.join(
          process.cwd(),
          "uploads",
          "repair-photos",
          photo.fileName
        );
        fs.unlink(filePath, (err) => {
          if (err && err.code !== "ENOENT") {
            console.warn("Failed to delete photo file:", filePath, err.message);
          }
        });
      }
    } catch (error) {
      if (error.message.includes("not found")) {
        throw error;
      }
      throw new Error(`Failed to delete photo: ${error.message}`);
    }
  }

  // Get photos for a specific repair work item (with optional type filter)
  async getItemPhotos(repairWorkId, itemId, photoType = null) {
    try {
      const where = { repairWorkId, repairWorkItemId: itemId };
      if (photoType) where.photoType = photoType;
      return await prisma.repairWorkPhoto.findMany({
        where,
        orderBy: { takenAt: "asc" },
      });
    } catch (error) {
      throw new Error(`Failed to fetch item photos: ${error.message}`);
    }
  }

  // Get repair work statistics
  async getRepairWorkStats(filters = {}) {
    try {
      const { machineId, startDate, endDate } = filters;
      const where = {};

      if (machineId) where.machineId = machineId;
      if (startDate && endDate) {
        where.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      }

      const [
        totalCount,
        statusStats,
        priorityStats,
        avgCompletionTime,
        totalCost,
      ] = await Promise.all([
        // Total count
        prisma.repairWork.count({ where }),

        // Status statistics
        prisma.repairWork.groupBy({
          by: ["status"],
          where,
          _count: true,
        }),

        // Priority statistics
        prisma.repairWork.groupBy({
          by: ["priority"],
          where,
          _count: true,
        }),

        // Average completion time
        prisma.repairWork.aggregate({
          where: {
            ...where,
            status: "COMPLETED",
            startedAt: { not: null },
            completedAt: { not: null },
          },
          _avg: {
            actualHours: true,
          },
        }),

        // Total cost
        prisma.repairWork.aggregate({
          where: {
            ...where,
            status: "COMPLETED",
          },
          _sum: {
            actualCost: true,
          },
        }),
      ]);

      return {
        totalCount,
        statusBreakdown: statusStats.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {}),
        priorityBreakdown: priorityStats.reduce((acc, item) => {
          acc[item.priority] = item._count;
          return acc;
        }, {}),
        averageCompletionHours: avgCompletionTime._avg.actualHours || 0,
        totalCost: totalCost._sum.actualCost || 0,
      };
    } catch (error) {
      throw new Error(`Failed to get repair work statistics: ${error.message}`);
    }
  }

  // Generate work order number
  async generateWorkOrderNumber() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");

    const prefix = `RW-${year}${month}`;

    const lastRepairWork = await prisma.repairWork.findFirst({
      where: {
        workOrderNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        workOrderNumber: "desc",
      },
    });

    let nextNumber = 1;
    if (lastRepairWork) {
      const lastNumber = parseInt(
        lastRepairWork.workOrderNumber.split("-").pop()
      );
      nextNumber = lastNumber + 1;
    }

    return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
  }

  // Update single repair work item (remarks, status)
  async updateRepairWorkItem(repairWorkId, itemId, data, userId) {
    try {
      const item = await prisma.repairWorkItem.findUnique({
        where: { id: itemId },
      });
      if (!item || item.repairWorkId !== repairWorkId) {
        throw new Error("Repair work item not found");
      }

      const updateData = {};
      if (data.remarks !== undefined) updateData.remarks = data.remarks;
      if (data.status) {
        updateData.status = data.status;
        if (data.status === "COMPLETED") {
          const finalRemarks =
            (data.remarks !== undefined ? data.remarks : item.remarks) || "";
          if (finalRemarks.trim().length === 0) {
            throw new Error("ต้องกรอกหมายเหตุของรายการก่อนทำเสร็จ");
          }
          updateData.completedAt = new Date();
          updateData.completedBy = userId;
        }
      }

      await prisma.repairWorkItem.update({
        where: { id: itemId },
        data: updateData,
      });

      return this.getRepairWorkById(repairWorkId);
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error("Repair work item not found");
      }
      throw new Error(`Failed to update repair work item: ${error.message}`);
    }
  }
}

module.exports = new RepairWorkService();
