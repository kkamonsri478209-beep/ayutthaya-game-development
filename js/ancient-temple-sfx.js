/* Ancient Temple Fantasy SFX hooks. Load the six approved Aztec WAV files from assets/sfx/. */
(()=>{'use strict';
const base='./';
const files={click:'01_aztec_button.wav',dialogue:'02_aztec_dialogue.wav',correct:'03_aztec_correct.wav',incorrect:'04_aztec_incorrect.wav',coin:'05_aztec_coin.wav',victory:'06_aztec_victory.wav'};
const audio=Object.fromEntries(Object.entries(files).map(([k,v])=>{const a=new Audio(base+v);a.preload='auto';return [k,a];}));
let enabled=true,volume=.34,lastClick=0,lastFeedback='',lastHeading='',lastDialogue=false,lastResult=false;
function play(key){if(!enabled||document.hidden)return;const source=audio[key];if(!source)return;try{const a=source.cloneNode();a.volume=volume*(key==='victory'?.8:1);a.play().catch(()=>{});}catch(e){}}
function attach(){
 const panel=document.getElementById('sound-panel');if(panel){
  const label=document.createElement('label');label.htmlFor='sfx-volume';label.textContent='เอฟเฟกต์';
  const slider=document.createElement('input');slider.id='sfx-volume';slider.type='range';slider.min='0';slider.max='100';slider.value='34';slider.setAttribute('aria-label','ระดับเสียงเอฟเฟกต์');
  slider.addEventListener('input',()=>{volume=Number(slider.value)/100;enabled=volume>0;});
  panel.append(label,slider);
 }
 document.addEventListener('click',e=>{
  const target=e.target.closest('button');if(!target||target.closest('#sound-panel')||target.closest('#music-welcome'))return;
  const now=performance.now();if(now-lastClick<65)return;lastClick=now;play('click');
 },true);
 const feedback=document.getElementById('quiz-feedback');
 if(feedback)new MutationObserver(()=>{
  const s=feedback.textContent.trim();if(!s||s===lastFeedback)return;lastFeedback=s;
  if(/^(ถูกต้อง|ตอบถูก|ยอดเยี่ยม)/.test(s))play('correct');
  else if(/(ยังไม่ถูกต้อง|ไม่ถูกต้อง|ตอบผิด|ลองอีกครั้ง)/.test(s))play('incorrect');
  else if(/(ผ่านด่าน|สำเร็จภารกิจ)/.test(s))play('victory');
 }).observe(feedback,{childList:true,characterData:true,subtree:true});
 const heading=document.getElementById('quiz-heading');
 if(heading)new MutationObserver(()=>{
  const s=heading.textContent;if(s===lastHeading)return;lastHeading=s;
  if(/สรุปผลด่าน/.test(s))play('victory');
 }).observe(heading,{childList:true,characterData:true,subtree:true});
 const dialogue=document.getElementById('dialogue-box');
 if(dialogue)new MutationObserver(()=>{
  const open=!dialogue.classList.contains('hidden');
  if(open&&!lastDialogue)play('dialogue');lastDialogue=open;
 }).observe(dialogue,{attributes:true,attributeFilter:['class']});
 const result=document.getElementById('result-screen');
 if(result)new MutationObserver(()=>{
  const open=!result.classList.contains('hidden');
  if(open&&!lastResult)play('victory');lastResult=open;
 }).observe(result,{attributes:true,attributeFilter:['class']});
 const objective=document.getElementById('objective');
 if(objective)new MutationObserver(()=>{
  const s=objective.textContent;if(/เงินพดด้วง|เหรียญ/.test(s)&&!objective.dataset.sfxCoin){objective.dataset.sfxCoin='1';play('coin');}
 }).observe(objective,{childList:true,characterData:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);else attach();
})();