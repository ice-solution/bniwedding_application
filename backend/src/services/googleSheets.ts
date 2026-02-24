import { google } from 'googleapis';

// 初始化 Google Sheets API
function getSheetsClient() {
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('GOOGLE_DRIVE_PRIVATE_KEY 環境變數未設定');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
      private_key: privateKey.replace(/\\n/g, '\n'),
      project_id: process.env.GOOGLE_DRIVE_PROJECT_ID,
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });

  return google.sheets({ version: 'v4', auth });
}

interface ApplicationData {
  englishName: string;
  companyName?: string;
  chapter: string;
  profession: string;
  phone: string;
  email: string;
  yearsOfMembership: number;
  isGoldMember: 'yes' | 'no';
  isDnA: 'yes' | 'no';
  weddingCategory: string;
  weddingServices: string;
  serviceArea?: string;
  pastCasesCount?: number;
  uniqueAdvantage?: string;
  facebookLink?: string;
  instagramLink?: string;
  websiteLink?: string;
  bniMemberDiscount?: string;
  referrer?: string;
  bniWeddingBusinessCount?: number;
  bniBusinessAmount?: string;
  bnwgGoals?: string;
  interestedInAdmin?: 'yes' | 'no';
  files?: Array<{
    fileKey: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>;
  logoFileKey?: string;
  logoFileUrl?: string;
}

/**
 * 將申請資料新增到 Google Sheet
 * @param data 申請資料
 * @param spreadsheetId Google Sheet ID
 * @param sheetName 工作表名稱（預設為 'Sheet1'）
 */
export async function appendToGoogleSheet(
  data: ApplicationData,
  spreadsheetId: string,
  sheetName: string = 'Sheet1'
): Promise<void> {
  const sheets = getSheetsClient();

  // 準備資料行
  const row = [
    new Date().toLocaleString('zh-TW'), // 提交時間
    data.englishName,
    data.companyName || '',
    data.chapter,
    data.profession,
    data.phone,
    data.email,
    `${data.yearsOfMembership} 年`,
    data.isGoldMember === 'yes' ? '是' : '否',
    data.isDnA === 'yes' ? 'Yes' : 'No',
    data.weddingCategory,
    data.weddingServices,
    data.serviceArea || '',
    data.pastCasesCount?.toString() || '',
    data.uniqueAdvantage || '',
    data.facebookLink || '',
    data.instagramLink || '',
    data.websiteLink || '',
    data.logoFileUrl || '',
    data.files?.map(f => f.fileUrl).join('; ') || '',
    data.bniWeddingBusinessCount?.toString() || '',
    data.bniBusinessAmount || '',
    data.bnwgGoals || '',
    data.interestedInAdmin === 'yes' ? 'Yes' : data.interestedInAdmin === 'no' ? 'No' : '',
    data.bniMemberDiscount || '',
    data.referrer || '',
  ];

  try {
    // 先取得實際的工作表名稱
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    // 取得第一個工作表的名稱
    const firstSheet = spreadsheet.data.sheets?.[0];
    if (!firstSheet) {
      throw new Error('找不到工作表');
    }

    const actualSheetName = firstSheet.properties?.title || sheetName;
    
    // 如果是第一次寫入，先建立標題行
    // 使用 A1:Z1 格式來讀取第一行
    let hasHeaders = false;
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${actualSheetName}'!A1:Z1`,
      });
      hasHeaders = response.data.values && response.data.values.length > 0 && response.data.values[0].length > 0;
    } catch (error) {
      // 如果讀取失敗（可能是空的工作表），視為沒有標題
      hasHeaders = false;
    }

    if (!hasHeaders) {
      // 建立標題行
      const headers = [
        '提交時間',
        '英文名稱',
        '公司/品牌名稱',
        '所屬分會',
        '專業領域',
        '會員電話',
        '會員電郵',
        '入會年資',
        '金章會員',
        'D&A',
        '婚宴分類',
        '婚宴服務描述',
        '服務區域',
        '過往婚宴案例數量',
        '特色服務/差異化優勢',
        'Facebook 連結',
        'Instagram 連結',
        '網站連結',
        'Logo 連結',
        '綠燈證明文件連結',
        '在 BNI 所獲得的婚禮相關業務宗數',
        '生意成交金額',
        '最期望透過 BNI Wedding Group 完成的目標',
        '會否有興趣將來成為 Admin Group 成員',
        'BNI 會員折扣',
        '介紹人',
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${actualSheetName}'!A1:Z1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers],
        },
      });
    }

    // 新增資料行
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${actualSheetName}'!A:A`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [row],
      },
    });

    console.log(`✅ 資料已新增至 Google Sheet: ${spreadsheetId}`);
  } catch (error) {
    console.error('Google Sheet 寫入錯誤:', error);
    throw new Error(
      `寫入 Google Sheet 失敗: ${error instanceof Error ? error.message : '未知錯誤'}`
    );
  }
}

/**
 * 建立新的 Google Sheet 並返回 Sheet ID
 * @param title Sheet 標題
 */
export async function createGoogleSheet(title: string): Promise<string> {
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('GOOGLE_DRIVE_PRIVATE_KEY 環境變數未設定');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
      private_key: privateKey.replace(/\\n/g, '\n'),
      project_id: process.env.GOOGLE_DRIVE_PROJECT_ID,
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });

  try {
    // 建立新的 Spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title,
        },
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;
    if (!spreadsheetId) {
      throw new Error('無法取得新建立的 Sheet ID');
    }

    // 如果設定了資料夾 ID，將 Sheet 移到該資料夾
    if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
      await drive.files.update({
        fileId: spreadsheetId,
        addParents: process.env.GOOGLE_DRIVE_FOLDER_ID,
        fields: 'id, parents',
      });
    }

    console.log(`✅ 已建立新的 Google Sheet: ${spreadsheetId}`);
    return spreadsheetId;
  } catch (error) {
    console.error('建立 Google Sheet 錯誤:', error);
    throw new Error(
      `建立 Google Sheet 失敗: ${error instanceof Error ? error.message : '未知錯誤'}`
    );
  }
}
