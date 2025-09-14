# Meta Analysis Calculator - Firebase 部署指南

## 🔥 Firebase 完整部署教學

### 前置需求
- Node.js (版本 18 或以上)
- Git
- Google 帳號

---

## 📝 步驟一：設定 Firebase 專案

### 1.1 創建 Firebase 專案
1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「建立專案」
3. 輸入專案名稱：`meta-analysis-calculator`
4. 選擇是否啟用 Google Analytics（建議啟用）
5. 完成專案建立

### 1.2 啟用必要服務
在 Firebase Console 中：

**啟用 Authentication：**
1. 左側選單 → Authentication → 開始使用
2. Sign-in method → Email/Password → 啟用
3. 設定 → 授權網域 → 新增您的域名

**啟用 Firestore：**
1. 左側選單 → Firestore Database → 建立資料庫
2. 選擇「以測試模式開始」（稍後會設定安全規則）
3. 選擇資料庫位置（建議選擇 asia-east1）

**啟用 Hosting：**
1. 左側選單 → Hosting → 開始使用

### 1.3 獲取 Firebase 配置
1. 專案設定 → 一般 → 您的應用程式
2. 選擇「網頁」圖示 → 註冊應用程式
3. 複製 Firebase 配置物件

---

## 💻 步驟二：本地開發設定

### 2.1 安裝 Firebase CLI
```bash
npm install -g firebase-tools
```

### 2.2 登入 Firebase
```bash
firebase login
```

### 2.3 初始化專案
在您的專案目錄中：

```bash
# 初始化 Firebase
firebase init

# 選擇以下服務：
# ◉ Firestore: Configure rules and indexes files
# ◉ Hosting: Configure files for Firebase Hosting
```

**Firestore 設定：**
- Rules file: `firestore.rules` (已存在)
- Indexes file: `firestore.indexes.json` (已存在)

**Hosting 設定：**
- Public directory: `.` (當前目錄)
- Single-page app: `No`
- GitHub deployment: `No`

### 2.4 更新 Firebase 配置
編輯 `firebase-config.js`，將配置替換為您的實際配置：

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

---

## 🚀 步驟三：部署

### 3.1 部署 Firestore 規則和索引
```bash
firebase deploy --only firestore
```

### 3.2 部署網站
```bash
firebase deploy --only hosting
```

### 3.3 完整部署
```bash
firebase deploy
```

部署完成後，您會看到：
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project
Hosting URL: https://your-project.web.app
```

---

## ⚙️ 步驟四：設定安全規則

### 4.1 Firestore 安全規則
`firestore.rules` 檔案已包含適當的安全規則：
- 用戶只能存取自己的資料
- 驗證註冊碼和訂閱狀態
- 防止未授權存取

### 4.2 部署安全規則
```bash
firebase deploy --only firestore:rules
```

---

## 🧪 步驟五：測試

### 5.1 本地測試
```bash
# 啟動本地模擬器
firebase emulators:start

# 訪問
# - 網站: http://localhost:5000
# - Emulator UI: http://localhost:4000
```

### 5.2 生產測試
1. 訪問您的 Hosting URL
2. 測試註冊功能（使用註冊碼：EBM2025）
3. 測試登入功能
4. 測試計算並儲存功能
5. 檢查 Firestore Console 確認資料已儲存

---

## 📊 步驟六：監控與維護

### 6.1 Firebase Console 監控
- **Authentication**：用戶註冊/登入統計
- **Firestore**：讀寫次數、儲存使用量
- **Hosting**：流量統計、頻寬使用

### 6.2 設定配額警報
1. Google Cloud Console → IAM 與管理 → 配額
2. 設定 Firestore 讀寫配額警報
3. 設定 Authentication 使用量警報

---

## 🔧 常見問題排解

### Q1: Firebase 配置載入失敗
**解決方案：**
```javascript
// 檢查 firebase-config.js 中的配置是否正確
console.log('Firebase config:', firebaseConfig);
```

### Q2: 認證失敗
**檢查項目：**
1. Firebase Console → Authentication → Sign-in method 是否啟用 Email/Password
2. 授權網域是否包含您的域名
3. 瀏覽器開發者工具查看錯誤訊息

### Q3: Firestore 權限被拒
**解決方案：**
1. 檢查 `firestore.rules` 是否正確部署
2. 確認用戶已正確認證
3. 檢查資料結構是否符合安全規則

### Q4: 部署失敗
**常見原因：**
```bash
# 1. 檢查 Firebase CLI 版本
firebase --version

# 2. 重新登入
firebase logout
firebase login

# 3. 檢查專案關聯
firebase projects:list
firebase use your-project-id
```

---

## 💰 成本估算

### Firebase 免費額度（Spark 方案）
- **Firestore**：每日 50,000 讀取、20,000 寫入
- **Authentication**：無限制
- **Hosting**：10GB 儲存、每月 10GB 傳輸

### 付費方案（Blaze 方案）
- **Firestore**：$0.06 / 100,000 讀取
- **Authentication**：免費
- **Hosting**：$0.026/GB 儲存

**預估使用量：**
- 100 個活躍用戶
- 每人每天 10 次計算
- 免費額度完全足夠！

---

## 🚀 進階功能

### 自動部署（GitHub Actions）
創建 `.github/workflows/firebase.yml`：

```yaml
name: Deploy to Firebase
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install -g firebase-tools
      - run: firebase deploy --token=${{ secrets.FIREBASE_TOKEN }}
```

### 自訂域名設定
1. Firebase Console → Hosting → 自訂網域
2. 新增網域並驗證
3. 更新 DNS 記錄

### 備份策略
```bash
# 匯出 Firestore 資料
gcloud firestore export gs://your-backup-bucket

# 設定自動備份（Cloud Scheduler）
```

---

## 📚 相關資源

- [Firebase 官方文檔](https://firebase.google.com/docs)
- [Firestore 安全規則指南](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase 價格計算器](https://firebase.google.com/pricing)
- [本專案 GitHub](https://github.com/keanu77/Meta-Analysis-Calculator)

---

## 🆘 支援

遇到問題？
1. 檢查本指南的故障排除部分
2. 查看 Firebase Console 的錯誤日誌
3. 在專案 GitHub 提交 Issue
4. Firebase 社群論壇尋求協助

**部署成功後，您的 Meta Analysis Calculator 將具備：**
- ✅ 安全的用戶認證
- ✅ 雲端資料同步
- ✅ 計算歷史儲存
- ✅ 即時資料更新
- ✅ 自動備份
- ✅ 全球 CDN 加速

🎉 恭喜！您的應用程式現在完全雲端化了！