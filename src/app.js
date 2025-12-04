const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

// Import routes
const authRoutes = require("./routes/auth.route");
const userRoutes = require("./routes/user.route");
const companyRoutes = require("./routes/company.route");
const machineRoutes = require("./routes/machine.route");
const machineDocumentRoutes = require("./routes/machineDocument.route");
const machinePartRoutes = require("./routes/machinePart.route");
const inventoryTransactionRoutes = require("./routes/inventoryTransaction.route");
const pmTemplateRoutes = require("./routes/pmTemplate.route");
const pmScheduleRoutes = require("./routes/pmSchedule.route");
const repairWorkRoutes = require("./routes/repairWork.routes");
const uploadRoutes = require("./routes/upload.route");
const notificationRoutes = require("./routes/notification.route");

// Import middlewares
const { notFound } = require("./middlewares/notFound");

const app = express();

// Trust the first proxy (e.g. load balancer) so req.ip reflects the real client IP
app.set("trust proxy", 1);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS configuration - ต้องมาก่อน rate limiting เพื่อให้ preflight requests ผ่าน
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://takecopm.netlify.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 600, // 10 minutes
  })
);

// Handle preflight requests
app.options("*", cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // allow more headroom per IP to avoid noisy 429s
  standardHeaders: true,
  legacyHeaders: false,
  // Prefer client IP from proxy headers; fall back to Express' detected IP
  keyGenerator: (req) => {
    const forwardedFor = req.headers["x-forwarded-for"];
    if (forwardedFor) {
      return forwardedFor.split(",")[0].trim();
    }
    return req.ip;
  },
  // Do not count health checks or preflight requests
  skip: (req) =>
    req.method === "OPTIONS" || req.method === "HEAD" || req.path === "/health",
  message: {
    success: false,
    message: "Too many requests, please slow down.",
  },
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ปรับ path ให้ตรงกับโฟลเดอร์เก็บไฟล์จริง
app.use(
  "/uploads",
  express.static(
    process.env.UPLOAD_DIR
      ? path.resolve(process.env.UPLOAD_DIR)
      : path.join(__dirname, "../uploads"),
    {
      setHeaders: (res, filePath) => {
        const origin = res.req.headers.origin;
        if (origin && allowedOrigins.includes(origin)) {
          res.setHeader("Access-Control-Allow-Origin", origin);
        }
        res.setHeader("Access-Control-Allow-Methods", "GET,HEAD");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      },
    }
  )
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/machine-documents", machineDocumentRoutes);
app.use("/api/machine-parts", machinePartRoutes);
app.use("/api/inventory-transactions", inventoryTransactionRoutes);
app.use("/api/pm-templates", pmTemplateRoutes);
app.use("/api/pm-schedules", pmScheduleRoutes);
app.use("/api/repair-works", repairWorkRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/notifications", notificationRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

module.exports = app;
