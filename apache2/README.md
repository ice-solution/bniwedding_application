# Apache2 VirtualHost 配置說明

本配置適用於使用 Cloudflare Flexible SSL 的部署環境。

## 配置說明

### Cloudflare Flexible SSL
- **用戶 → Cloudflare**：HTTPS（加密）
- **Cloudflare → 服務器**：HTTP（未加密）

因此 Apache2 只需要監聽 HTTP (port 80)，不需要配置 SSL 證書。

## 安裝步驟

### 1. 啟用必要的 Apache2 模組

```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod expires
# 如果需要真實 IP，啟用以下之一：
# sudo a2enmod remoteip  # 推薦
# 或
# sudo a2enmod cloudflare  # 如果可用
```

### 2. 複製配置文件

```bash
sudo cp apache2/virtualhost.conf /etc/apache2/sites-available/bniwedding.conf
```

### 3. 修改配置

編輯配置文件，修改以下內容：

```bash
sudo nano /etc/apache2/sites-available/bniwedding.conf
```

**需要修改的地方**：
- `ServerName bniwedding.brandcativation.hk` → 已設定
- `ServerAlias www.bniwedding.brandcativation.hk` → 已設定（可選）
- `DocumentRoot /var/www/bniwedding/frontend/dist` → 改為實際的前端建置目錄
- 確認後端服務運行在 `localhost:3000`

### 4. 設定真實 IP（推薦）

如果使用 `mod_remoteip`，編輯 `/etc/apache2/apache2.conf`：

```apache
# 在文件開頭或適當位置加入
RemoteIPHeader CF-Connecting-IP
RemoteIPTrustedProxy 173.245.48.0/20
RemoteIPTrustedProxy 103.21.244.0/22
RemoteIPTrustedProxy 103.22.200.0/22
RemoteIPTrustedProxy 103.31.4.0/22
RemoteIPTrustedProxy 141.101.64.0/18
RemoteIPTrustedProxy 108.162.192.0/18
RemoteIPTrustedProxy 190.93.240.0/20
RemoteIPTrustedProxy 188.114.96.0/20
RemoteIPTrustedProxy 197.234.240.0/22
RemoteIPTrustedProxy 198.41.128.0/17
RemoteIPTrustedProxy 162.158.0.0/15
RemoteIPTrustedProxy 104.16.0.0/13
RemoteIPTrustedProxy 104.24.0.0/14
RemoteIPTrustedProxy 172.64.0.0/13
RemoteIPTrustedProxy 131.0.72.0/22
# IPv6 範圍（如果支援）
RemoteIPTrustedProxy 2400:cb00::/32
RemoteIPTrustedProxy 2606:4700::/32
RemoteIPTrustedProxy 2803:f800::/32
RemoteIPTrustedProxy 2405:b500::/32
RemoteIPTrustedProxy 2405:8100::/32
RemoteIPTrustedProxy 2a06:98c0::/29
RemoteIPTrustedProxy 2c0f:f248::/32
```

### 5. 建立目錄結構

```bash
# 建立前端建置目錄
sudo mkdir -p /var/www/bniwedding/frontend/dist

# 建立日誌目錄（如果不存在）
sudo mkdir -p /var/log/apache2
```

### 6. 建置前端

```bash
cd /path/to/bniwedding/frontend
npm run build
sudo cp -r dist/* /var/www/bniwedding/frontend/dist/
```

### 7. 設定權限

```bash
sudo chown -R www-data:www-data /var/www/bniwedding
sudo chmod -R 755 /var/www/bniwedding
```

### 8. 啟用站點

```bash
sudo a2ensite bniwedding.conf
sudo a2dissite 000-default.conf  # 停用預設站點（可選）
```

### 9. 測試配置

```bash
sudo apache2ctl configtest
```

如果顯示 `Syntax OK`，則配置正確。

### 10. 重新啟動 Apache2

```bash
sudo systemctl restart apache2
```

## 後端服務器設定

確保後端 Node.js 服務器正在運行：

```bash
cd /path/to/bniwedding/backend
npm run build
npm start
```

或使用 PM2 管理：

```bash
pm2 start dist/index.js --name bniwedding-backend
pm2 save
pm2 startup
```

## Cloudflare 設定

### 1. SSL/TLS 模式
- 在 Cloudflare 控制台中：
- 前往「SSL/TLS」→「概覽」
- 選擇「Flexible」模式

### 2. 快取設定
- 前往「快取」→「設定」
- 建議設定：
  - 靜態資源：快取所有內容
  - HTML：繞過快取（因為是 SPA）

### 3. 頁面規則（可選）
建立規則：
- URL：`bniwedding.brandcativation.hk/*`
- 設定：快取層級 → 繞過

## 測試

1. 訪問 `http://bniwedding.brandcativation.hk`（應該會自動重定向到 HTTPS）
2. 測試 API：`https://bniwedding.brandcativation.hk/api/health`
3. 測試靜態資源：`https://bniwedding.brandcativation.hk/static/bnibanner.jpg`

## 疑難排解

### 問題：502 Bad Gateway
- 確認後端服務正在運行：`curl http://localhost:3000/health`
- 檢查 Apache2 錯誤日誌：`sudo tail -f /var/log/apache2/bniwedding-error.log`

### 問題：404 Not Found
- 確認前端已正確建置並複製到 `/var/www/bniwedding/frontend/dist`
- 檢查 `DocumentRoot` 設定是否正確

### 問題：API 請求失敗
- 確認 ProxyPass 設定正確
- 檢查後端 CORS 設定是否允許您的域名

### 問題：無法取得真實 IP
- 確認已啟用 `mod_remoteip` 或 `mod_cloudflare`
- 檢查 Cloudflare IP 範圍是否正確設定

## 安全建議

1. **使用 Full SSL 模式**（推薦）：
   - 在 Cloudflare 中改為「Full」或「Full (strict)」模式
   - 在 Apache2 中配置 SSL 證書（使用 Let's Encrypt）

2. **防火牆設定**：
   - 只允許 Cloudflare IP 範圍訪問服務器
   - 封鎖直接訪問（不通過 Cloudflare）

3. **定期更新**：
   - 保持 Apache2 和系統更新
   - 定期檢查日誌
