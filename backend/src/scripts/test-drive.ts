import 'dotenv/config';
import { google } from 'googleapis';

async function testDriveAccess() {
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

  const drive = google.drive({ version: 'v3', auth });
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const sharedDriveId = process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID;

  console.log('🔍 開始診斷 Google Drive 設置...\n');

  // 1. 檢查文件夾
  if (folderId) {
    console.log(`📁 檢查文件夾 ID: ${folderId}`);
    try {
      const file = await drive.files.get({
        fileId: folderId,
        fields: 'id,name,mimeType,driveId,capabilities',
        supportsAllDrives: true,
      });

      console.log(`✅ 文件夾存在: ${file.data.name}`);
      console.log(`   類型: ${file.data.mimeType}`);
      
      if (file.data.driveId) {
        console.log(`✅ 文件夾在共享驅動器中！`);
        console.log(`   共享驅動器 ID: ${file.data.driveId}`);
      } else {
        console.log(`❌ 文件夾不在共享驅動器中！`);
        console.log(`   這是問題所在 - Service Account 必須使用共享驅動器`);
      }
    } catch (error: any) {
      console.log(`❌ 無法訪問文件夾: ${error.message}`);
      if (error.code === 404) {
        console.log(`   文件夾不存在或沒有權限`);
      } else if (error.code === 403) {
        console.log(`   沒有訪問權限`);
      }
    }
    console.log('');
  }

  // 2. 檢查共享驅動器 ID
  if (sharedDriveId) {
    console.log(`💾 檢查共享驅動器 ID: ${sharedDriveId}`);
    try {
      const driveInfo = await drive.drives.get({
        driveId: sharedDriveId,
      });
      console.log(`✅ 共享驅動器存在: ${driveInfo.data.name}`);
      console.log(`   ID: ${driveInfo.data.id}`);
    } catch (error: any) {
      console.log(`❌ 無法訪問共享驅動器: ${error.message}`);
      if (error.code === 404) {
        console.log(`   這可能不是共享驅動器 ID，而是文件夾 ID`);
      } else if (error.code === 403) {
        console.log(`   沒有訪問權限 - 請確保 Service Account 已加入共享驅動器`);
      }
    }
    console.log('');
  }

  // 3. 列出可訪問的共享驅動器
  console.log('📋 列出可訪問的共享驅動器...');
  try {
    const drives = await drive.drives.list({
      pageSize: 10,
    });
    
    if (drives.data.drives && drives.data.drives.length > 0) {
      console.log(`✅ 找到 ${drives.data.drives.length} 個共享驅動器:`);
      drives.data.drives.forEach((d) => {
        console.log(`   - ${d.name} (ID: ${d.id})`);
      });
    } else {
      console.log(`❌ 沒有找到可訪問的共享驅動器`);
      console.log(`   請確保:`);
      console.log(`   1. 您有 Google Workspace 帳號`);
      console.log(`   2. Service Account 已加入共享驅動器`);
      console.log(`   3. Service Account 具有「內容管理員」或「編輯者」權限`);
    }
  } catch (error: any) {
    console.log(`❌ 無法列出共享驅動器: ${error.message}`);
  }
  console.log('');

  // 4. 測試上傳權限
  if (folderId) {
    console.log('🧪 測試上傳權限...');
    try {
      const testFile = await drive.files.create({
        requestBody: {
          name: 'test-upload-permission.txt',
          parents: [folderId],
        },
        media: {
          mimeType: 'text/plain',
          body: 'This is a test file to check upload permissions.',
        },
        fields: 'id',
        supportsAllDrives: true,
        supportsTeamDrives: true,
      });

      if (testFile.data.id) {
        console.log(`✅ 上傳測試成功！檔案 ID: ${testFile.data.id}`);
        
        // 刪除測試檔案
        try {
          await drive.files.delete({
            fileId: testFile.data.id,
            supportsAllDrives: true,
            supportsTeamDrives: true,
          });
          console.log(`✅ 測試檔案已刪除`);
        } catch (deleteError) {
          console.log(`⚠️  無法刪除測試檔案，請手動刪除: ${testFile.data.id}`);
        }
      }
    } catch (error: any) {
      console.log(`❌ 上傳測試失敗: ${error.message}`);
      if (error.message.includes('storage quota')) {
        console.log(`   這是 Service Account 沒有存儲配額的錯誤`);
        console.log(`   解決方案: 必須使用共享驅動器`);
      }
    }
  }

  console.log('\n✅ 診斷完成！');
}

testDriveAccess().catch(console.error);
