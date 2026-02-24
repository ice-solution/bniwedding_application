import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 上傳文件夾路徑
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

/**
 * 確保上傳目錄存在
 */
async function ensureUploadDir(): Promise<void> {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * 生成安全的隨機文件名
 * @param originalFileName 原始文件名（用於獲取擴展名）
 * @returns 隨機文件名
 */
function generateRandomFileName(originalFileName: string): string {
  const timestamp = Date.now();
  // 生成 16 位隨機字符串
  const randomString = crypto.randomBytes(8).toString('hex');
  // 獲取文件擴展名（保留原始擴展名）
  const fileExtension = path.extname(originalFileName).toLowerCase() || '';
  
  // 格式：timestamp-randomstring.extension
  return `${timestamp}-${randomString}${fileExtension}`;
}

/**
 * 上傳文件到本地存儲
 * @param buffer 文件內容
 * @param fileName 原始文件名稱（用於獲取擴展名）
 * @returns 文件路徑和 URL
 */
export async function uploadToLocalStorage(
  buffer: Buffer,
  fileName: string
): Promise<{ filePath: string; fileUrl: string; fileKey: string; originalFileName: string }> {
  await ensureUploadDir();

  // 生成隨機文件名（避免中文和特殊字符問題）
  const randomFileName = generateRandomFileName(fileName);
  
  // 創建子目錄（按日期組織）
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateDir = path.join(UPLOAD_DIR, `${year}-${month}-${day}`);
  
  await fs.mkdir(dateDir, { recursive: true });
  
  const filePath = path.join(dateDir, randomFileName);
  
  // 寫入文件
  await fs.writeFile(filePath, buffer);
  
  // 生成訪問 URL（通過後端服務器）
  const fileKey = `uploads/${year}-${month}-${day}/${randomFileName}`;
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:6137';
  // URL 編碼文件名以確保安全
  const encodedFileName = encodeURIComponent(randomFileName);
  const fileUrl = `${baseUrl}/static/uploads/${year}-${month}-${day}/${encodedFileName}`;
  
  console.log(`✅ 文件已上傳到本地存儲: ${filePath}`);
  console.log(`   原始文件名: ${fileName}`);
  console.log(`   存儲文件名: ${randomFileName}`);
  
  return {
    filePath,
    fileUrl,
    fileKey,
    originalFileName: fileName, // 保留原始文件名供參考
  };
}

/**
 * 刪除文件
 * @param fileKey 文件鍵（相對路徑）
 */
export async function deleteLocalFile(fileKey: string): Promise<void> {
  try {
    const filePath = path.join(__dirname, '../../', fileKey);
    await fs.unlink(filePath);
    console.log(`✅ 文件已刪除: ${filePath}`);
  } catch (error) {
    console.error('刪除文件錯誤:', error);
    // 不拋出錯誤，因為文件可能已經不存在
  }
}
