/**
 * AssetVault GAS Backend  —  光田綜合醫院行銷部數位歸檔系統
 *
 * 部署步驟（一次性，約 5 分鐘）：
 *   1. 開新 Google Sheet（標題例：「光田設計資產庫_2026」）
 *   2. Extensions → Apps Script，把這份內容整份貼上、儲存
 *   3. Deploy → New deployment → 齒輪 ⚙ 選 Web app
 *      Execute as: Me（用你自己的帳號執行）
 *      Who has access: Anyone（不會公開資料，只是允許網頁呼叫）
 *   4. 點 Deploy，授權 Google 帳號（首次會跳警告，點 Advanced → Go to ...(unsafe)→ Allow）
 *   5. 複製 Web app URL（網址會像 https://script.google.com/macros/s/AKfycb.../exec）
 *   6. 貼到 AssetVault 網站「後端連線」設定，按測試連線即可
 *
 * 之後修改腳本要重新 Deploy → Manage deployments → 鉛筆圖示 → New version → Deploy
 */

const SHEET_NAME = 'assets';
const COLS = ['id','title','category','year','date','festival','event','client','tags',
              'drivePath','extLinks','designer','usage','notes','thumb','createdAt','updatedAt'];

function doPost(e) {
  let response;
  try {
    const body = JSON.parse(e.postData.contents);
    let data;
    switch (body.action) {
      case 'ping':   data = ping(); break;
      case 'list':   data = listAssets(); break;
      case 'add':    data = addAsset(body.data || {}); break;
      case 'update': data = updateAsset(body.id, body.data || {}); break;
      case 'delete': data = deleteAsset(body.id); break;
      case 'bulkAdd':data = bulkAddAssets(body.data || []); break;
      default: throw new Error('Unknown action: ' + body.action);
    }
    response = { ok: true, data };
  } catch (err) {
    response = { ok: false, error: String(err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({
    ok: true,
    msg: 'AssetVault API is alive. Use POST.',
    count: countAssets(),
    sheet: SpreadsheetApp.getActiveSpreadsheet().getName()
  })).setMimeType(ContentService.MimeType.JSON);
}

function ping() {
  return {
    msg: 'AssetVault API ready',
    sheet: SpreadsheetApp.getActiveSpreadsheet().getName(),
    count: countAssets(),
    time: new Date().toISOString()
  };
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, COLS.length).setValues([COLS])
      .setFontWeight('bold').setBackground('#1E1B4B').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function countAssets() {
  return Math.max(0, getSheet().getLastRow() - 1);
}

function listAssets() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const data = sheet.getRange(1, 1, lastRow, COLS.length).getValues();
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] === '' ? '' : row[i]; });
    return obj;
  });
}

function addAsset(data) {
  const sheet = getSheet();
  data.id = data.id || Utilities.getUuid();
  const now = new Date().toISOString();
  data.createdAt = now;
  data.updatedAt = now;
  const row = COLS.map(c => data[c] != null ? data[c] : '');
  sheet.appendRow(row);
  return data;
}

function bulkAddAssets(items) {
  if (!Array.isArray(items) || !items.length) return [];
  const sheet = getSheet();
  const now = new Date().toISOString();
  const rows = items.map(d => {
    d.id = d.id || Utilities.getUuid();
    d.createdAt = d.createdAt || now;
    d.updatedAt = now;
    return COLS.map(c => d[c] != null ? d[c] : '');
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, COLS.length).setValues(rows);
  return { added: rows.length };
}

function updateAsset(id, updates) {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('資料庫為空');
  const data = sheet.getRange(1, 1, lastRow, COLS.length).getValues();
  const idCol = data[0].indexOf('id');
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      const obj = {};
      data[0].forEach((h, j) => { obj[h] = data[i][j]; });
      Object.assign(obj, updates);
      obj.updatedAt = new Date().toISOString();
      const newRow = COLS.map(c => obj[c] != null ? obj[c] : '');
      sheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
      return obj;
    }
  }
  throw new Error('找不到該筆資產：' + id);
}

function deleteAsset(id) {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('資料庫為空');
  const data = sheet.getRange(1, 1, lastRow, COLS.length).getValues();
  const idCol = data[0].indexOf('id');
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      sheet.deleteRow(i + 1);
      return { id, deleted: true };
    }
  }
  throw new Error('找不到該筆資產：' + id);
}
