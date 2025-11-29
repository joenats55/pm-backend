const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { authenticateToken } = require("../middlewares/auth");

router.post("/subscribe", authenticateToken, notificationController.subscribe);
router.get("/vapid-public-key", notificationController.getVapidPublicKey);

module.exports = router;
