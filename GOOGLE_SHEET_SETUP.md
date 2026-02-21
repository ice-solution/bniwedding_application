# Google Sheet 整合設定指南

本指南說明如何將申請資料直接提交到 Google Sheet，而不是建立 Excel 檔案。

## 方法一：使用現有的 Google Sheet（推薦）

### 步驟 1: 建立 Google Sheet

1. 前往 [Google Sheets](https://sheets.google.com/)
2. 建立新的試算表
3. 將試算表命名為「BNI BNWG 會員申請」（或您喜歡的名稱）

### 步驟 2: 取得 Sheet ID

1. 在瀏覽器網址列中，您會看到類似這樣的 URL：
   ```
   https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit
   ```
2. `1a2b3c4d5e6f7g8h9i0j` 就是您的 Sheet ID
3. 複製這個 ID

### 步驟 3: 設定權限

1. 在 Google Sheet 中，點擊右上角的「共用」按鈕
2. 將服務帳號的電子郵件地址（`GOOGLE_DRIVE_CLIENT_EMAIL`）加入為「編輯者」
3. 點擊「完成」

### 步驟 4: 設定環境變數

在 `backend/.env` 檔案中新增：

```env
GOOGLE_SHEET_ID=您的SheetID
```

例如：
```env
GOOGLE_SHEET_ID=1a2b3c4d5e6f7g8h9i0j
```

### 步驟 5: 重新啟動後端

```bash
cd backend
npm run dev
```

## 方法二：自動建立新的 Google Sheet

如果您希望每次提交都建立新的 Sheet，可以修改程式碼使用 `createGoogleSheet` 函數。

## 資料欄位說明

系統會自動在 Google Sheet 中建立以下欄位：

| 欄位 | 說明 |
|------|------|
| 提交時間 | 申請提交的時間 |
| 英文名稱 | 會員英文名稱 |
| 公司/品牌名稱 | 公司或品牌名稱 |
| 所屬分會 | 會員所屬分會 |
| 專業領域 | 專業領域 |
| 會員電話 | 聯絡電話 |
| 會員電郵 | 電子郵件 |
| 入會年資 | 入會年數 |
| 金章會員 | 是否為金章會員（是/否） |
| 婚宴分類 | 婚宴服務分類 |
| 婚宴服務描述 | 詳細服務描述 |
| 服務區域 | 服務區域 |
| 過往婚宴案例數量 | 案例數量 |
| 特色服務/差異化優勢 | 特色說明 |
| Facebook 連結 | Facebook 頁面連結 |
| Instagram 連結 | Instagram 連結 |
| 網站連結 | 官方網站連結 |
| BNI 會員折扣 | 會員折扣資訊 |
| 介紹人 | 介紹人姓名 |

## 注意事項

1. **首次使用**：系統會自動在第一行建立標題行
2. **權限設定**：確保服務帳號有「編輯者」權限
3. **Sheet ID 格式**：Sheet ID 是長字串，不需要包含 URL 的其他部分
4. **備份建議**：建議定期備份 Google Sheet 資料

## 疑難排解

### 問題：`The incoming JSON object does not contain a private_key field`

**原因**：環境變數 `GOOGLE_DRIVE_PRIVATE_KEY` 未正確設定或為空。

**解決方法**：
1. 檢查 `backend/.env` 檔案中是否有設定 `GOOGLE_DRIVE_PRIVATE_KEY`
2. 確認私鑰格式正確，必須包含：
   - 開頭的 `-----BEGIN PRIVATE KEY-----`
   - 結尾的 `-----END PRIVATE KEY-----`
   - 中間的私鑰內容
3. 私鑰中的換行符號必須使用 `\n` 表示，例如：
   ```env
   GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
   ```
4. 整個值必須用雙引號包起來
5. 重新啟動後端伺服器

### 問題：無法寫入 Google Sheet

**解決方法**：
1. 確認服務帳號已加入 Sheet 的共用設定
2. 確認 Sheet ID 正確
3. 檢查後端日誌中的錯誤訊息
4. 確認已啟用 Google Sheets API

### 問題：找不到 Sheet

**解決方法**：
1. 確認 Sheet ID 是否正確
2. 確認服務帳號有權限存取該 Sheet

### 問題：資料格式錯誤

**解決方法**：
- 系統會自動處理資料格式，如果遇到問題，請檢查後端日誌

## 切換回 Excel 模式

如果您想切換回原本的 Excel 上傳模式，只需：

1. 在 `backend/.env` 中移除或註解掉 `GOOGLE_SHEET_ID`
2. 重新啟動後端

系統會自動切換回建立 Excel 檔案並上傳到 Google Drive 的模式。
