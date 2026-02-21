import express from "express";
import multer from "multer";
import { nanoid } from "nanoid";
import { storagePut } from "./storage";

const router = express.Router();

// 配置 multer 用於檔案上傳
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB
  },
});

/**
 * 檔案上傳端點
 * POST /api/upload
 */
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.file;
    const fileExtension = file.originalname.split(".").pop();
    const randomSuffix = nanoid(10);
    const fileKey = `member-files/${Date.now()}-${randomSuffix}.${fileExtension}`;

    // 上傳到 S3
    const { url } = await storagePut(fileKey, file.buffer, file.mimetype);

    res.json({
      success: true,
      fileKey,
      fileUrl: url,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    });
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({ error: "File upload failed" });
  }
});

export default router;
