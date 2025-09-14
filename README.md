# Meta Analysis Calculator 統合分析計算器 🔥

> 系統性文獻回顧／統合分析一站式換算工具 - Firebase 雲端版

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-0.2.0--firebase-blue.svg)](https://github.com/keanu77/Meta-Analysis-Calculator)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)

## 🚀 專案概述

Meta Analysis Calculator 是一個專為醫學研究、教育研究、體育科學等領域設計的線上統合分析計算工具。現已全面升級到 Firebase 雲端平台，提供更穩定、更安全的服務。

### ✨ 主要功能

- **📊 效果值轉換**：支援 Cohen's d、Pearson r、Odds Ratio 等多種效果值相互轉換
- **📈 信賴區間計算**：提供精確的信賴區間估算
- **👥 樣本大小估算**：協助研究設計階段的樣本大小規劃
- **⚡ 統計檢驗力分析**：計算統計檢驗力和效應大小
- **☁️ 雲端數據同步**：自動儲存計算歷史，支援多設備同步
- **📱 即時資料更新**：Firestore 即時同步技術
- **🔒 安全認證系統**：Firebase Authentication 保護用戶資料
- **📄 PDF 報告匯出**：一鍵匯出專業格式的分析報告

## 🛠️ 技術架構

### 前端技術
- **原生 JavaScript** - 純前端實現，無框架依賴
- **ES6 Modules** - 現代化模組系統
- **Chart.js** - 資料視覺化圖表
- **jsPDF** - PDF 報告生成
- **Responsive Design** - 支援桌面和行動裝置

### 雲端服務 (Firebase)
- **🔥 Firebase Authentication** - 安全的用戶認證系統
- **🗄️ Cloud Firestore** - NoSQL 即時資料庫
- **🌐 Firebase Hosting** - 全球 CDN 託管服務
- **🛡️ Security Rules** - 資料安全保護規則
- **📊 Analytics** - 用戶行為分析（可選）

### 部署平台
- **Firebase Hosting** - 自動 HTTPS + 全球 CDN
- **GitHub Actions** - 持續整合/部署（可選）

## 📦 快速開始

### 🌐 線上使用
直接訪問：[https://your-project.web.app](https://your-project.web.app)

### 💻 本地開發

#### 1. 克隆專案
```bash
git clone https://github.com/keanu77/Meta-Analysis-Calculator.git
cd Meta-Analysis-Calculator
```

#### 2. 安裝 Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

#### 3. 設定 Firebase 專案
```bash
# 初始化 Firebase（如果尚未初始化）
firebase init

# 啟動本地模擬器
firebase emulators:start
```

#### 4. 更新配置
編輯 `firebase-config.js`，填入您的 Firebase 配置。

#### 5. 本地測試
```bash
# 啟動本地伺服器
firebase serve

# 或使用模擬器（推薦）
firebase emulators:start
```

## 🔧 Firebase 設定

### 必要的 Firebase 服務
```bash
# 啟用的服務
✅ Authentication (Email/Password)
✅ Firestore Database
✅ Hosting
```

### 環境配置
```javascript
// firebase-config.js
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## 📊 功能模組

### 1. 🔢 效果值轉換模組
- Cohen's d ↔ Pearson r
- Odds Ratio ↔ Cohen's d
- Risk Ratio ↔ Cohen's d
- 標準化平均差異轉換

### 2. 📈 信賴區間計算模組
- 平均數信賴區間
- 比例信賴區間
- 效果值信賴區間
- 風險比信賴區間

### 3. 👥 樣本大小計算模組
- 雙樣本 t 檢驗樣本大小
- 單樣本 t 檢驗樣本大小
- 比例檢驗樣本大小
- 相關分析樣本大小

### 4. ⚡ 統計檢驗力分析模組
- 檢驗力計算
- 效應大小估算
- α 錯誤率分析
- β 錯誤率分析

## 👤 用戶功能

### 🔐 認證系統
- Firebase Authentication 安全登入
- 邀請碼註冊制（EBM2025, META2025, RESEARCH2025, ADMIN123）
- 自動密碼加密與安全管理
- 多設備同步登入狀態

### 💾 數據管理
- **☁️ 自動雲端儲存**：計算結果即時同步
- **⭐ 收藏功能**：標記重要計算結果
- **📁 資料夾分類**：自定義分類管理
- **🔍 搜尋功能**：快速找到歷史記錄
- **📊 使用統計**：個人使用數據分析

### ⚙️ 個人設定
- 自定義小數點位數
- 多語言支援（繁中、簡中、英文）
- 主題設定（亮色、暗色、自動）
- 自動儲存偏好設定

## 🔒 安全性

- **🔐 Firebase Auth**：Google 級別的認證安全
- **🛡️ Security Rules**：Firestore 安全規則保護
- **🌐 HTTPS**：全站 HTTPS 加密傳輸
- **🔒 資料隔離**：用戶資料完全隔離
- **⚡ 即時監控**：異常活動自動檢測

## 📚 資料結構

### Firestore 集合架構
```
/users/{userId} - 用戶基本資料
├── /calculations/{calcId} - 計算記錄
├── /folders/{folderId} - 資料夾
└── settings - 個人設定

/statistics/users/{userId} - 使用統計
```

詳細資料結構請參考：[firebase-structure.md](./firebase-structure.md)

## 🚀 部署指南

### 🔥 方案一：Firebase Hosting（推薦）
```bash
# 1. 安裝 Firebase CLI
npm install -g firebase-tools

# 2. 建立 Firebase 專案
firebase init

# 3. 部署到 Firebase
firebase deploy

# 4. 設定自訂域名（可選）
# Firebase Console → Hosting → 自訂網域
```

詳細步驟請參考：[FIREBASE-DEPLOYMENT.md](./FIREBASE-DEPLOYMENT.md)

### 🚢 方案二：Zeabur 靜態部署
```bash
# 1. 連接 GitHub 到 Zeabur
# 2. 選擇此倉庫
# 3. 自動部署完成！
```

**Zeabur 部署注意事項：**
- 僅作為靜態網站託管
- 不包含 Firebase 後端功能
- 適合純前端展示用途

## 📊 成本分析

### Firebase 免費方案足夠大部分使用場景：
- **Firestore**：每日 50,000 讀取、20,000 寫入
- **Authentication**：無限制用戶
- **Hosting**：10GB 儲存 + 10GB/月 流量

### 預估使用量：
- 🏥 **醫學研究團隊**：20-50 用戶 → 完全免費
- 🎓 **教育機構**：100+ 用戶 → 低成本運營
- 🏃 **運動科學實驗室**：10-30 用戶 → 完全免費

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

### 開發流程
1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 設定 Firebase 本地模擬器
4. 開發並測試
5. 提交更改 (`git commit -m 'Add amazing feature'`)
6. 推送到分支 (`git push origin feature/amazing-feature`)
7. 建立 Pull Request

### 本地開發設定
```bash
# 安裝依賴
npm install -g firebase-tools

# 啟動模擬器
firebase emulators:start

# 訪問
# 網站: http://localhost:5000
# Firestore: http://localhost:4000
```

## 📊 使用統計

- 🏥 **醫學研究**：Meta分析、系統性回顧
- 🎓 **教育研究**：學習效果分析、教學方法比較
- 🏃 **運動科學**：訓練效果評估、運動介入研究
- 📊 **統計教學**：實務操作、概念學習

## 🏆 專案特色

### 🔥 Firebase 優勢
- ⚡ **零後端維護**：無需管理伺服器
- 🌍 **全球CDN**：快速載入體驗
- 🔐 **企業級安全**：Google 安全標準
- 📱 **即時同步**：多設備無縫體驗
- 💰 **成本效益**：免費額度慷慨

### 📊 專業功能
- 🎯 **精確計算**：符合學術標準
- 📈 **視覺化圖表**：直觀結果展示
- 📄 **PDF 匯出**：專業報告格式
- 🔍 **智慧搜尋**：快速找到歷史記錄
- 📊 **使用分析**：個人統計追蹤

## 📄 授權條款

此專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案

## 👨‍⚕️ 作者

**運動醫學科吳易澄醫師**
- 🌐 個人網站：[https://wycswimming.blogspot.com/](https://wycswimming.blogspot.com/)
- 🐙 GitHub：[@keanu77](https://github.com/keanu77)
- 📧 專案支援：透過 GitHub Issues

## 🙏 致謝

- 🔥 **Google Firebase** - 提供優秀的雲端平台
- 📊 **Chart.js** - 強大的圖表庫
- 🧮 **統計學社群** - 提供專業指導
- 👨‍💻 **開源社群** - 持續的支持與貢獻
- 🎓 **學術研究者** - 寶貴的使用反饋

## 🔗 相關連結

- 📖 [Firebase 官方文檔](https://firebase.google.com/docs)
- 📊 [統計方法參考](https://www.cochrane.org/)
- 🎓 [Meta分析指南](https://training.cochrane.org/handbook)
- 💬 [項目討論區](https://github.com/keanu77/Meta-Analysis-Calculator/discussions)

---

<div align="center">

⭐ **如果這個專案對您有幫助，請給我們一個 Star！** ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=keanu77/Meta-Analysis-Calculator&type=Date)](https://github.com/keanu77/Meta-Analysis-Calculator)

**🔥 現在就開始使用雲端版 Meta Analysis Calculator！**

[🚀 立即使用](https://your-project.web.app) | [📖 部署指南](./FIREBASE-DEPLOYMENT.md) | [🐛 回報問題](https://github.com/keanu77/Meta-Analysis-Calculator/issues)

</div>