const notificationService = require("../services/notification.service");

class NotificationController {
  // POST /api/notifications/subscribe
  async subscribe(req, res) {
    try {
      const { subscription } = req.body;
      const userId = req.user.id;

      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({
          success: false,
          message: "Invalid subscription object",
        });
      }

      await notificationService.subscribe(userId, subscription);

      res.status(201).json({
        success: true,
        message: "Subscription added successfully",
      });
    } catch (error) {
      console.error("Error subscribing to notifications:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /api/notifications/vapid-public-key
  getVapidPublicKey(req, res) {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!publicKey) {
      return res.status(500).json({
        success: false,
        message: "VAPID public key not configured",
      });
    }

    res.status(200).json({
      success: true,
      publicKey,
    });
  }
}

module.exports = new NotificationController();
