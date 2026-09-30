# Meta-Analysis Calculator

統合分析的統計換算工具，附 RoB 2、GRADE 與統合分析概念的閱讀材料。

線上入口：[metacalc.sportsmedicine.tw](https://metacalc.sportsmedicine.tw/)。本機修改不會自動更新線上版本。

## 現有功能

- 單組換算：SE → SD、CI → Mean/SD、中位數／四分位數／範圍 → Mean/SD（Luo 2018、Wan 2014、Shi 2020、Hozo 2005）、Pooled SD、Change Score SD。
- 兩組比較：MD、SMD（可選 Hedges 小樣本修正）、OR、RR、RD。
- 效果量 CI/SE 互轉（OR/RR/HR 可直接輸入原始比值）、公式說明及複製結果。
- RoB 2、GRADE 與統合分析的靜態教學材料。

目前沒有登入、雲端同步、Firebase Authentication、Firestore、AI API、樣本數規劃或統計檢定力計算。RoB/GRADE 頁籤是閱讀材料，沒有互動評讀、圖表或 PDF 匯出介面。歷史 `rob-assessment.js`、`chart-utils.js`、`pdf-export.js` 保留在原始碼中，但不載入、不納入網站發布檔案；重新啟用前需要另行審查。

## 資料與 API key

計算在瀏覽器記憶體中完成，重新整理後輸入與結果消失。不需要 API key、帳號或後端；計算值不會傳送到伺服器，也不會寫入 localStorage。新版本不會讀取、更動或刪除舊版瀏覽器的 `rob-studies` 資料。

頁面仍會向 Google Fonts 與 cdnjs 請求字型和圖示樣式；這些服務會收到一般 HTTP 請求資訊，但計算輸入不會附在請求中。圖示樣式固定版本並有完整性校驗。託管平台可能保留一般網站存取紀錄。

## 本機執行與驗證

使用 Node.js 22 以上，不需要安裝執行時套件：

```sh
npm run dev
# 開啟 http://127.0.0.1:8080

npm test
npm run build
npm start -- --port=4431
```

測試涵蓋已知數值範例、非法輸入及發布檔案白名單。這些是程式與數值回歸驗證，並非所有估計方法、公式或醫療判斷的獨立方法學認證。

## 發布

`npm run build` 僅將 `scripts/runtime-files.mjs` 列出的九個程式檔案及 `_headers`、`404.html` 兩個託管檔案複製到 `dist/`。**只發布 `dist/`**；禁止以專案根目錄作為靜態網站根目錄，以免包含內部文件、SQL、測試、設定或 Git 資料。

Firebase Hosting 和 Zeabur 設定都指向 `dist/`。Zeabur 使用 `zbpack.json` 的 `build_command` 和 `output_dir`；發布前執行 `npm test && npm run build`，不使用舊版 `zeabur.json` 的欄位。Firebase CLI 如有需要，另行安裝並以自己的帳號設定專案；不需要 `firebase-config.js` 或任何瀏覽器 API key。建置時會在 CSS/JS 網址加入內容雜湊版本，避開舊版長期快取；Firebase 設定和 Zeabur `_headers` 要求資源重新驗證快取。部署後應逐一比對九個程式檔案的 SHA-256、檢查實際回應標頭，並確認內部檔案路徑回傳 404；本文件不代表已部署。

## 使用限制

此工具用於教學與練習。

- 分位數換算依填入欄位自動判斷 Wan 2014 的 S1／S2／S3 情境，公式與 R 套件 `meta` 的 `mean_sd_*` 內部函式一致（測試以其輸出為參考值）。所有方法都假設資料近似常態，偏態資料請另行評估。
- CI/SE 換算採對稱的常態近似。OR/RR/HR 選原始比值時自動取自然對數；選 ln(OR) 等選項時輸入值須已是對數尺度。
- 2×2 表的 Haldane-Anscombe 修正只用於 OR/RR，RD 一律使用原始計數；兩組皆無事件時 OR/RR 顯示無法估計。
- 臨界值與 p 值使用精確的常態／t 分位數，不再查表內插。

2026-09-30 多模型審查（`.claude/audit/redteam-2026-09-30-report.md`，本機紀錄）修正了分位數公式錯誤；教學頁籤的概念文字未在該次審查範圍內。正式研究、投稿或臨床判斷前，仍應以原始方法文獻與獨立統計軟體交叉核對。

