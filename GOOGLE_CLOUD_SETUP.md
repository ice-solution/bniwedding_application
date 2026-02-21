# Google Cloud Console 設定指南

本指南詳細說明如何在 Google Cloud Console 中設定服務帳號並取得憑證。

## 步驟 1: 建立或選擇 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 如果還沒有專案，點擊頂部的專案選擇器
3. 點擊「新增專案」
4. 輸入專案名稱（例如：`bniwedding`）
5. 點擊「建立」
6. 等待專案建立完成

## 步驟 2: 啟用必要的 API

### 啟用 Google Sheets API

1. 在左側選單中，點擊「API 和服務」→「程式庫」
2. 在搜尋框中輸入「Google Sheets API」
3. 點擊「Google Sheets API」
4. 點擊「啟用」按鈕
5. 等待啟用完成

### 啟用 Google Drive API

1. 在「API 和服務」→「程式庫」中
2. 搜尋「Google Drive API」
3. 點擊「Google Drive API」
4. 點擊「啟用」按鈕

## 步驟 3: 建立服務帳號

1. 在左側選單中，點擊「IAM 和管理」→「服務帳號」
2. 點擊頂部的「建立服務帳號」按鈕
3. 填寫服務帳號詳細資料：
   - **服務帳號名稱**：輸入名稱（例如：`bniwedding-service`）
   - **服務帳號 ID**：會自動產生（可以修改）
   - **服務帳號說明**：選填（例如：`BNI BNWG 會員申請系統`）
4. 點擊「建立並繼續」
5. **可選步驟**：授予角色（可以跳過，直接點擊「繼續」）
6. 點擊「完成」

## 步驟 4: 建立並下載服務帳號金鑰

1. 在「服務帳號」列表中，找到剛才建立的服務帳號
2. 點擊服務帳號名稱進入詳細頁面
3. 點擊頂部的「金鑰」標籤
4. 點擊「新增金鑰」→「建立新金鑰」
5. 選擇「JSON」格式
6. 點擊「建立」
7. JSON 檔案會自動下載到您的電腦

## 步驟 5: 從 JSON 檔案取得憑證資訊

開啟下載的 JSON 檔案，您會看到類似以下的內容：

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project-id.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### 需要的資訊：

1. **`client_email`** → 這就是 `GOOGLE_DRIVE_CLIENT_EMAIL`
2. **`private_key`** → 這就是 `GOOGLE_DRIVE_PRIVATE_KEY`
3. **`project_id`** → 這就是 `GOOGLE_DRIVE_PROJECT_ID`

## 步驟 6: 設定環境變數

在 `backend/.env` 檔案中設定：

```env
# 從 JSON 檔案中複製這些值
GOOGLE_DRIVE_CLIENT_EMAIL=your-service-account@your-project-id.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_PROJECT_ID=your-project-id
```

### 重要提示：private_key 格式

`private_key` 的值必須：
- 包含完整的私鑰，包括 `-----BEGIN PRIVATE KEY-----` 和 `-----END PRIVATE KEY-----`
- 將 JSON 中的 `\n` 保留（不要移除）
- 整個值用雙引號 `"` 包起來

**範例**：
```env
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7vbqajDhYghr8\n...更多內容...\n-----END PRIVATE KEY-----\n"
```

## 步驟 7: 設定 Google Sheet 權限

1. 開啟您的 Google Sheet
2. 點擊右上角的「共用」按鈕
3. 在「新增人員和群組」欄位中，輸入服務帳號的電子郵件（`client_email`）
4. 選擇「編輯者」權限
5. **取消勾選「通知人員」**（服務帳號不需要通知）
6. 點擊「共用」

## 步驟 8: 設定 Google Drive 資料夾權限（如果使用 Excel 模式）

1. 在 Google Drive 中找到您要使用的資料夾
2. 右鍵點擊資料夾 →「共用」
3. 輸入服務帳號的電子郵件（`client_email`）
4. 選擇「編輯者」權限
5. 點擊「完成」

## 驗證設定

重新啟動後端伺服器：

```bash
cd backend
npm run dev
```

如果設定正確，您應該不會看到任何認證錯誤。

## 常見問題

### Q: 找不到「API 和服務」選單？
A: 確保您已選擇正確的專案，並且有專案的編輯權限。

### Q: 下載的 JSON 檔案在哪裡？
A: 通常在瀏覽器的下載資料夾中，檔案名稱類似 `your-project-id-xxxxx.json`

### Q: private_key 格式錯誤怎麼辦？
A: 確保：
- 使用雙引號包起來
- 保留所有的 `\n` 換行符號
- 包含完整的 `-----BEGIN PRIVATE KEY-----` 和 `-----END PRIVATE KEY-----`

### Q: 如何確認服務帳號有正確權限？
A: 在 Google Sheet 的「共用」設定中，確認服務帳號的電子郵件已列在共用列表中，且權限為「編輯者」。

## 安全注意事項

⚠️ **重要**：
- JSON 憑證檔案包含敏感資訊，請妥善保管
- 不要將 JSON 檔案或 `.env` 檔案提交到 Git 儲存庫
- 如果憑證洩露，請立即在 Google Cloud Console 中刪除並重新建立

## 下一步

設定完成後，請參考 `GOOGLE_SHEET_SETUP.md` 了解如何設定 Google Sheet ID。
