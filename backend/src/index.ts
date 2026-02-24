import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { applicationRouter } from './routes/application.js';
import { uploadRouter } from './routes/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 靜態檔案服務（banner 圖片等）
app.use('/static', express.static(path.join(__dirname, '../public')));

// 上傳檔案服務（本地存儲的文件）
// 使用 express.static 時，文件名會自動解碼，所以不需要手動處理
app.use('/static/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, filePath) => {
    // 設置適當的 Content-Disposition 頭部，支持中文文件名下載
    const fileName = path.basename(filePath);
    // 如果文件名包含非 ASCII 字符，使用 UTF-8 編碼
    if (/[^\x00-\x7F]/.test(fileName)) {
      res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    }
  },
}));

// Routes
app.use('/api', applicationRouter);
app.use('/api', uploadRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});
