# ProofGuard · 醫療文宣 AI 審稿小幫手

光田綜合醫院行銷部內部工具｜純前端 + Google Gemini API（**完全免費**）

## 功能

- 🔍 **一鍵 AI 審稿**：上傳圖稿，自動辨識醫師名稱錯字、儀器商標誤植、違反醫療法規的用詞
- 📑 **版本比對**：核准版文案 vs. 美編圖稿 OCR，找出漏改、多字、不一致
- 🗂 **詞彙資料庫**：醫師名單 / 儀器療程 / 違禁詞，可批次 CSV 匯入匯出
- 📊 **審稿摘要卡**：可截圖傳 LINE 群組校稿
- 🕓 **歷史記錄**：自動保留最近 30 筆審稿結果

## 使用方式

1. 直接開啟 `index.html`（無需建置）
2. 進入「API 設定」貼上 Google Gemini API Key
3. 回到「上傳審稿」拖曳圖片即可

## 取得免費 API Key

1. 前往 [aistudio.google.com/apikey](https://aistudio.google.com/apikey)（Google 帳號登入）
2. 點 **Create API key** → 選一個專案
3. 複製 `AIza…` 開頭的 Key 貼上即可

**免費額度**：Gemini 2.5 Flash 每分鐘 15 次、每天 1,500 次，醫院內部用綽綽有餘。

## 技術

- 純 Vanilla JS / HTML / CSS（無打包工具）
- Google Gemini 2.5 Flash Vision API
- localStorage 儲存資料庫與歷史記錄
- 強制 JSON 輸出模式（`responseMimeType: application/json`）

## 部署

GitHub Pages：直接以 main 分支根目錄發布即可。
