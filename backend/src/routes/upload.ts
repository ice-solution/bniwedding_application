import express from 'express';
import multer from 'multer';
import { uploadToGoogleDrive, makeFilePublic } from '../services/googleDrive.js';
import { uploadToLocalStorage } from '../services/localStorage.js';

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
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    const file = req.file;
    const storageType = process.env.STORAGE_TYPE || 'local'; // 'local' 或 'google'

    if (storageType === 'google') {
      // 使用 Google Drive
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `member-files/${Date.now()}-${file.originalname}`;

      try {
        const fileId = await uploadToGoogleDrive(
          Buffer.from(file.buffer),
          fileName,
          file.mimetype
        );

        // 設置檔案為公開可讀
        try {
          await makeFilePublic(fileId);
        } catch (error) {
          console.warn('無法設置檔案為公開:', error);
        }

        // 構建檔案 URL（使用 Google Drive 的公開連結格式）
        const fileUrl = `https://drive.google.com/file/d/${fileId}/view`;

        res.json({
          success: true,
          fileKey: fileId,
          fileUrl,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
        });
      } catch (error) {
        console.error('Google Drive 上傳失敗，嘗試使用本地存儲:', error);
        // 如果 Google Drive 失敗，回退到本地存儲
        const { fileKey, fileUrl, originalFileName } = await uploadToLocalStorage(
          Buffer.from(file.buffer),
          file.originalname
        );

        res.json({
          success: true,
          fileKey,
          fileUrl,
          fileName: originalFileName, // 返回原始文件名
          fileSize: file.size,
          mimeType: file.mimetype,
        });
      }
    } else {
      // 使用本地存儲
      const { fileKey, fileUrl, originalFileName } = await uploadToLocalStorage(
        Buffer.from(file.buffer),
        file.originalname
      );

      res.json({
        success: true,
        fileKey,
        fileUrl,
        fileName: originalFileName, // 返回原始文件名
        fileSize: file.size,
        mimeType: file.mimetype,
      });
    }
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'File upload failed' 
    });
  }
});

export const uploadRouter = router;
