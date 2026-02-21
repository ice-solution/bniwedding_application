import { google } from 'googleapis';
import { Readable } from 'stream';

// 初始化 Google Drive API
function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      project_id: process.env.GOOGLE_DRIVE_PROJECT_ID,
    },
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * 上傳檔案到 Google Drive
 * @param buffer 檔案內容
 * @param fileName 檔案名稱
 * @returns Google Drive 檔案 ID
 */
export async function uploadToGoogleDrive(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const drive = getDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!folderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID 未設定');
  }

  // 將 Buffer 轉換為 Stream
  const stream = Readable.from(buffer);

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    body: stream,
  };

  try {
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });

    if (!response.data.id) {
      throw new Error('上傳失敗：無法取得檔案 ID');
    }

    console.log(`✅ 檔案已上傳至 Google Drive: ${response.data.id}`);
    return response.data.id;
  } catch (error) {
    console.error('Google Drive 上傳錯誤:', error);
    throw new Error(`上傳至 Google Drive 失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}
