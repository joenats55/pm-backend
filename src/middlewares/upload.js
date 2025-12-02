const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../../uploads");
const machineImagesDir = path.join(uploadsDir, "machines");
const machineDocumentsDir = path.join(uploadsDir, "documents");
const pmPhotosDir = path.join(uploadsDir, "pm-photos");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(machineImagesDir)) {
  fs.mkdirSync(machineImagesDir, { recursive: true });
}

if (!fs.existsSync(machineDocumentsDir)) {
  fs.mkdirSync(machineDocumentsDir, { recursive: true });
}

if (!fs.existsSync(pmPhotosDir)) {
  fs.mkdirSync(pmPhotosDir, { recursive: true });
}

// Configure multer storage for PM photos
const pmPhotoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, pmPhotosDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    let ext = path.extname(file.originalname);

    // Fallback extension from mimetype if originalname has no extension
    if (!ext || ext === ".") {
      const mimeToExt = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
      };
      ext = mimeToExt[file.mimetype] || ".jpg"; // Default to .jpg
    }

    const { photoType = "evidence" } = req.body;
    cb(null, `pm-${photoType}-${uniqueSuffix}${ext}`);
  },
});

// Configure multer storage for images
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, machineImagesDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "machine-" + uniqueSuffix + ext);
  },
});

// Configure multer storage for documents
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, machineDocumentsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "doc-" + uniqueSuffix + ext);
  },
});

// File filter to allow only images
const imageFileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// File filter to allow documents (PDF, DOC, DOCX, XLS, XLSX, TXT)
const documentFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only PDF, DOC, DOCX, XLS, XLSX, TXT, and image files are allowed!"
      ),
      false
    );
  }
};

// Create multer instances
const imageUpload = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const pmPhotoUpload = multer({
  storage: pmPhotoStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const documentUpload = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for documents
  },
});

// Middleware for handling single image upload
const uploadSingleImage = imageUpload.single("image");

// Middleware for handling multiple images upload
const uploadMultipleImages = imageUpload.array("images", 5); // Max 5 images

// Middleware for handling single document upload
const uploadSingleDocument = documentUpload.single("document");

// Middleware for handling multiple documents upload
const uploadMultipleDocuments = documentUpload.array("documents", 10); // Max 10 documents

// Middleware for handling PM photos upload
const uploadPMPhotos = pmPhotoUpload.array("photos", 10); // Max 10 photos
const uploadSinglePMPhoto = pmPhotoUpload.single("photo");

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message:
          "File too large. Maximum size is 50MB for documents, 10MB for images.",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Too many files uploaded.",
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next();
};

// Helper function to delete uploaded file
const deleteUploadedFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Error deleting file:", error);
  }
};

// Helper function to get file URL for images
const getFileUrl = (filename) => {
  return `/uploads/machines/${filename}`;
};

// Helper function to get file URL for documents
const getDocumentUrl = (filename) => {
  return `/uploads/documents/${filename}`;
};

// Helper function to get PM photo URL
const getPMPhotoUrl = (filename) => {
  return `/uploads/pm-photos/${filename}`;
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  uploadSingleDocument,
  uploadMultipleDocuments,
  uploadPMPhotos,
  uploadSinglePMPhoto,
  handleUploadError,
  deleteUploadedFile,
  getFileUrl,
  getDocumentUrl,
  getPMPhotoUrl,
  machineImagesDir,
  machineDocumentsDir,
  pmPhotosDir,
};
