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
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive',
    ],
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * 檢查文件夾是否在共享驅動器中
 * @param folderId 文件夾 ID
 * @returns 是否為共享驅動器
 */
async function isSharedDrive(folderId: string): Promise<boolean> {
  const drive = getDriveClient();
  
  try {
    const file = await drive.files.get({
      fileId: folderId,
      fields: 'driveId,capabilities',
      supportsAllDrives: true,
    });
    
    // 如果有 driveId，表示在共享驅動器中
    if (file.data.driveId) {
      return true;
    }
    
    // 檢查 capabilities 來判斷
    if (file.data.capabilities?.canMoveItemWithinDrive !== undefined) {
      return true;
    }
    
    return false;
  } catch (error: any) {
    // 如果錯誤訊息包含 "not found" 或類似，可能不是共享驅動器
    if (error?.message?.includes('not found') || error?.code === 404) {
      return false;
    }
    
    // 如果無法取得，嘗試檢查是否為共享驅動器 ID
    try {
      const driveInfo = await drive.drives.get({
        driveId: folderId,
      });
      return !!driveInfo.data.id;
    } catch {
      // 預設為非共享驅動器
      return false;
    }
  }
}

/**
 * 上傳檔案到 Google Drive（支持共享驅動器）
 * @param buffer 檔案內容
 * @param fileName 檔案名稱
 * @param mimeType MIME 類型（可選，預設為 Excel）
 * @returns Google Drive 檔案 ID
 */
export async function uploadToGoogleDrive(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<string> {
  const drive = getDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const sharedDriveId = process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID; // 可選的共享驅動器 ID

  if (!folderId && !sharedDriveId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID 或 GOOGLE_DRIVE_SHARED_DRIVE_ID 未設定');
  }

  // 將 Buffer 轉換為 Stream
  const stream = Readable.from(buffer);

  // 根據檔案副檔名或提供的 MIME 類型決定 MIME 類型
  const detectedMimeType = mimeType || getMimeTypeFromFileName(fileName);

  // 檢查是否使用共享驅動器
  let useSharedDrive = false;
  let targetFolderId: string | undefined;
  let driveId: string | undefined;

  if (sharedDriveId) {
    // 如果明確指定了共享驅動器 ID，嘗試驗證
    try {
      const driveInfo = await drive.drives.get({
        driveId: sharedDriveId,
      });
      if (driveInfo.data.id) {
        useSharedDrive = true;
        driveId = sharedDriveId;
        // 如果同時有文件夾 ID，使用文件夾 ID 作為 parent
        targetFolderId = folderId || undefined;
      }
    } catch (error) {
      // 如果不是共享驅動器 ID，可能是文件夾 ID，繼續檢查
      console.warn('指定的 GOOGLE_DRIVE_SHARED_DRIVE_ID 可能不是共享驅動器 ID，嘗試作為文件夾處理');
    }
  }

  // 如果沒有明確的共享驅動器 ID，檢查文件夾是否在共享驅動器中
  if (!useSharedDrive && folderId) {
    try {
      const isInSharedDrive = await isSharedDrive(folderId);
      if (isInSharedDrive) {
        useSharedDrive = true;
        targetFolderId = folderId;
        // 嘗試獲取文件夾所在的共享驅動器 ID
        try {
          const file = await drive.files.get({
            fileId: folderId,
            fields: 'driveId',
            supportsAllDrives: true,
          });
          driveId = file.data.driveId || undefined;
        } catch {
          // 忽略錯誤
        }
      } else {
        targetFolderId = folderId;
      }
    } catch (error) {
      // 如果檢測失敗，假設不是共享驅動器，但強制使用共享驅動器模式
      // 因為 Service Account 必須使用共享驅動器
      console.warn('無法檢測文件夾是否在共享驅動器中，強制使用共享驅動器模式');
      useSharedDrive = true;
      targetFolderId = folderId;
    }
  }

  // 如果仍然沒有設置為共享驅動器，拋出明確的錯誤
  if (!useSharedDrive) {
    throw new Error(
      'Service Account 必須使用共享驅動器。請設置 GOOGLE_DRIVE_SHARED_DRIVE_ID 或確保 GOOGLE_DRIVE_FOLDER_ID 指向共享驅動器中的文件夾。\n' +
      '詳細說明請參考: GOOGLE_DRIVE_SHARED_DRIVE_SETUP.md'
    );
  }

  const fileMetadata: any = {
    name: fileName,
  };

  // 如果指定了文件夾，添加到 parents
  if (targetFolderId) {
    fileMetadata.parents = [targetFolderId];
  }

  const media = {
    mimeType: detectedMimeType,
    body: stream,
  };

  try {
    const createOptions: any = {
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
      // 強制使用共享驅動器選項（Service Account 必須使用）
      supportsAllDrives: true,
      supportsTeamDrives: true,
    };

    const response = await drive.files.create(createOptions);

    if (!response.data.id) {
      throw new Error('上傳失敗：無法取得檔案 ID');
    }

    console.log(`✅ 檔案已上傳至 Google Drive: ${response.data.id}${useSharedDrive ? ' (共享驅動器)' : ''}`);
    return response.data.id;
  } catch (error) {
    console.error('Google Drive 上傳錯誤:', error);
    throw new Error(`上傳至 Google Drive 失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

/**
 * 根據檔案名稱推斷 MIME 類型
 */
function getMimeTypeFromFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel',
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'svg': 'image/svg+xml',
    'gif': 'image/gif',
  };

  return mimeTypes[extension || ''] || 'application/octet-stream';
}

/**
 * 設置檔案為公開可讀（支持共享驅動器）
 * @param fileId Google Drive 檔案 ID
 */
export async function makeFilePublic(fileId: string): Promise<void> {
  const drive = getDriveClient();
  const sharedDriveId = process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID;

  try {
    // 檢查檔案是否在共享驅動器中
    let useSharedDrive = false;
    if (sharedDriveId) {
      useSharedDrive = true;
    } else {
      try {
        const file = await drive.files.get({
          fileId,
          fields: 'driveId',
          supportsAllDrives: true,
        });
        useSharedDrive = !!file.data.driveId;
      } catch {
        // 如果無法檢查，預設為非共享驅動器
        useSharedDrive = false;
      }
    }

    const permissionOptions: any = {
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    };

    // 如果使用共享驅動器，需要添加這些選項
    if (useSharedDrive) {
      permissionOptions.supportsAllDrives = true;
      permissionOptions.supportsTeamDrives = true;
    }

    await drive.permissions.create(permissionOptions);
    console.log(`✅ 檔案 ${fileId} 已設置為公開可讀${useSharedDrive ? ' (共享驅動器)' : ''}`);
  } catch (error) {
    console.error('設置檔案權限錯誤:', error);
    // 對於共享驅動器，可能需要不同的權限設置
    // 如果失敗，記錄警告但不拋出錯誤
    console.warn('無法設置檔案為公開可讀，檔案可能已在共享驅動器中具有適當權限');
  }
}
