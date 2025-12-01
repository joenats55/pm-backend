require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const app = require("./src/app");

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    console.log("Debug: Connecting to database...");
    await prisma.$connect();
    console.log("Debug: Database connected.");

    const dbUrl = process.env.DATABASE_URL;
    console.log("Debug: DATABASE_URL exists?", !!dbUrl);

    let dbName = "unknown";

    try {
      const parsed = new URL(dbUrl);
      dbName = parsed.pathname.replace("/", "");
    } catch (e) {
      console.warn("ไม่สามารถอ่านชื่อฐานข้อมูลจาก DATABASE_URL ได้");
    }
    console.log(`☁️ ㅤDatabase connected successfully (DB: ${dbName})`);

    // Start Cron Jobs
    console.log("Debug: Starting cron jobs...");
    const {
      startDailyNotificationJob,
    } = require("./src/jobs/dailyNotification.job");
    startDailyNotificationJob();
    console.log("Debug: Cron jobs started.");

    app.listen(PORT, () => {
      console.log(`🚀  Server is running on port ${PORT}`);
      console.log(`🐥  Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    console.error(error.stack); // Print stack trace
    process.exit(1);
  }
}

startServer();
