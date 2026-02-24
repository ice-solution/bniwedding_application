# PM2 設置指南

本指南說明如何使用 PM2 來管理後端服務。

## 後端運作方式

### 開發模式（Development）
- 使用 `nodemon` + `tsx` 直接運行 TypeScript
- 自動監聽文件變化並重啟
- 命令：`npm run dev`

### 生產模式（Production）
1. **編譯 TypeScript**：`npm run build`
   - 將 `src/` 目錄下的 TypeScript 編譯成 JavaScript
   - 輸出到 `dist/` 目錄

2. **運行編譯後的代碼**：`npm start`
   - 運行 `dist/index.js`
   - 這是編譯後的 JavaScript 文件

## PM2 安裝

如果還沒有安裝 PM2，請先安裝：

```bash
npm install -g pm2
```

## PM2 使用方式

### 1. 啟動服務（無需編譯）

PM2 配置已設置為直接運行 TypeScript，無需先編譯：

```bash
# 方式 1: 使用 npm 腳本
npm run start:pm2

# 方式 2: 直接使用 PM2
pm2 start ecosystem.config.cjs
```

**注意**：現在 PM2 會直接運行 `tsx src/index.ts`，無需先執行 `npm run build`。

### 3. 查看狀態

```bash
pm2 status
```

### 4. 查看日誌

```bash
# 使用 npm 腳本
npm run logs:pm2

# 或直接使用 PM2
pm2 logs bniwedding-backend

# 查看實時日誌
pm2 logs bniwedding-backend --lines 50

# 清空日誌
pm2 flush
```

### 5. 重啟服務

```bash
# 使用 npm 腳本
npm run restart:pm2

# 或直接使用 PM2
pm2 restart bniwedding-backend
```

### 6. 停止服務

```bash
# 使用 npm 腳本
npm run stop:pm2

# 或直接使用 PM2
pm2 stop bniwedding-backend
```

### 7. 刪除服務（從 PM2 列表中移除）

```bash
# 使用 npm 腳本
npm run delete:pm2

# 或直接使用 PM2
pm2 delete bniwedding-backend
```

## PM2 常用命令

### 查看所有進程
```bash
pm2 list
```

### 監控
```bash
pm2 monit
```

### 保存當前進程列表
```bash
pm2 save
```

### 設置開機自啟
```bash
pm2 startup
pm2 save
```

### 重載配置（零停機時間）
```bash
pm2 reload bniwedding-backend
```

## 更新代碼後的流程

由於 PM2 直接運行 TypeScript，更新代碼後只需重啟：

```bash
npm run restart:pm2
# 或
pm2 restart bniwedding-backend
```

**無需編譯**：PM2 會直接使用 `tsx` 運行 TypeScript 源碼。

### 可選：啟用自動重載

如果想讓 PM2 自動監聽文件變化並重載，可以修改 `ecosystem.config.cjs`：

```javascript
watch: ['src'],
ignore_watch: ['node_modules', 'logs', 'uploads', 'dist'],
```

然後重啟 PM2：
```bash
pm2 restart bniwedding-backend --update-env
```

## 配置文件說明

`ecosystem.config.cjs` 配置說明：

- `name`: PM2 進程名稱
- `script`: 要運行的命令（`tsx`）
- `args`: 命令參數（`src/index.ts`）
- `interpreter`: 解釋器（`node`）
- `instances`: 實例數量（1 = 單實例）
- `exec_mode`: 執行模式（`fork` = 單進程）
- `watch`: 是否監聽文件變化（`false` = 不監聽，設為 `true` 可自動重載）
- `max_memory_restart`: 內存超過 500MB 時自動重啟
- `env`: 環境變數（生產環境）
- `error_file` / `out_file`: 日誌文件路徑
- `autorestart`: 自動重啟
- `max_restarts`: 最大重啟次數

## 日誌位置

- 錯誤日誌：`backend/logs/pm2-error.log`
- 輸出日誌：`backend/logs/pm2-out.log`

## 環境變數

PM2 會從以下位置讀取環境變數（按優先級）：

1. `ecosystem.config.cjs` 中的 `env` 配置
2. `backend/.env` 文件（通過 `dotenv/config`）
3. 系統環境變數

建議在 `backend/.env` 文件中設置環境變數。

## 故障排除

### 服務無法啟動

1. 檢查 `tsx` 是否已安裝：
   ```bash
   npm list tsx
   ```

2. 檢查日誌：
   ```bash
   pm2 logs bniwedding-backend --lines 100
   ```

3. 檢查端口是否被占用：
   ```bash
   lsof -i:6137
   ```

4. 手動測試運行：
   ```bash
   npm run dev:direct
   ```

### 服務頻繁重啟

1. 檢查內存使用：
   ```bash
   pm2 monit
   ```

2. 檢查錯誤日誌：
   ```bash
   tail -f logs/pm2-error.log
   ```

## 開發模式 vs 生產模式

### 開發模式（推薦使用 nodemon）
```bash
npm run dev
```
- 自動重載，無需手動編譯
- 適合開發時使用

### 生產模式（使用 PM2）
```bash
npm run build
npm run start:pm2
```
- 性能更好
- 有進程管理、日誌、監控等功能
- 適合生產環境

## 完整部署流程

```bash
# 1. 進入後端目錄
cd backend

# 2. 安裝依賴（首次或更新後）
npm install

# 3. 啟動 PM2（直接運行 TypeScript，無需編譯）
npm run start:pm2

# 4. 檢查狀態
pm2 status

# 5. 查看日誌確認正常運行
pm2 logs bniwedding-backend --lines 20
```

**注意**：現在無需執行 `npm run build`，PM2 會直接運行 TypeScript 源碼。
