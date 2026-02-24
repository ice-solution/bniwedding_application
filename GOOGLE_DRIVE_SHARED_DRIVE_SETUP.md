# Google Drive 共享驅動器設置指南

由於 Service Account 沒有存儲配額，需要使用共享驅動器（Shared Drive）來上傳檔案。

## 為什麼需要使用共享驅動器？

Service Account 本身沒有 Google Drive 存儲配額，因此無法直接上傳檔案到個人 Google Drive。解決方案是使用共享驅動器（Shared Drive），這是 Google Workspace 的功能。

## 設置步驟

### 方法一：使用現有的共享驅動器（推薦）

如果您已經有 Google Workspace 帳號和共享驅動器：

1. **取得共享驅動器 ID**
   - 打開 Google Drive
   - 進入您的共享驅動器
   - 在瀏覽器網址列中，您會看到類似這樣的 URL：
     ```
     https://drive.google.com/drive/folders/0ABC123xyz
     ```
   - `0ABC123xyz` 就是共享驅動器 ID 或文件夾 ID

2. **設置 Service Account 權限**
   - 在共享驅動器中，點擊右上角的「管理成員」
   - 將服務帳號的電子郵件地址（`GOOGLE_DRIVE_CLIENT_EMAIL`）加入為「內容管理員」或「編輯者」
   - 確保服務帳號有上傳檔案的權限

3. **設定環境變數**

   在 `backend/.env` 檔案中設定：

   ```env
   # 共享驅動器 ID（如果使用共享驅動器）
   GOOGLE_DRIVE_SHARED_DRIVE_ID=0ABC123xyz

   # 或者使用文件夾 ID（文件夾必須在共享驅動器中）
   GOOGLE_DRIVE_FOLDER_ID=0ABC123xyz
   ```

   **注意**：
   - 如果設置了 `GOOGLE_DRIVE_SHARED_DRIVE_ID`，檔案會上傳到共享驅動器的根目錄
   - 如果設置了 `GOOGLE_DRIVE_FOLDER_ID` 且文件夾在共享驅動器中，檔案會上傳到該文件夾
   - 兩者可以同時設置，但優先使用 `GOOGLE_DRIVE_SHARED_DRIVE_ID`

### 方法二：創建新的共享驅動器

如果您有 Google Workspace 管理員權限：

1. **創建共享驅動器**
   - 登入 [Google Drive](https://drive.google.com)
   - 點擊左側的「共享雲端硬碟」
   - 點擊「新增」→「新增共享雲端硬碟」
   - 輸入名稱（例如：「BNI BNWG 檔案」）
   - 點擊「建立」

2. **設置 Service Account 權限**
   - 在共享驅動器中，點擊右上角的「管理成員」
   - 點擊「新增成員」
   - 輸入服務帳號的電子郵件地址（`GOOGLE_DRIVE_CLIENT_EMAIL`）
   - 選擇角色為「內容管理員」
   - 點擊「傳送」

3. **取得共享驅動器 ID**
   - 在共享驅動器中，點擊右上角的「設定」圖示
   - 在「一般」標籤中，您會看到「共享雲端硬碟 ID」
   - 複製這個 ID

4. **設定環境變數**

   在 `backend/.env` 檔案中設定：

   ```env
   GOOGLE_DRIVE_SHARED_DRIVE_ID=您的共享驅動器ID
   ```

## 環境變數說明

### `GOOGLE_DRIVE_SHARED_DRIVE_ID`（可選）
- 共享驅動器的 ID
- 如果設置，檔案會上傳到共享驅動器的根目錄
- 優先級高於 `GOOGLE_DRIVE_FOLDER_ID`

### `GOOGLE_DRIVE_FOLDER_ID`（可選）
- 文件夾 ID（可以是共享驅動器中的文件夾）
- 如果設置且文件夾在共享驅動器中，系統會自動檢測並使用共享驅動器模式
- 如果未設置 `GOOGLE_DRIVE_SHARED_DRIVE_ID`，系統會嘗試檢測文件夾是否在共享驅動器中

## 權限設置

確保服務帳號在共享驅動器中具有以下權限之一：
- **內容管理員**（推薦）：可以上傳、編輯、刪除檔案
- **編輯者**：可以上傳和編輯檔案

## 測試

設置完成後，重啟後端服務器，然後測試檔案上傳功能：

```bash
cd backend
npm run dev
```

如果設置正確，檔案應該能夠成功上傳到共享驅動器。

## 常見問題

### Q: 我沒有 Google Workspace 帳號怎麼辦？

A: 您需要 Google Workspace 帳號才能使用共享驅動器。如果沒有，可以考慮：
1. 申請 Google Workspace 試用版
2. 使用 OAuth 2.0 委派（需要額外的設置）
3. 將檔案上傳到其他存儲服務（如 AWS S3、Cloudflare R2 等）

### Q: 檔案上傳後無法公開訪問？

A: 共享驅動器中的檔案權限設置可能不同。您可以：
1. 在共享驅動器中手動設置檔案權限
2. 使用共享連結而不是公開連結
3. 在共享驅動器設置中允許外部訪問

### Q: 如何取得共享驅動器 ID？

A: 有幾種方法：
1. 在共享驅動器的設定中查看
2. 使用 Google Drive API 查詢
3. 在共享驅動器的 URL 中查找（如果可見）

## 相關文檔

- [Google Drive API - Shared Drives](https://developers.google.com/drive/api/guides/about-shareddrives)
- [Google Workspace 共享雲端硬碟](https://support.google.com/a/answer/7212025)
