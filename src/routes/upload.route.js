const express = require("express");
const { authenticateToken } = require("../middlewares/auth");
const {
  uploadPMPhotos,
  handleUploadError,
  getPMPhotoUrl,
} = require("../middlewares/upload");
// Reuse multer config for signature (single image) - lightweight approach
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Directory for signatures
// Directory for signatures
const uploadsDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, "../../uploads");
const signatureDir = path.join(uploadsDir, "signatures");
if (!fs.existsSync(signatureDir)) {
  fs.mkdirSync(signatureDir, { recursive: true });
}

const signatureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, signatureDir);
  },
  filename: (req, file, cb) => {
    const unique = `sig-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}.png`);
  },
});

const uploadSignature = multer({
  storage: signatureStorage,
  limits: { fileSize: 1024 * 1024 * 2 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files allowed"));
    }
    cb(null, true);
  },
}).single("signature");

const getSignatureUrl = (filename) => `/uploads/signatures/${filename}`;

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: The file upload managing API
 */

// POST /api/upload/pm-photos - Upload PM photos
/**
 * @swagger
 * /upload/pm-photos:
 *   post:
 *     summary: Upload PM photos
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               photoType:
 *                 type: string
 *                 default: evidence
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Photos uploaded successfully
 */
router.post(
  "/pm-photos",
  authenticateToken,
  uploadPMPhotos,
  handleUploadError,
  async (req, res) => {
    try {
      const { photoType = "evidence", description } = req.body;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No images uploaded",
        });
      }

      // Process uploaded files
      const uploadedPhotos = req.files.map((file) => ({
        url: getPMPhotoUrl(file.filename),
        fileName: file.originalname,
        fileSize: file.size,
        type: photoType,
        description: description || null,
      }));

      res.status(200).json({
        success: true,
        data: {
          photos: uploadedPhotos,
          count: uploadedPhotos.length,
        },
        message: "Photos uploaded successfully",
      });
    } catch (error) {
      console.error("Error in photo upload route:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// POST /api/upload/pm-photos/single - Upload single PM photo
/**
 * @swagger
 * /upload/pm-photos/single:
 *   post:
 *     summary: Upload single PM photo
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *               photoType:
 *                 type: string
 *                 default: evidence
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Photo uploaded successfully
 */
router.post(
  "/pm-photos/single",
  authenticateToken,
  (req, res, next) => {
    // Use single file upload for this endpoint
    const { uploadSinglePMPhoto } = require("../middlewares/upload");
    uploadSinglePMPhoto(req, res, next);
  },
  handleUploadError,
  async (req, res) => {
    try {
      const { photoType = "evidence", description } = req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image uploaded",
        });
      }

      const uploadedPhoto = {
        url: getPMPhotoUrl(req.file.filename),
        fileName: req.file.originalname,
        fileSize: req.file.size,
        type: photoType,
        description: description || null,
      };

      res.status(200).json({
        success: true,
        data: uploadedPhoto,
        message: "Photo uploaded successfully",
      });
    } catch (error) {
      console.error("Error in single photo upload route:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// POST /api/upload/signature - Upload customer signature (single)
/**
 * @swagger
 * /upload/signature:
 *   post:
 *     summary: Upload customer signature
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Signature uploaded successfully
 */
router.post("/signature", authenticateToken, (req, res) => {
  uploadSignature(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No signature uploaded" });
    }
    return res.status(200).json({
      success: true,
      data: {
        url: getSignatureUrl(req.file.filename),
        fileName: req.file.originalname,
        fileSize: req.file.size,
      },
      message: "Signature uploaded",
    });
  });
});

// DELETE /api/upload/pm-photos/:filename - Delete PM photo
/**
 * @swagger
 * /upload/pm-photos/{filename}:
 *   delete:
 *     summary: Delete PM photo
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         schema:
 *           type: string
 *         required: true
 *         description: The filename of the photo to delete
 *     responses:
 *       200:
 *         description: Photo deleted successfully
 */
router.delete("/pm-photos/:filename", authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: "Filename is required",
      });
    }

    // Validate filename to prevent directory traversal and ensure it's a PM photo
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid filename",
      });
    }

    // Only allow deletion of PM photo files
    if (!filename.startsWith("pm-")) {
      return res.status(400).json({
        success: false,
        message: "Can only delete PM photo files",
      });
    }

    const fs = require("fs");
    const path = require("path");
    const { pmPhotosDir } = require("../middlewares/upload");

    const filePath = path.join(pmPhotosDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    console.log(
      `PM photo deleted: ${filename} by user ${req.user?.username || "unknown"}`
    );

    res.status(200).json({
      success: true,
      message: "File deleted successfully",
      data: { filename },
    });
  } catch (error) {
    console.error("Error in photo deletion route:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
