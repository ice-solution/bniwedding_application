# 本地文件存儲設置指南

如果您是免費 Google 帳號，無法使用共享驅動器，可以使用本地文件存儲作為替代方案。

## 優點

- ✅ 無需 Google Workspace
- ✅ 無需額外的雲存儲服務
- ✅ 設置簡單
- ✅ 完全免費

## 缺點

- ⚠️ 文件存儲在服務器本地，需要定期備份
- ⚠️ 需要確保服務器有足夠的存儲空間
- ⚠️ 如果服務器故障，文件可能丟失

## 設置步驟

### 1. 設置環境變數

在 `backend/.env` 文件中添加或修改：

```env
# 存儲類型：'local' 或 'google'
STORAGE_TYPE=local

# API 基礎 URL（用於生成文件訪問鏈接）
API_BASE_URL=http://localhost:6137
# 生產環境請改為實際域名，例如：
# API_BASE_URL=https://bniwedding.brandcativation.hk
```

### 2. 文件存儲位置

文件會存儲在：
```
backend/uploads/YYYY-MM-DD/文件名
```

例如：
```
backend/uploads/2025-02-25/member-files-1737820800000-abc123.pdf
```

### 3. 文件訪問

上傳後的文件可以通過以下 URL 訪問：
```
http://localhost:6137/static/uploads/YYYY-MM-DD/文件名
```

## 自動回退機制

如果設置了 `STORAGE_TYPE=google` 但 Google Drive 上傳失敗（例如沒有 Workspace），系統會自動回退到本地存儲。

## 備份建議

由於文件存儲在本地，建議：

1. **定期備份**
   ```bash
   # 備份上傳的文件夾
   tar -czf backups/uploads-$(date +%Y%m%d).tar.gz backend/uploads/
   ```

2. **自動備份腳本**
   可以設置 cron job 定期備份到其他位置（如其他服務器、雲存儲等）

3. **監控磁盤空間**
   確保服務器有足夠空間存儲文件

## 切換回 Google Drive

如果將來獲得 Google Workspace 帳號，只需：

1. 設置共享驅動器（參考 `GOOGLE_DRIVE_SHARED_DRIVE_SETUP.md`）
2. 更新 `backend/.env`：
   ```env
   STORAGE_TYPE=google
   GOOGLE_DRIVE_SHARED_DRIVE_ID=您的共享驅動器ID
   ```

## 文件管理

### 查看上傳的文件

```bash
ls -lh backend/uploads/
```

### 清理舊文件

如果需要清理舊文件（例如超過 90 天）：

```bash
find backend/uploads -type f -mtime +90 -delete
```

### 文件大小限制

默認文件大小限制為 16MB，可以在 `backend/src/routes/upload.ts` 中修改：

```typescript
limits: {
  fileSize: 16 * 1024 * 1024, // 16MB
}
```

## 生產環境注意事項

1. **設置正確的 API_BASE_URL**
   ```env
   API_BASE_URL=https://bniwedding.brandcativation.hk
   ```

2. **確保上傳目錄權限正確**
   ```bash
   chmod 755 backend/uploads
   ```

3. **設置自動備份**
   建議設置定期備份腳本

4. **監控磁盤使用**
   確保有足夠空間

## 與 Google Sheets 整合

即使使用本地文件存儲，Google Sheets 數據提交仍然可以正常工作。文件 URL 會存儲在 Google Sheet 中，指向您的服務器。
