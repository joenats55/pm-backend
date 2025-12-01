const cron = require("node-cron");
const { PrismaClient } = require("@prisma/client");
const notificationService = require("../services/notification.service");

const prisma = new PrismaClient();

const startDailyNotificationJob = () => {
  // Run every day at 8:00 AM
  cron.schedule("* 8 * *", async () => {
    console.log("Running daily notification job...");
    try {
      // 1. Get all technicians
      const technicians = await prisma.user.findMany({
        where: {
          role: {
            name: "TECHNICIAN",
          },
          isActive: true,
        },
      });

      console.log(`Found ${technicians.length} technicians.`);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // 2. Check tasks for each technician
      for (const tech of technicians) {
        // Count Open Repair Works
        const repairCount = await prisma.repairWork.count({
          where: {
            OR: [
              { assignedTo: tech.id },
              { assignments: { some: { userId: tech.id } } },
            ],
            status: {
              in: ["OPEN", "IN_PROGRESS"],
            },
          },
        });

        // Count PM Schedules due today or overdue
        const pmCount = await prisma.pMSchedule.count({
          where: {
            assignedUsers: {
              some: { userId: tech.id },
            },
            status: {
              in: ["SCHEDULED", "IN_PROGRESS", "OVERDUE"],
            },
            nextDueDate: {
              lte: tomorrow, // Due before tomorrow (i.e., today or earlier)
            },
          },
        });

        const totalTasks = repairCount + pmCount;

        console.log(
          `Debug: User ${tech.username} - Repair: ${repairCount}, PM: ${pmCount}, Total: ${totalTasks}`
        );

        if (totalTasks > 0) {
          console.log(
            `Sending notification to ${tech.username}: ${totalTasks} tasks.`
          );

          await notificationService.sendNotification(tech.id, {
            title: "Daily Work Summary",
            body: `Good morning! You have ${totalTasks} tasks pending today (${repairCount} Repairs, ${pmCount} PMs).`,
            url: "/tasks", // Adjust URL as needed
          });
        }
      }
    } catch (error) {
      console.error("Error in daily notification job:", error);
    }
  });
};

module.exports = { startDailyNotificationJob };
