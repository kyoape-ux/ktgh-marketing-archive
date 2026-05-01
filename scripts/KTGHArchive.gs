/**
 * 光田行銷數位歸檔中心 · KTGH Marketing Digital Archive — GAS Backend
 *
 * 部署步驟（一次性，約 5 分鐘）：
 *   1. 開新 Google Sheet（標題例：「光田行銷數位歸檔中心_2026」）
 *   2. Extensions → Apps Script，把這份內容整份貼上、儲存
 *   3. Deploy → New deployment → 齒輪 ⚙ 選 Web app
 *      Execute as: Me（用你自己的帳號執行）
 *      Who has access: Anyone（不會公開資料，只是允許網頁呼叫）
 *   4. 點 Deploy，授權 Google 帳號（首次會跳警告，點 Advanced → Go to ...(unsafe)→ Allow）
 *   5. 複製 Web app URL（網址會像 https://script.google.com/macros/s/AKfycb.../exec）
 *   6. 貼到本系統「後端連線」設定，按測試連線即可
 *
 * 之後修改腳本要重新 Deploy → Manage deployments → 鉛筆圖示 → New version → Deploy
 *
 * 兩個工作表：
 *   - assets    （數位資產庫；圖檔縮圖 + 網路硬碟路徑）
 *   - templates （範本中心；空白表單 Google Drive 連結）
 */

const ASSETS_SHEET = 'assets';
const ASSETS_COLS = ['id','title','category','year','date','festival','event','client','tags',
                     'drivePath','extLinks','designer','usage','notes','thumb','createdAt','updatedAt'];

const TPL_SHEET = 'templates';
const TPL_COLS = ['id','name','category','description','driveLink','fileType',
                  'maintainer','lastUpdated','usage','createdAt','updatedAt'];

const PRJ_SHEET = 'projects';
const PRJ_COLS = ['id','name','type','year','dateStart','dateEnd','status',
                  'locations','totalBudget','actualCost','description','items',
                  'attachments','coverIdx',
                  'photo1','photo2','photo3','photo4',  // 舊欄位保留供向後相容
                  'linkedAssets','notes','maintainer','createdAt','updatedAt'];

const ATTACHMENT_FOLDER = '光田行銷數位歸檔中心_附件';

function doPost(e) {
  let response;
  try {
    const body = JSON.parse(e.postData.contents);
    const entity = body.entity || 'asset';  // 'asset' | 'template' | 'project'
    let data;
    const dispatch = {
      asset:    { list: listAssets,    add: addAsset,    update: updateAsset,    del: deleteAsset },
      template: { list: listTemplates, add: addTemplate, update: updateTemplate, del: deleteTemplate },
      project:  { list: listProjects,  add: addProject,  update: updateProject,  del: deleteProject }
    };
    const op = dispatch[entity];
    if (!op) throw new Error('Unknown entity: ' + entity);
    switch (body.action) {
      case 'ping':       data = ping(); break;
      case 'list':       data = op.list(); break;
      case 'add':        data = op.add(body.data || {}); break;
      case 'update':     data = op.update(body.id, body.data || {}); break;
      case 'delete':     data = op.del(body.id); break;
      case 'bulkAdd':    data = bulkAddAssets(body.data || []); break;
      case 'uploadFile': data = uploadFile(body.data || {}); break;
      case 'deleteFile': data = deleteDriveFile(body.id); break;
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
    msg: 'KTGH Marketing Digital Archive API is alive. Use POST.',
    assetCount: countAssets(),
    templateCount: countTemplates(),
    sheet: SpreadsheetApp.getActiveSpreadsheet().getName()
  })).setMimeType(ContentService.MimeType.JSON);
}

function ping() {
  return {
    msg: 'KTGH Archive API ready',
    sheet: SpreadsheetApp.getActiveSpreadsheet().getName(),
    count: countAssets(),
    templateCount: countTemplates(),
    projectCount: countProjects(),
    time: new Date().toISOString()
  };
}

// ─── Helpers ───
function getOrCreateSheet(name, cols) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, cols.length).setValues([cols])
      .setFontWeight('bold').setBackground('#1E1B4B').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function listFromSheet(sheet, cols) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const data = sheet.getRange(1, 1, lastRow, cols.length).getValues();
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] === '' ? '' : row[i]; });
    return obj;
  });
}

function appendToSheet(sheet, cols, data) {
  data.id = data.id || Utilities.getUuid();
  const now = new Date().toISOString();
  data.createdAt = now;
  data.updatedAt = now;
  const row = cols.map(c => data[c] != null ? data[c] : '');
  sheet.appendRow(row);
  return data;
}

