# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Meta Analysis Calculator — 醫學研究用的線上統合分析計算工具。支援效果值轉換（Cohen's d、Pearson r、Odds Ratio）、信賴區間計算、Risk of Bias 2.0 評估。

## Commands

```bash
# 本地開發（靜態站點，http-server）
npm run dev          # 啟動 http-server on port 8080 並開啟瀏覽器

# Firebase 部署
npm run firebase:deploy  # firebase deploy
```

無 build step、無 lint、無測試框架。`npm run build` 只是 echo。

## Architecture

### 前端（純靜態，無框架，模組化拆分）

| 檔案 | 內容 |
|------|------|
| `index.html` | 整個 UI，所有模組的 tab |
| `calculator-core.js` | 初始化、tab 管理、事件處理、統計工具函式 |
| `modules/module-a.js` | 單組內統計轉換（SE↔SD, CI→Mean/SD, 分位數法） |
| `modules/module-b.js` | 兩組比較效果量（MD, SMD, OR, RR, RD） |
| `modules/module-c.js` | CI/SE 互轉 |
| `formula-display.js` | 公式顯示 modal |
| `rob-assessment.js` | Risk of Bias 2.0 評估系統（RoBAssessment class） |
| `chart-utils.js` | RoB 圖表生成（Traffic Light, Weighted Bar, Summary） |
| `pdf-export.js` | PDF 匯出 |
| `auth-hybrid.js` | 認證系統（PBKDF2 密碼雜湊、SHA-256 註冊碼驗證） |
| `profile-modal.js` | 用戶個人資料彈窗 |
| `subscription.js` | 訂閱方案邏輯 |
| `style.css` | 全站樣式 |

### 認證系統

`auth-hybrid.js` 使用 localStorage 儲存用戶資料，密碼以 PBKDF2 雜湊，註冊碼以 SHA-256 hash 比對（不暴露明碼）。

### 第三方函式庫（動態載入）

Chart.js、jsPDF、html2canvas 不在頁面載入時下載，而是在使用者第一次需要時由 `window.loadChartJS()` / `window.loadJsPDF()` / `window.loadHtml2Canvas()` 動態載入。

## Key Patterns

- 所有 JS 檔案使用 `<script defer>` 載入，共享全域 scope（非 ES6 modules）
- 載入順序重要：calculator-core.js → modules → formula → rob → chart → pdf
- `calculator-core.js` 定義共用工具函式（escapeHTML, displayResult, showError, getCriticalValueZ 等）
- 所有 UI 狀態管理在前端 DOM 操作
- Tab 系統使用 ARIA 屬性 + 鍵盤導航（左右方向鍵）
- 使用者輸入經 `escapeHTML()` 消毒後才插入 innerHTML

## Deployment

- **Firebase Hosting**：主要部署方式，`firebase deploy`
- **Zeabur**：靜態部署備選，設定在 `zeabur.json`（type: static）
