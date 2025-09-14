# Meta Analysis Calculator - 部署指南

## 部署到 Zeabur 平台

### 1. 準備工作

#### 1.1 建立 PlanetScale 資料庫
1. 前往 [PlanetScale](https://planetscale.com/) 註冊帳號
2. 建立新的資料庫專案
3. 記錄資料庫連接資訊：
   - HOST
   - USERNAME
   - PASSWORD

#### 1.2 準備 GitHub 倉庫
確保您的程式碼已推送至 GitHub 倉庫。

### 2. 設定資料庫

#### 2.1 建立資料表
1. 連接到 PlanetScale 資料庫
2. 執行 `database-schema.sql` 中的所有 SQL 語句以建立必要的資料表

```bash
# 使用 PlanetScale CLI (可選)
pscale shell your-database-name main < database-schema.sql
```

### 3. 部署到 Zeabur

#### 3.1 建立 Zeabur 專案
1. 前往 [Zeabur](https://zeabur.com/) 登入或註冊
2. 建立新專案
3. 連接您的 GitHub 倉庫

#### 3.2 設定環境變數
在 Zeabur 控制台中設定以下環境變數：

```bash
# 資料庫配置
DATABASE_HOST=your-database-host.connect.psdb.cloud
DATABASE_USERNAME=your-username
DATABASE_PASSWORD=your-password

# JWT 密鑰 (請使用強密碼)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# 前端URL (部署後的域名)
FRONTEND_URL=https://your-app.zeabur.app

# 環境設定
NODE_ENV=production
PORT=3000
```

#### 3.3 部署設定
Zeabur 會自動檢測到：
- 前端靜態檔案（根目錄）
- 後端 API 服務（`/api` 資料夾）

### 4. 驗證部署

#### 4.1 檢查 API 健康狀態
訪問：`https://your-app.zeabur.app/health`
應該返回：
```json
{
  "status": "healthy",
  "timestamp": "2025-01-xx...",
  "service": "meta-calculator-api"
}
```

#### 4.2 測試前端功能
1. 訪問主頁：`https://your-app.zeabur.app`
2. 測試註冊功能（使用註冊碼：EBM2025）
3. 測試登入功能
4. 測試計算功能並儲存

### 5. 本地開發設定

如果您想在本地運行此專案：

#### 5.1 設定後端
```bash
cd api
npm install
cp .env.example .env
# 編輯 .env 填入您的資料庫資訊
npm run dev
```

#### 5.2 設定前端
```bash
# 在根目錄
npm start
# 或
npx http-server -p 8080 -o
```

### 6. 故障排除

#### 6.1 常見問題

**Q: API 請求失敗**
- 檢查環境變數是否正確設定
- 確認資料庫連接資訊
- 檢查 CORS 設定

**Q: 無法註冊/登入**
- 確認資料表已正確建立
- 檢查註冊碼是否正確
- 查看瀏覽器開發者工具的網路標籤

**Q: 前端無法連接到 API**
- 檢查 `api-client.js` 中的 API URL
- 確認後端服務正在運行
- 檢查防火牆設定

#### 6.2 日誌查看
在 Zeabur 控制台中可以查看：
- 應用程式日誌
- 錯誤日誌
- 請求日誌

### 7. 安全性注意事項

1. **JWT 密鑰**：使用強隨機密鑰，至少32個字符
2. **資料庫密碼**：定期更換資料庫密碼
3. **HTTPS**：確保在生產環境中使用 HTTPS
4. **CORS**：適當設定 CORS 政策
5. **輸入驗證**：API 已包含輸入驗證，請勿移除

### 8. 監控與維護

#### 8.1 監控指標
- API 回應時間
- 錯誤率
- 用戶註冊/登入次數
- 資料庫連接狀態

#### 8.2 定期維護
- 定期備份資料庫
- 更新相依套件
- 監控日誌錯誤
- 性能最佳化

## 支援

如遇到問題，請查看：
1. Zeabur 官方文件
2. PlanetScale 官方文件
3. 本專案的 GitHub Issues