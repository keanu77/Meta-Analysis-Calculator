# Zeabur 靜態部署指南

## 🚢 關於 Zeabur 部署

Zeabur 部署僅提供**靜態網站託管**，不包含 Firebase 後端功能。如果您需要完整的雲端功能（用戶認證、資料儲存等），建議使用 [Firebase 部署方案](./FIREBASE-DEPLOYMENT.md)。

## 🎯 適用情境

- **展示用途**：向他人展示計算器功能
- **離線使用**：純前端計算，無需登入
- **快速部署**：不需要設定資料庫和認證
- **成本考量**：完全免費的託管方案

## 📋 部署步驟

### 1. 準備工作
確保您的代碼已推送到 GitHub。

### 2. 在 Zeabur 創建專案
1. 前往 [Zeabur Console](https://zeabur.com/)
2. 登入或註冊帳號
3. 點擊 "New Project"
4. 連接您的 GitHub 倉庫
5. 選擇 `Meta-Analysis-Calculator` 倉庫

### 3. 配置部署設定
Zeabur 會自動檢測到：
- ✅ `package.json` - Node.js 專案
- ✅ `zeabur.json` - 部署配置
- ✅ `.nvmrc` - Node.js 版本

**自動配置包括：**
- Node.js 版本：18
- 部署類型：靜態網站
- 輸出目錄：當前目錄（.）

### 4. 部署
點擊 "Deploy" 按鈕，Zeabur 會：
1. 克隆您的 GitHub 倉庫
2. 安裝依賴（`npm install`）
3. 執行建構命令（如果有）
4. 部署靜態檔案
5. 提供訪問 URL

### 5. 訪問您的網站
部署完成後，您會獲得類似以下的 URL：
```
https://your-project.zeabur.app
```

## ⚠️ 功能限制

### ❌ 不可用功能（需要 Firebase）
- 用戶註冊和登入
- 計算歷史雲端儲存
- 個人設定同步
- 資料夾分類管理
- 多設備同步

### ✅ 可用功能
- 所有計算功能
- PDF 報告匯出
- 響應式設計
- 圖表生成
- 本地資料儲存（瀏覽器 localStorage）

## 🔧 故障排除

### 問題：部署失敗
**可能原因：**
- Node.js 版本不相容
- 依賴安裝失敗
- 檔案結構錯誤

**解決方案：**
1. 檢查 `.nvmrc` 檔案是否存在
2. 確認 `package.json` 中的依賴
3. 查看 Zeabur 建構日誌

### 問題：網站無法訪問
**檢查項目：**
1. 部署狀態是否為 "Running"
2. 域名 DNS 設定（如果使用自訂域名）
3. 瀏覽器快取清除

### 問題：Firebase 功能不工作
**說明：**
Zeabur 靜態部署不支援 Firebase 功能，這是預期行為。如需完整功能，請使用 Firebase Hosting。

## 🔄 更新部署

### 自動部署
1. 推送代碼到 GitHub main 分支
2. Zeabur 會自動檢測變更
3. 自動重新部署

### 手動部署
1. 前往 Zeabur Console
2. 選擇您的專案
3. 點擊 "Redeploy"

## 💰 成本

**Zeabur 免費方案：**
- 3 個專案
- 每月 100GB 流量
- 自動 HTTPS
- 自訂域名支援

**付費方案：**
- 更多專案數量
- 更高流量限制
- 優先支援

## 🚀 升級到 Firebase

如果您決定使用完整功能，可以：

1. 按照 [Firebase 部署指南](./FIREBASE-DEPLOYMENT.md)
2. 設定 Firebase 專案
3. 部署到 Firebase Hosting
4. 享受完整雲端功能

## 📞 支援

- [Zeabur 官方文檔](https://zeabur.com/docs)
- [專案 GitHub Issues](https://github.com/keanu77/Meta-Analysis-Calculator/issues)
- [Firebase 完整版部署指南](./FIREBASE-DEPLOYMENT.md)

---

**總結：Zeabur 適合快速展示，Firebase 適合完整功能。根據您的需求選擇最適合的部署方案！**