# 光田設計資產庫 · AssetVault

光田綜合醫院行銷部數位歸檔系統｜純前端 + Google Sheets + Gemini AI

## 主要功能

### 📚 數位資產庫（主功能）
- **資產總覽**：縮圖卡片網格、即時搜尋、類別/年份篩選
- **新增資產**：拖曳上傳自動產生 webp 壓縮縮圖、完整 metadata 表單
- **年度回顧**：依年份 → 節慶/活動分組呈現產出時間軸
- **快速索引**：醫師形象照、空間照、門診表封面、海報、活動視覺、社群圖卡 6 大專屬面板
- **網路硬碟路徑**：一鍵複製到剪貼簿，直接貼到檔案總管網址列

### 🔍 AI 工具（輔助）
- **智能審稿**：圖片辨識 + 醫師名/儀器/違禁詞/法規用詞檢查
- **版本比對**：核准版文案 vs 美編 OCR 找差異

## 技術架構

| 元件 | 用途 |
|------|------|
| 純前端（HTML/CSS/Vanilla JS）| 介面、互動、縮圖壓縮 |
| Google Sheets + Apps Script | 資產資料儲存、永久備份、多人共用 |
| Google Gemini 2.5 Flash | AI 審稿（免費額度每天 1500 次）|
| localStorage | 詞彙資料庫、API Key、後端 URL 設定 |

## 快速開始

### 1. 部署 Google Sheets 後端（5 分鐘，一次性）
1. 開新 Google Sheet（標題例：「光田設計資產庫_2026」）
2. Extensions → Apps Script
3. 複製 `scripts/AssetVault.gs` 內容貼上，儲存
4. Deploy → New deployment → Web app
   - Execute as: **Me**
   - Who has access: **Anyone**
5. 授權，複製 Web app URL

### 2. 設定前端
1. 開啟 `index.html`（或 GitHub Pages 版）
2. 進入「後端連線」頁，貼上 Web app URL，測試連線
3. （選用）「Gemini API」頁設定 API Key 啟用 AI 審稿功能

### 3. 開始建檔
- 新增資產 → 拖曳圖片 → 填寫資訊 → 儲存

## 資料表結構

Google Sheets 自動建立 `assets` 工作表，欄位：

`id, title, category, year, date, festival, event, client, tags, drivePath, extLinks, designer, usage, notes, thumb, createdAt, updatedAt`

縮圖以 base64 webp 內嵌儲存（單筆約 30–50 KB）。

## 安全性說明

- Google Sheets URL 未公開即視為密碼，僅儲存於本機 localStorage
- 所有資料停留在你自己的 Google 帳號
- 縮圖經瀏覽器壓縮後才送出，原檔不離開電腦

## 部署

GitHub Pages：直接以 main 分支根目錄發布即可。
