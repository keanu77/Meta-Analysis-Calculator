# 資安與憑證管理

## 本專案的資料邊界

目前公開介面為瀏覽器內統計換算與閱讀材料，不需要 AI API Key，也沒有 Firebase 登入、Firestore 同步或公開後端。正式部署只應包含建置產生的 dist/。目前未開放的 RoB 編輯／圖表／PDF 模組原始碼不表示功能已可用，也不應為此載入外部腳本或改寫舊瀏覽器資料。

## Key 與部署

- 真實 Key、服務存取碼、worker credential 不進 Git、前端 bundle、URL、範例資料或錯誤日誌。範例設定只放變數名稱與明確占位文字。
- 記錄錯誤類別、受控狀態碼與可追蹤資訊即可；不要列印完整 SDK／HTTP 錯誤、headers、request body 或含查詢參數的上游 URL。
- 憑證由後端部署環境或 repo 外的私人環境檔提供。公開 repo 不代表要公開執行中的服務權限。
- 發現真實憑證外洩時，先在供應商撤銷／輪替並檢查使用紀錄，再處理 Git 歷史。單純刪除目前檔案無法清除歷史中的憑證。請勿在公開 Issue 貼入秘密原值。

## 自動檢查

`.github/workflows/security-secrets.yml` 在 push／PR 或手動觸發時掃描完整取得的 Git 歷史。Gitleaks 固定 v8.30.1，下載檔案比對固定 SHA-256；checkout action 釘定提交，只有 contents:read 權限。掃描輸出遮蔽命中內容，不上傳含秘密的完整報告。

本機安裝同版 Gitleaks 後，在 repo 根目錄執行：

```sh
gitleaks git --log-opts="--all --full-history" --ignore-gitleaks-allow --redact=100 --no-banner --no-color .
```

掃描通過只代表該次規則沒有發現尚未排除的秘密，不保證沒有未辨識的憑證或部署設定問題。例外需逐筆驗證；不得整批排除所有測試、環境設定或歷史提交。

## 發布驗證

2026-09-28 的資安修正加入發布檔案白名單與自動掃描。部署必須以實際線上檔案雜湊、內部路徑的 404 回應與快取標頭驗收；本文件不構成已完成部署的證明。本工具沒有 AI 供應商連線或正式 API Key，不需為使用計算機提供憑證。
