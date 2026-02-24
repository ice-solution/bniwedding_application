# 後端運行指南

## 為什麼不能直接運行 `tsx src/index.ts`？

`tsx` 是作為**項目依賴**安裝的（在 `devDependencies` 中），而不是全局安裝。因此不能直接在命令行運行 `tsx`。

## 解決方案

### 方式 1：使用 npm 腳本（推薦）

```bash
# 開發模式（使用 nodemon，自動重載）
npm run dev

# 直接運行（不使用 nodemon）
npm run dev:direct
```

### 方式 2：使用 npx

```bash
npx tsx src/index.ts
```

`npx` 會自動查找項目中的 `tsx` 並運行。

### 方式 3：全局安裝 tsx（不推薦）

```bash
npm install -g tsx
```

然後就可以直接運行：
```bash
tsx src/index.ts
```

**不推薦的原因**：不同項目可能需要不同版本的 `tsx`，全局安裝可能導致版本衝突。

## 運行方式對比

| 方式 | 命令 | 優點 | 缺點 |
|------|------|------|------|
| **nodemon** | `npm run dev` | 自動重載，開發友好 | 需要額外依賴 |
| **直接運行** | `npm run dev:direct` | 簡單直接 | 需要手動重啟 |
| **npx** | `npx tsx src/index.ts` | 不需要全局安裝 | 命令較長 |
| **PM2** | `npm run start:pm2` | 生產環境，進程管理 | 需要先編譯 |

## 推薦使用方式

### 開發時
```bash
npm run dev
```
- 使用 nodemon 自動監聽文件變化
- 修改代碼後自動重啟
- 最適合開發

### 測試直接運行
```bash
npm run dev:direct
```
- 直接運行 TypeScript，無需編譯
- 適合快速測試

### 生產環境
```bash
npm run build
npm run start:pm2
```
- 先編譯成 JavaScript
- 使用 PM2 管理進程
- 性能更好，有日誌和監控

## 常見問題

### Q: 為什麼 `tsx src/index.ts` 報錯 "command not found"？

A: 因為 `tsx` 沒有全局安裝。使用 `npm run dev:direct` 或 `npx tsx src/index.ts`。

### Q: 端口已被占用怎麼辦？

A: 檢查是否有其他進程在使用端口 6137：
```bash
lsof -i:6137
```

停止占用端口的進程，或修改 `.env` 中的 `PORT` 設置。

### Q: 如何查看運行日誌？

A: 
- 開發模式：直接在終端查看
- PM2 模式：`pm2 logs bniwedding-backend`
