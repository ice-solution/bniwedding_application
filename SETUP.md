# 快速設定指南

## 1. 安裝依賴

```bash
# 前端
cd frontend
npm install

# 後端
cd ../backend
npm install
```

## 2. 設定 Google Drive API

**詳細步驟請參考 `GOOGLE_CLOUD_SETUP.md` 檔案**

### 快速步驟：

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 **Google Sheets API** 和 **Google Drive API**
4. 建立服務帳號並下載 JSON 憑證
5. 從 JSON 檔案中取得以下資訊：
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
  ...
}
```

### 步驟 6: 建立 Google Drive 資料夾
1. 在 Google Drive 中建立一個新資料夾（例如：BNI BNWG Applications）
2. 右鍵點擊資料夾 →「共用」
3. 將服務帳號的電子郵件地址（`client_email`）加入為「編輯者」
4. 從資料夾 URL 中取得資料夾 ID
   - URL 格式：`https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j`
   - 資料夾 ID 就是 `1a2b3c4d5e6f7g8h9i0j`

## 3. 設定環境變數

在專案根目錄建立 `.env` 檔案：

```env
# Frontend
VITE_API_URL=http://localhost:3000
VITE_BANNER_URL=your-banner-image-url

# Backend
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Google Drive (從 JSON 憑證檔案中取得)
GOOGLE_DRIVE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_PROJECT_ID=your-project-id

# Google Drive Folder ID (從資料夾 URL 中取得)
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
```

**重要提示**：
- `GOOGLE_DRIVE_PRIVATE_KEY` 必須包含完整的私鑰，包括開頭和結尾的標記
- 私鑰中的換行符號必須使用 `\n` 表示
- 整個私鑰值需要用雙引號包起來

## 4. 執行專案

開啟兩個終端視窗：

**終端 1 - 後端：**
```bash
cd backend
npm run dev
```

**終端 2 - 前端：**
```bash
cd frontend
npm run dev
```

## 5. 測試

1. 開啟瀏覽器前往 `http://localhost:5173`
2. 填寫會員資訊表單
3. 提交表單
4. 檢查 Google Drive 資料夾，應該會看到新建立的 Excel 檔案

## 疑難排解

### 問題：Google Drive 上傳失敗
- 確認服務帳號的電子郵件已加入資料夾的共用設定
- 確認私鑰格式正確（包含換行符號 `\n`）
- 確認專案已啟用 Google Drive API

### 問題：前端無法連接到後端
- 確認後端正在運行（`http://localhost:3000`）
- 檢查 `.env` 中的 `VITE_API_URL` 設定
- 確認 CORS 設定正確

### 問題：表單提交失敗
- 檢查瀏覽器控制台的錯誤訊息
- 檢查後端終端的錯誤日誌
- 確認所有必填欄位都已填寫
