/**
 * 설문 응답 수신용 Apps Script (구글 시트에 연결된 스크립트)
 * - responses   : 참가자 1명당 1행 (넓은 형식) – SPSS/엑셀용
 * - scenes_long : 참가자 × 장면 1행 (긴 형식) – 반복측정 ANOVA / LMM용
 * 새 문항이 생기면 열이 자동으로 추가됩니다.
 */
var WIDE_SHEET = 'responses';
var LONG_SHEET = 'scenes_long';

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var payload = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var wide = payload.wide || {};
    wide.received_at = new Date().toISOString();
    appendRow_(ss, WIDE_SHEET, wide);
    (payload.long || []).forEach(function (r) { appendRow_(ss, LONG_SHEET, r); });
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ ok: true, message: '설문 응답 수신 중' });
}

function appendRow_(ss, name, obj) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  var lastCol = sh.getLastColumn();
  var headers = lastCol ? sh.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  var added = Object.keys(obj).filter(function (k) { return headers.indexOf(k) === -1; });
  if (added.length) {
    headers = headers.concat(added);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  var row = headers.map(function (h) {
    var v = obj[h];
    if (v === undefined || v === null) return '';
    return typeof v === 'object' ? JSON.stringify(v) : v;
  });
  sh.appendRow(row);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