function updateInSheet(sheet, cols, id, updates) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('資料庫為空');
  const data = sheet.getRange(1, 1, lastRow, cols.length).getValues();
  const idCol = data[0].indexOf('id');
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      const obj = {};
      data[0].forEach((h, j) => { obj[h] = data[i][j]; });
      Object.assign(obj, updates);
      obj.updatedAt = new Date().toISOString();
      const newRow = cols.map(c => obj[c] != null ? obj[c] : '');
      sheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
      return obj;
    }
  }
  throw new Error('找不到該筆資料：' + id);
}

function deleteFromSheet(sheet, cols, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('資料庫為空');
  const data = sheet.getRange(1, 1, lastRow, cols.length).getValues();
  const idCol = data[0].indexOf('id');
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      sheet.deleteRow(i + 1);
      return { id, deleted: true };
    }
  }
  throw new Error('找不到該筆資料：' + id);
}

// ─── Assets ───
function getAssetsSheet() { return getOrCreateSheet(ASSETS_SHEET, ASSETS_COLS); }
function countAssets() { return Math.max(0, getAssetsSheet().getLastRow() - 1); }
function listAssets() { return listFromSheet(getAssetsSheet(), ASSETS_COLS); }
function addAsset(data) { return appendToSheet(getAssetsSheet(), ASSETS_COLS, data); }
function updateAsset(id, updates) { return updateInSheet(getAssetsSheet(), ASSETS_COLS, id, updates); }
function deleteAsset(id) { return deleteFromSheet(getAssetsSheet(), ASSETS_COLS, id); }

function bulkAddAssets(items) {
  if (!Array.isArray(items) || !items.length) return { added: 0 };
  const sheet = getAssetsSheet();
  const now = new Date().toISOString();
  const rows = items.map(d => {
    d.id = d.id || Utilities.getUuid();
    d.createdAt = d.createdAt || now;
    d.updatedAt = now;
    return ASSETS_COLS.map(c => d[c] != null ? d[c] : '');
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, ASSETS_COLS.length).setValues(rows);
  return { added: rows.length };
}

// ─── Templates ───
function getTemplatesSheet() { return getOrCreateSheet(TPL_SHEET, TPL_COLS); }
function countTemplates() { return Math.max(0, getTemplatesSheet().getLastRow() - 1); }
function listTemplates() { return listFromSheet(getTemplatesSheet(), TPL_COLS); }
function addTemplate(data) { return appendToSheet(getTemplatesSheet(), TPL_COLS, data); }
function updateTemplate(id, updates) { return updateInSheet(getTemplatesSheet(), TPL_COLS, id, updates); }
function deleteTemplate(id) { return deleteFromSheet(getTemplatesSheet(), TPL_COLS, id); }

// ─── Projects ───
function getProjectsSheet() { return getOrCreateSheet(PRJ_SHEET, PRJ_COLS); }
function countProjects() { return Math.max(0, getProjectsSheet().getLastRow() - 1); }
function listProjects() { return listFromSheet(getProjectsSheet(), PRJ_COLS); }
function addProject(data) { return appendToSheet(getProjectsSheet(), PRJ_COLS, data); }
function updateProject(id, updates) { return updateInSheet(getProjectsSheet(), PRJ_COLS, id, updates); }
function deleteProject(id) { return deleteFromSheet(getProjectsSheet(), PRJ_COLS, id); }

// ─── Drive File Upload ───
function getOrCreateAttachmentFolder() {
  const folders = DriveApp.getFoldersByName(ATTACHMENT_FOLDER);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(ATTACHMENT_FOLDER);
}

function uploadFile(payload) {
  const { name, mimeType, base64 } = payload;
  if (!name || !base64) throw new Error('缺少必要欄位 name / base64');
  const decoded = Utilities.base64Decode(base64);
  const blob = Utilities.newBlob(decoded, mimeType || 'application/octet-stream', name);
  const folder = getOrCreateAttachmentFolder();
  const file = folder.createFile(blob);
  // 設為「知道連結即可檢視」，這樣前端 <img> 才能載入縮圖
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) { /* 部分 Workspace 限制，忽略 */ }
  const id = file.getId();
  return {
    id,
    name: file.getName(),
    mimeType: file.getMimeType(),
    size: file.getSize(),
    url: 'https://drive.google.com/file/d/' + id + '/view',
    thumbUrl: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w480',
    downloadUrl: 'https://drive.google.com/uc?export=download&id=' + id
  };
}

function deleteDriveFile(id) {
  if (!id) throw new Error('缺少 file id');
  try {
    const file = DriveApp.getFileById(id);
    file.setTrashed(true);
    return { id, deleted: true };
  } catch (e) {
    return { id, error: e.message };
  }
}
