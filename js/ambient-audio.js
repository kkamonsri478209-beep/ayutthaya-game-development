/* Approved MP3 soundtrack only. Starts on the first player interaction.
   The original synthesized tune is intentionally disabled. */
(()=>{
'use strict';
const audio=new Audio('./ayutthaya_thai_traditional_loop_96s.mp3');
audio.loop=true;
audio.preload='auto';
let enabled=true,volume=.55,unlocked=false;
const $=id=>document.getElementById(id);
const visible=id=>{const el=$(id);return !!el&&!el.classList.contains('hidden');};
const scene=()=>visible('game-screen')?'game':visible('adventure-map-screen')?'map':visible('result-screen')?'result':visible('cover-screen')?'cover':visible('select-screen')?'select':visible('name-screen')?'name':'intro';
function updateUI(){
 const b=$('sound-toggle'),v=$('sound-volume');
 if(b){b.textContent=enabled?'🔊 เปิดเสียงแล้ว':'🔈 ปิดเสียงอยู่';b.setAttribute('aria-pressed',String(enabled));}
 if(v)v.value=String(Math.round(volume*100));
}
function update(){
 const s=scene();
 const allowed=unlocked&&enabled;
 if(!allowed){if(!audio.paused)audio.pause();return;}
 const quiet=visible('quiz-panel')||visible('dialogue-box');
 const target=volume*(quiet?.12:.48);
 audio.volume+=Math.max(-.045,Math.min(.045,target-audio.volume));
 if(audio.paused)audio.play().catch(()=>{});
}
function unlock(){
 unlocked=true;
 if(enabled){
  audio.volume=Math.max(.05,volume*.48);
  audio.play().then(()=>update()).catch(()=>{});
 }
}
function attach(){
 if($('sound-panel'))return;
 const welcome=$('music-welcome'),welcomeBtn=$('music-welcome-btn');
 if(welcomeBtn)welcomeBtn.addEventListener('click',()=>{unlock();welcome.classList.add('hidden');});
 const panel=document.createElement('div');
 panel.id='sound-panel';
 panel.setAttribute('aria-label','ควบคุมเสียงเกม');
 panel.innerHTML='<button type="button" id="sound-toggle" aria-pressed="true">🔊 เปิดเสียงแล้ว</button><button type="button" id="sound-test">♪ ฟังเพลง</button><label for="sound-volume">ระดับเสียง</label><input id="sound-volume" type="range" min="0" max="100" value="55" aria-label="ระดับเสียงเพลง">';
 document.body.appendChild(panel);
 $('sound-toggle').addEventListener('click',()=>{
  enabled=!enabled;
  if(enabled)unlock();else audio.pause();
  updateUI();update();
 });
 $('sound-test').addEventListener('click',()=>{
  enabled=true;unlocked=true;
  audio.volume=Math.max(.15,volume*.48);
  audio.play().catch(()=>{});
  updateUI();
 });
 $('sound-volume').addEventListener('input',e=>{volume=Number(e.target.value)/100;update();});
 // The first Start click is a genuine browser user gesture and unlocks audio.
 $('start-btn')?.addEventListener('click',unlock,{capture:true});
 // Also support keyboard, touch and returning players.
 document.addEventListener('pointerdown',e=>{
  if(e.target.closest('#sound-panel'))return;
  if(!unlocked)unlock();
 },{passive:true,capture:true});
 document.addEventListener('keydown',e=>{if(!unlocked&&['Enter',' ','Space'].includes(e.code))unlock();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.pause();else update();});
 audio.addEventListener('error',()=>{const b=$('sound-test');if(b)b.textContent='ไม่พบไฟล์เพลง';});
 updateUI();
 setInterval(update,180);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);
else attach();
})();