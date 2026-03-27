# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Meta Analysis Calculator — 醫學研究用的線上統合分析計算工具。支援效果值轉換（Cohen's d、Pearson r、Odds Ratio）、信賴區間計算、Risk of Bias 2.0 評估。

## Commands

```bash
# 本地開發（靜態站點，http-server）
npm run dev              # 啟動 http-server on port 8080 並開啟瀏覽器

# Firebase
npm run firebase:dev     # firebase serve（本地預覽）
npm run firebase:deploy  # firebase deploy（正式部署）
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
| `style.css` | 全站樣式 |

### 第三方函式庫（CDN + defer 載入）

Chart.js 4.4.8、jsPDF 2.5.1、html2canvas 1.4.1，皆透過 CDN 載入並設有 SRI hash。

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
- Firebase `public` 設為 `"."`（專案根目錄），firebase.json 的 ignore 列表控制排除項目
- JS/CSS 檔案有 1 年 Cache-Control header，改版後注意快取失效問題
