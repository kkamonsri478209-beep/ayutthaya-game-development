/* Ancient Temple Fantasy SFX hooks. Load the six approved Aztec WAV files from assets/sfx/. */
(()=>{'use strict';
const base='./';
const files={click:'01_aztec_button.wav',dialogue:'02_aztec_dialogue.wav',correct:'03_aztec_correct.wav',incorrect:'04_aztec_incorrect.wav',coin:'05_aztec_coin.wav',victory:'06_aztec_victory.wav'};
const audio=Object.fromEntries(Object.entries(files).map(([k,v])=>{const a=new Audio(base+v);a.preload='auto';return [k,a];}));
let enabled=true,volume=.34,lastClick=0,lastFeedback='',lastHeading='',lastDialogue=false,lastResult=false;
function play(key){if(!enabled||document.hidden)return;const source=audio[key];if(!source)return;try{const a=source.cloneNode();a.volume=volume*(key==='victory'?.8:1);a.play().catch(()=>{});}catch(e){}}
function attach(){
 document.addEventListener('ayutthaya-map-select',()=>play('coin'));

 const panel=document.getElementById('sound-panel');if(panel){
  const label=document.createElement('label');label.htmlFor='sfx-volume';label.textContent='เอฟเฟกต์';
  const slider=document.createElement('input');slider.id='sfx-volume';slider.type='range';slider.min='0';slider.max='100';slider.value='34';slider.setAttribute('aria-label','ระดับเสียงเอฟเฟกต์');
  slider.addEventListener('input',()=>{volume=Number(slider.value)/100;enabled=volume>0;});
  panel.append(label,slider);
 }
 document.addEventListener('click',e=>{
  const target=e.target.closest('button');if(!target||target.closest('#sound-panel')||target.closest('#music-welcome')||target.closest('#adventure-map-screen'))return;
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
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attachThaiDialogueChime);else attachThaiDialogueChime();
/* Thai chime dialogue typewriter: preserve the game's original dialogue content and navigation. */
function attachThaiDialogueChime(){
 const box=document.getElementById('dialogue-box'),target=document.getElementById('dialogue-text');
 const next=document.getElementById('dialogue-next-btn');
 if(!box||!target||!next)return;
 let full='',shown='',timer=null,token=0,step=0,ctx=null,buffer=null;
 const AudioContextClass=window.AudioContext||window.webkitAudioContext;
 function stop(){if(timer!==null){clearTimeout(timer);timer=null;}token++;}
 function visible(){return !box.classList.contains('hidden');}
 function finish(){stop();if(full&&target.textContent!==full){shown=full;target.textContent=full;}}
 function chime(){
  if(!enabled||volume<=0||document.hidden||!buffer||!AudioContextClass)return;
  try{
   if(!ctx)ctx=new AudioContextClass();
   if(ctx.state==='suspended'){ctx.resume().catch(()=>{});}
   const source=ctx.createBufferSource(),gain=ctx.createGain();
   source.buffer=buffer;gain.gain.value=Math.min(.18,volume*.24);
   source.connect(gain);gain.connect(ctx.destination);
   source.start(0,Math.min(.28,Math.max(0,buffer.duration-.12)),Math.min(.105,buffer.duration-.29));
  }catch(e){}
 }
 if(AudioContextClass){
  fetch('./dialogue_thai_chime.wav').then(r=>{if(!r.ok)throw Error('chime unavailable');return r.arrayBuffer();})
   .then(data=>{const temp=new AudioContextClass();return temp.decodeAudioData(data).then(decoded=>{buffer=decoded;return temp.close();});})
   .catch(()=>{});
 }
 const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter('th',{granularity:'grapheme'}):null;
 const chars=s=>segmenter?Array.from(segmenter.segment(s),x=>x.segment):Array.from(s);
 function animate(value){
  stop();full=value;shown='';step=0;
  // Cinematic dialogue advances without a click; ensure its first line has an audible cue.
  if(visible()&&value)play('dialogue');
  if(!visible()||!full)return;
  const parts=chars(full);let i=0;const own=token;
  target.textContent='';
  function tick(){
   if(own!==token||!visible())return;
   const piece=parts[i++];if(piece===undefined){timer=null;return;}
   shown+=piece;target.textContent=shown;
   if(piece.trim()&&++step%3===0)chime();
   if(i<parts.length)timer=setTimeout(tick,33);
   else timer=null;
  }
  tick();
 }
 new MutationObserver(()=>{
  if(!visible())return;
  const current=target.textContent;
  if(current===shown||current===full)return;
  animate(current);
 }).observe(target,{childList:true,characterData:true,subtree:true});
 new MutationObserver(()=>{
  if(!visible())stop();
  else if(target.textContent&&!timer&&target.textContent!==full)animate(target.textContent);
 }).observe(box,{attributes:true,attributeFilter:['class']});
 next.addEventListener('click',e=>{
  if(timer!==null){e.preventDefault();e.stopImmediatePropagation();finish();}
 },true);
}

})();