/**
 * 光田行銷數位歸檔中心 — 公用設定
 *
 * 把你的 GAS Web App URL 貼到下方 gasUrl，所有開啟此網頁的瀏覽器
 * 都會自動連線到這個後端，不需要每台電腦個別設定。
 *
 * ⚠️ 因為 GitHub Pages 是公開網頁，這個 URL 會被任何訪客看到。
 *    這是「方便性 vs 安全性」的權衡 — 對內部醫院工具來說可接受。
 *    如果有資料被亂改的疑慮，請：Apps Script → Manage deployments
 *    → 建立新版本（URL 會更新），把新 URL 貼回這裡覆蓋即可。
 *
 * 使用者個人 localStorage 設定優先於這裡（用於臨時切換不同 Sheet 測試）。
 */
window.KTGH_CONFIG = {
  gasUrl: 'https://script.google.com/macros/s/AKfycbwBjhOE7O57CULbXoc0JJEVRYfhwTEgAxvBoUrNMuVp3f7hXkxjAD-J03EUHrRYXwfUvA/exec'
};
