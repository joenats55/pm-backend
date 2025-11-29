require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const app = require("./src/app");

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    await prisma.$connect();
    const dbUrl = process.env.DATABASE_URL;
    let dbName = "unknown";

    try {
      const parsed = new URL(dbUrl);
      dbName = parsed.pathname.replace("/", "");
    } catch (e) {
      console.warn("ไม่สามารถอ่านชื่อฐานข้อมูลจาก DATABASE_URL ได้");
    }
    console.log(`☁️ ㅤDatabase connected successfully (DB: ${dbName})`);

    // Start Cron Jobs
    const {
      startDailyNotificationJob,
    } = require("./src/jobs/dailyNotification.job");
    startDailyNotificationJob();

    app.listen(PORT, () => {
      console.log(`🚀  Server is running on port ${PORT}`);
      console.log(`🐥  Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
