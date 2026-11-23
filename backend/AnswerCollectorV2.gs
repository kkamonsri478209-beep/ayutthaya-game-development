/**
 * เงินพดด้วง — Answer Collector v2 (test branch)
 * Deploy as Apps Script Web App (execute as owner, access anyone).
 * In Script Properties set SPREADSHEET_ID to the ID of the intended spreadsheet.
 * Does not replace any existing sheet or erase any data.
 */
const ANSWERS_TAB = 'คำตอบนักเรียน_v2';
const HEADERS = ['receivedAt','answerId','sessionId','playerId','displayName','gender','stage','questionId','question','answer','score','maxScore','type'];
function jsonReply(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
function doGet() { return jsonReply({ok:true,service:'ngoen-pod-duang-answer-collector-v2'}); }
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    let data = Object.assign({}, e && e.parameter || {});
    const raw = e && e.postData && e.postData.contents;
    if (raw && /^\s*\{/.test(raw)) {
      try { data = Object.assign(data, JSON.parse(raw)); } catch (_) { return jsonReply({ok:false,error:'Invalid JSON'}); }
    }
    const answerId = String(data.answerId || '').trim();
    const stage = Number(data.stage);
    const answer = String(data.answer == null ? '' : data.answer).trim();
    const questionId = String(data.questionId || '').trim();
    if (!answerId || answerId.length > 120 || !Number.isInteger(stage) || stage < 1 || stage > 5 ||
        !questionId || questionId.length > 120 || !answer || answer.length > 5000) {
      return jsonReply({ok:false,error:'Invalid answer data'});
    }
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (!spreadsheetId) return jsonReply({ok:false,error:'SPREADSHEET_ID is not configured'});
    if (!lock.tryLock(20000)) return jsonReply({ok:false,error:'Busy; retry later'});
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(ANSWERS_TAB) || spreadsheet.insertSheet(ANSWERS_TAB);
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
    const last = sheet.getLastRow();
    if (last > 1) {
      const ids = sheet.getRange(2,2,last-1,1).getValues();
      if (ids.some(row => String(row[0]) === answerId)) return jsonReply({ok:true,duplicate:true});
    }
    // Prefix formula-like values so student text is stored literally in Sheets.
    const safe = value => { const s=String(value == null ? '' : value); return /^[=+\-@]/.test(s) ? "'"+s : s; };
    sheet.appendRow([
      new Date(),safe(answerId),safe(data.sessionId),safe(data.playerId),
      safe(data.displayName || data.playerName),safe(data.gender),stage,
      safe(questionId),safe(data.question),safe(answer),
      data.score === undefined ? '' : Number(data.score),
      data.maxScore === undefined ? '' : Number(data.maxScore),
      safe(data.type || 'written')
    ]);
    SpreadsheetApp.flush();
    return jsonReply({ok:true,stored:true});
  } catch (err) {
    console.error(err);
    return jsonReply({ok:false,error:'Server storage error'});
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}
