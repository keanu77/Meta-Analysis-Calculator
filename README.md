# Meta-Analysis Calculator

統合分析的統計換算工具，附 RoB 2、GRADE 與統合分析概念的閱讀材料。

線上入口：[metacalc.sportsmedicine.tw](https://metacalc.sportsmedicine.tw/)。本機修改不會自動更新線上版本。

## 現有功能

- 單組換算：SE → SD、CI → Mean/SD、分位數估計、Pooled SD、Change Score SD。
- 兩組比較：MD、SMD（可選 Hedges 小樣本修正）、OR、RR、RD。
- CI/SE 互轉、公式說明及複製結果。
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

`npm run build` 僅將 `scripts/runtime-files.mjs` 列出的七個程式檔案及 `_headers`、`404.html` 兩個託管檔案複製到 `dist/`。**只發布 `dist/`**；禁止以專案根目錄作為靜態網站根目錄，以免包含內部文件、SQL、測試、設定或 Git 資料。

Firebase Hosting 和 Zeabur 設定都指向 `dist/`。Zeabur 使用 `zbpack.json` 的 `build_command` 和 `output_dir`；發布前執行 `npm test && npm run build`，不使用舊版 `zeabur.json` 的欄位。Firebase CLI 如有需要，另行安裝並以自己的帳號設定專案；不需要 `firebase-config.js` 或任何瀏覽器 API key。建置時會在 CSS/JS 網址加入內容雜湊版本，避開舊版長期快取；Firebase 設定和 Zeabur `_headers` 要求資源重新驗證快取。部署後應逐一比對七個程式檔案的 SHA-256、檢查實際回應標頭，並確認內部檔案路徑回傳 404；本文件不代表已部署。

## 使用限制

此工具用於教學與練習。分位數換算是方法相關的估計，請核對原文條件與資料分布後使用。CI/SE 換算採對稱的常態近似；選擇 log(OR)、log(RR) 或 log(HR) 時，效果量與 CI 必須已是自然對數尺度，工具不會自動替比值取對數。選擇不修正的 2×2 零格資料時，現有 OR/RR 對數公式不會產生完整有限結果，因此會提示確認分析方法。

本次工程檢查保留既有統計公式及教學內容，沒有重新認證全部方法學描述。正式研究、投稿或臨床判斷前，應以原始方法文獻與獨立統計軟體交叉核對。
