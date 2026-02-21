# BNI BNWG 會員資訊收集系統

這是一個使用 Vite + React 前端和 Express 後端的會員資訊收集系統，申請資料會自動上傳到 Google Drive 的 Excel 檔案中。

## 專案結構

```
bniwedding/
├── frontend/          # Vite + React 前端
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── lib/
│   └── package.json
├── backend/           # Express 後端 API
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── services/
│   └── package.json
└── .env.example       # 環境變數範例
```

## 功能特色

- ✅ 使用 Vite 作為前端建置工具
- ✅ React + TypeScript 前端框架
- ✅ Express 後端 API
- ✅ 自動將申請資料轉換為 Excel 並上傳至 Google Drive
- ✅ 所有配置使用 .env 環境變數管理
- ✅ 完整的表單驗證

## 安裝與設定

### 1. 安裝依賴

**方法一：使用根目錄指令（推薦）**
```bash
# 在根目錄執行，會自動安裝所有依賴
npm run install:all
```

**方法二：分別安裝**
```bash
# 安裝前端依賴
cd frontend
npm install

# 安裝後端依賴
cd ../backend
npm install
```

### 2. 設定 Google Drive API

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 Google Drive API
4. 建立服務帳號（Service Account）
5. 下載服務帳號的 JSON 憑證
6. 從 JSON 檔案中取得以下資訊：
   - `client_email`
   - `private_key`
   - `project_id`
7. 在 Google Drive 中建立一個資料夾用於存放申請檔案
8. 將該資料夾的 ID 複製下來（從 URL 中取得）

### 3. 設定環境變數

**前端環境變數：**

複製 `frontend/.env.example` 並建立 `frontend/.env` 檔案：

```bash
cd frontend
cp .env.example .env
```

編輯 `frontend/.env` 檔案：

```env
# API 後端 URL
VITE_API_URL=http://localhost:3000

# Banner 圖片 URL（選填）
VITE_BANNER_URL=

# Frontend Port（選填，預設為 5173）
VITE_PORT=5173
```

**後端環境變數：**

複製 `backend/.env.example` 並建立 `backend/.env` 檔案：

```bash
cd backend
cp .env.example .env
```

編輯 `backend/.env` 檔案：

```env
# Server Port
PORT=3000

# Node Environment
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Google Drive API
GOOGLE_DRIVE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_PROJECT_ID=your-project-id
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
```

**重要提示**：
- `GOOGLE_DRIVE_PRIVATE_KEY` 需要包含完整的私鑰，包括 `-----BEGIN PRIVATE KEY-----` 和 `-----END PRIVATE KEY-----`
- 私鑰中的換行符號需要使用 `\n` 表示
- 確保服務帳號有權限存取指定的 Google Drive 資料夾

### 4. 設定 Google Drive 資料夾權限

1. 在 Google Drive 中找到您要使用的資料夾
2. 右鍵點擊資料夾 → 共用
3. 將服務帳號的電子郵件地址（`GOOGLE_DRIVE_CLIENT_EMAIL`）加入為編輯者

## 執行專案

### 開發模式

**方法一：同時啟動前端和後端（推薦）**
```bash
# 在根目錄執行
npm run dev:all
```

這會同時啟動：
- 前端：`http://localhost:5173`
- 後端：`http://localhost:3000`

**方法二：分別啟動**

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

或者使用根目錄的個別指令：
```bash
# 只啟動後端
npm run dev:backend

# 只啟動前端
npm run dev:frontend
```

### 生產模式

**建置前端：**
```bash
cd frontend
npm run build
```

**啟動後端：**
```bash
cd backend
npm run build
npm start
```

## API 端點

### POST `/api/application/submit`

提交會員申請資料

**請求體：**
```json
{
  "englishName": "John Doe",
  "companyName": "ABC Wedding Studio",
  "chapter": "香港分會",
  "profession": "婚禮攝影",
  "phone": "+852 1234 5678",
  "email": "john@example.com",
  "yearsOfMembership": 5,
  "isGoldMember": "yes",
  "weddingCategory": "攝影",
  "weddingServices": "提供專業婚禮攝影服務...",
  "serviceArea": "香港、九龍",
  "pastCasesCount": 100,
  "uniqueAdvantage": "10年經驗...",
  "facebookLink": "https://facebook.com/...",
  "instagramLink": "https://instagram.com/...",
  "websiteLink": "https://example.com",
  "bniMemberDiscount": "9折優惠",
  "referrer": "介紹人姓名"
}
```

**回應：**
```json
{
  "success": true,
  "message": "申請已成功提交並上傳至 Google Drive",
  "fileId": "google-drive-file-id"
}
```

## 技術棧

### 前端
- **Vite** - 建置工具
- **React 19** - UI 框架
- **TypeScript** - 類型安全
- **Tailwind CSS** - 樣式框架
- **React Hook Form** - 表單管理
- **Zod** - 資料驗證
- **Sonner** - Toast 通知

### 後端
- **Express** - Web 框架
- **TypeScript** - 類型安全
- **Google APIs** - Google Drive 整合
- **XLSX** - Excel 檔案生成
- **Zod** - 資料驗證

## 授權

MIT License
