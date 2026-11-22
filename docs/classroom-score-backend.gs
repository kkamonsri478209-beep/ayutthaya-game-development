/**
 * เงินพดด้วง — Classroom score backend (deployment template)
 * Deploy as a separate Apps Script Web App bound to the existing spreadsheet.
 * IMPORTANT: do not replace the existing Code.gs without merging its written-answer handler.
 * Before deployment, review student privacy, access permissions and abuse protection.
 * This endpoint is not a secure assessment platform: browser clients can forge scores.
 */
const SCORE_SHEET_NAME = 'คะแนนเกมรายด่าน';
const SCORE_HEADERS = ['รหัสรอบการเล่น','รหัสผู้เล่น','ชื่อที่ใช้ในเกม','เพศตัวละคร','วันเวลาบันทึก','ด่าน 1 / 3','ด่าน 2 / 3','ด่าน 3 / 3','ด่าน 4 / 3','ด่าน 5 / 4','คะแนนรวม / 16','จำนวนคำถามพิมพ์ตอบ','สถานะการรับข้อมูล','หมายเหตุ'];
function scoreSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SCORE_SHEET_NAME);
  if (!sheet) throw new Error('Missing score sheet');
  return sheet;
}
function doPost(e) {
  try {
    const p = JSON.parse((e.postData && e.postData.contents) || '{}');
    if (p.action !== 'saveScore') return json_({ok:false,error:'Unknown action'});
    const room = String(p.room||'').trim().toUpperCase();
    const player = String(p.playerId||'').trim();
    const name = String(p.displayName||'').trim();
    const attempt = String(p.attemptId||'').trim();
    const stages = p.stages;
    if (!/^[A-Z0-9_-]{3,24}$/.test(room) || !/^[A-Za-z0-9_-]{1,60}$/.test(player) ||
        !name || name.length>100 || !/^[A-Za-z0-9_-]{8,80}$/.test(attempt) ||
        !Array.isArray(stages) || stages.length!==5) return json_({ok:false,error:'Invalid payload'});
    const points = stages.map(x=>Number(x));
    const limits = [3,3,3,3,4]; // MUST verify against live game's five active stages before production
    if (points.some((n,i)=>!Number.isInteger(n)||n<0||n>limits[i])) return json_({ok:false,error:'Invalid stage score'});
    const total=points.reduce((a,b)=>a+b,0);
    const lock=LockService.getScriptLock();lock.waitLock(25000);
    try {
      const sheet=scoreSheet_();
      const last=sheet.getLastRow();
      const rows=last>1?sheet.getRange(2,1,last-1,14).getValues():[];
      if(rows.some(r=>String(r[0])===room && String(r[1])===player && String(r[13]).includes('attempt='+attempt)))
        return json_({ok:true,duplicate:true});
      const count=rows.filter(r=>String(r[0])===room && String(r[1])===player).length+1;
      sheet.appendRow([room,player,name,String(p.gender||''),new Date(),...points,total,Number(p.writtenCount)||0,
        'received','attempt='+attempt+'; play='+count]);
      return json_({ok:true});
    } finally {lock.releaseLock();}
  } catch(err) {return json_({ok:false,error:String(err.message||err)});}
}
function doGet(e) {
  const p=(e&&e.parameter)||{};
  if(p.action!=='ranking') return json_({ok:false,error:'Unknown action'});
  const room=String(p.room||'').trim().toUpperCase();
  const player=String(p.playerId||'').trim();
  if(!/^[A-Z0-9_-]{3,24}$/.test(room)||!player) return json_({ok:false,error:'Invalid request'});
  const sheet=scoreSheet_(),last=sheet.getLastRow();
  const rows=last>1?sheet.getRange(2,1,last-1,14).getValues():[];
  const same=rows.filter(r=>String(r[0])===room && Number.isFinite(Number(r[10])));
  const best=new Map();
  for(const row of same) best.set(String(row[1]),Math.max(best.get(String(row[1]))??-1,Number(row[10])));
  const scores=[...new Set([...best.values()])].sort((a,b)=>b-a);
  const own=best.get(player);
  return json_({ok:true,room,participants:best.size,bestScore:own??null,
    rank:own===undefined?null:scores.indexOf(own)+1,provisional:true});
}
function json_(v){return ContentService.createTextOutput(JSON.stringify(v)).setMimeType(ContentService.MimeType.JSON);}
