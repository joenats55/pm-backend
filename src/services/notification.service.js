const webpush = require("web-push");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class NotificationService {
  constructor() {
    // Initialize web-push with VAPID keys from environment variables
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || "mailto:admin@example.com",
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    } else {
      console.warn("VAPID keys not found. Push notifications will not work.");
    }
  }

  // Subscribe a user to push notifications
  async subscribe(userId, subscription) {
    try {
      // Check if subscription already exists
      const existing = await prisma.notificationSubscription.findUnique({
        where: { endpoint: subscription.endpoint },
      });

      if (existing) {
        // Update user if different
        if (existing.userId !== userId) {
          return await prisma.notificationSubscription.update({
            where: { id: existing.id },
            data: { userId },
          });
        }
        return existing;
      }

      // Create new subscription
      return await prisma.notificationSubscription.create({
        data: {
          userId,
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        },
      });
    } catch (error) {
      throw new Error(`Failed to subscribe: ${error.message}`);
    }
  }

  // Send notification to a specific user
  async sendNotification(userId, payload) {
    try {
      // Get all subscriptions for the user
      const subscriptions = await prisma.notificationSubscription.findMany({
        where: { userId },
      });

      if (subscriptions.length === 0) {
        return { success: false, message: "No subscriptions found for user" };
      }

      const notificationPayload = JSON.stringify(payload);
      const results = [];

      // Send to all user's devices
      for (const sub of subscriptions) {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: sub.keys,
          };

          const options = {
            TTL: 60,
            agent: new require("https").Agent({ family: 4 }), // Force IPv4
          };

          await webpush.sendNotification(
            pushSubscription,
            notificationPayload,
            options
          );
          results.push({ id: sub.id, status: "sent" });
        } catch (error) {
          // If subscription is invalid (e.g. expired), delete it
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.notificationSubscription.delete({
              where: { id: sub.id },
            });
            results.push({ id: sub.id, status: "deleted" });
          } else {
            console.error("Error sending push notification:", error);
            results.push({ id: sub.id, status: "error", error: error.message });
          }
        }
      }

      return { success: true, results };
    } catch (error) {
      console.error("Failed to send notification:", error);
      return { success: false, error: error.message };
    }
  }

  // Send notification to all users with a specific role
  async sendNotificationToRole(roleName, payload) {
    try {
      const users = await prisma.user.findMany({
        where: {
          role: { name: roleName },
          isActive: true,
        },
        select: { id: true },
      });

      const results = [];
      for (const user of users) {
        const result = await this.sendNotification(user.id, payload);
        results.push({ userId: user.id, result });
      }

      return results;
    } catch (error) {
      throw new Error(
        `Failed to send notifications to role ${roleName}: ${error.message}`
      );
    }
  }
}

module.exports = new NotificationService();
