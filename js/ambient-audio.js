/* Original generative music and nature ambience for Ayutthaya game.
   No external audio files, no copyrighted melodies, and no game logic changes. */
(()=>{
'use strict';
const AudioContextClass=window.AudioContext||window.webkitAudioContext;
if(!AudioContextClass)return;
let ctx=null,master=null,music=null,ambience=null,noiseBuffer=null,enabled=false,volume=.55;
let active=false,lastScene='',lastBeat=-1,lastNature=-1,frameHandle=0;
const $=id=>document.getElementById(id);
const sceneId=()=>{try{return scenes[sceneIndex]?.id||'school'}catch(e){return 'school'}};
const screen=()=>document.querySelector('#game-screen:not(.hidden)')?'game':document.querySelector('#adventure-map-screen:not(.hidden)')?'map':document.querySelector('#cover-screen:not(.hidden)')?'cover':'other';
const palettes={
 school:{notes:[293.66,349.23,440,523.25],nature:'birds'},
 road:{notes:[293.66,392,440,587.33],nature:'birds'},
 coin:{notes:[261.63,329.63,392,523.25],nature:'magic'},
 farm:{notes:[293.66,349.23,440,523.25],nature:'birds'},
 boat:{notes:[261.63,349.23,392,523.25],nature:'water'},
 market:{notes:[293.66,392,440,587.33],nature:'market'},
 port:{notes:[261.63,349.23,392,523.25],nature:'water'},
 foreignTrade:{notes:[293.66,392,440,587.33],nature:'water'},
 internationalPort:{notes:[261.63,349.23,392,523.25],nature:'water'},
 checkpoint:{notes:[261.63,329.63,392,523.25],nature:'wind'},
 treasury:{notes:[261.63,329.63,392,523.25],nature:'wind'},
 royalPalace:{notes:[261.63,349.23,392,523.25],nature:'magic'}
};

// Approved Thai traditional soundtrack. If the MP3 has not been uploaded yet,
// keep the original synthesized music as a safe fallback.
const soundtrack=new Audio('audio/ayutthaya_thai_traditional_loop_96s.mp3');
soundtrack.loop=true;soundtrack.preload='auto';soundtrack.volume=0;
let soundtrackReady=false,soundtrackFailed=false;
soundtrack.addEventListener('canplay',()=>{soundtrackReady=true;});
soundtrack.addEventListener('error',()=>{soundtrackFailed=true;});
function reading(){return !!document.querySelector('#dialogue-box:not(.hidden),#quiz-panel:not(.hidden)');}
function updateSoundtrack(){
 const s=screen();
 const shouldPlay=enabled&&(s==='game'||s==='map'||s==='cover'||s==='result');
 if(!shouldPlay){soundtrack.pause();return;}
 if(!soundtrackReady||soundtrackFailed)return;
 const target=volume*(reading()?.08:.24);
 soundtrack.volume+=Math.max(-.025,Math.min(.025,target-soundtrack.volume));
 if(soundtrack.paused)soundtrack.play().catch(()=>{});
}

function create(){
 if(ctx)return;
 ctx=new AudioContextClass();
 master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
 music=ctx.createGain();music.gain.value=.48;music.connect(master);
 ambience=ctx.createGain();ambience.gain.value=.38;ambience.connect(master);
 const length=Math.floor(ctx.sampleRate*2);noiseBuffer=ctx.createBuffer(1,length,ctx.sampleRate);
 const data=noiseBuffer.getChannelData(0);let x=123456789;
 for(let i=0;i<length;i++){x^=x<<13;x^=x>>>17;x^=x<<5;data[i]=((x>>>0)/2147483648-1)*.55;}
}
function note(freq,when,duration=.65,amp=.14,type='sine',target=music){
 if(!ctx||!active||!enabled||soundtrackReady)return;
 const o=ctx.createOscillator(),g=ctx.createGain();
 o.type=type;o.frequency.setValueAtTime(freq,when);
 g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(Math.max(.001,amp),when+.045);
 g.gain.exponentialRampToValueAtTime(.0001,when+duration);
 o.connect(g);g.connect(target);o.start(when);o.stop(when+duration+.03);
}
function breath(when,duration,amp,cutoff){
 if(!ctx||!active||!enabled||soundtrackReady)return;
 const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();
 src.buffer=noiseBuffer;src.loop=true;filter.type='lowpass';filter.frequency.value=cutoff;
 g.gain.setValueAtTime(.0001,when);g.gain.linearRampToValueAtTime(amp,when+.35);
 g.gain.linearRampToValueAtTime(.0001,when+duration);
 src.connect(filter);filter.connect(g);g.connect(ambience);src.start(when);src.stop(when+duration+.02);
}
function bird(when,index){
 if(!ctx||!active||!enabled||soundtrackReady)return;
 const o=ctx.createOscillator(),g=ctx.createGain(),f=780+index*110;
 o.type='sine';o.frequency.setValueAtTime(f,when);o.frequency.exponentialRampToValueAtTime(f*1.45,when+.10);o.frequency.exponentialRampToValueAtTime(f*.95,when+.23);
 g.gain.setValueAtTime(.0001,when);g.gain.linearRampToValueAtTime(.10,when+.04);g.gain.exponentialRampToValueAtTime(.0001,when+.26);
 o.connect(g);g.connect(ambience);o.start(when);o.stop(when+.28);
}
function stop(){
 active=false;lastBeat=-1;lastNature=-1;
 if(master&&ctx)master.gain.setTargetAtTime(0,ctx.currentTime,.15);
 soundtrack.pause();
}
function start(){
 if(!enabled)return;
 create();ctx.resume().catch(()=>{});
 active=true;lastBeat=-1;lastNature=-1;
 master.gain.setTargetAtTime(soundtrackReady?0:volume*.4,ctx.currentTime,.18);
 updateSoundtrack();
}
function tick(){
 const currentScreen=screen();
 if(currentScreen!=='game'&&currentScreen!=='map'){if(active)stop();return;}
 if(!active||!ctx||ctx.state!=='running')return;
 const id=currentScreen==='map'?'royalPalace':sceneId(),preset=palettes[id]||palettes.school;
 if(id!==lastScene){lastScene=id;lastBeat=-1;lastNature=-1;}
 const t=ctx.currentTime;
 const beat=Math.floor(t/1.1);
 if(beat!==lastBeat){
  lastBeat=beat;
  const n=preset.notes[(beat+Math.floor(beat/4))%preset.notes.length];
  note(n,t+.025,.8,.095,'sine');
  if(beat%4===0)note(preset.notes[0]/2,t+.025,2.5,.08,'triangle');
  if(beat%8===4)note(preset.notes[2]/2,t+.025,1.6,.055,'sine');
 }
 const nature=Math.floor(t/3.4);
 if(nature!==lastNature){
  lastNature=nature;
  if(preset.nature==='birds'){breath(t+.02,2.7,.065,420);bird(t+.4,nature%3);if(nature%2===0)bird(t+1.2,(nature+1)%3);}
  else if(preset.nature==='water'){breath(t+.02,3.1,.14,680);breath(t+1.1,1.9,.065,1100);}
  else if(preset.nature==='wind'){breath(t+.02,3.1,.10,330);}
  else if(preset.nature==='market'){breath(t+.02,2.7,.04,480);if(nature%2===0)bird(t+.7,nature%3);}
  else if(preset.nature==='magic'){note(1046.5,t+.5,1.8,.055,'sine',ambience);note(1318.5,t+1.1,1.3,.035,'sine',ambience);}
 }
}
function updateUI(){
 const b=$('sound-toggle'),v=$('sound-volume');
 if(b){b.textContent=enabled?'🔊 เปิดเสียงแล้ว':'🔈 แตะเปิดเสียง';b.setAttribute('aria-pressed',String(enabled));}
 if(v)v.value=String(Math.round(volume*100));
}
function attach(){
 if($('sound-panel'))return;
 const panel=document.createElement('div');panel.id='sound-panel';
 panel.setAttribute('aria-label','ควบคุมเสียงเกม');
 panel.innerHTML='<button type="button" id="sound-toggle" aria-pressed="false">🔈 แตะเปิดเสียง</button><button type="button" id="sound-test">♪ ทดสอบเสียง</button><label for="sound-volume">ระดับเสียง</label><input id="sound-volume" type="range" min="0" max="100" value="55" aria-label="ระดับเสียงเพลงและธรรมชาติ">';
 document.body.appendChild(panel);
 $('sound-toggle').addEventListener('click',()=>{
  enabled=!enabled;
  if(!enabled)stop();else {create();ctx.resume().then(()=>{if(screen()==='game'||screen()==='map')start();}).catch(()=>{});if(screen()==='game'||screen()==='map')start();}
  updateUI();
 });
 $('sound-test').addEventListener('click',()=>{
  create();
  ctx.resume().then(()=>{
   enabled=true;
   master.gain.cancelScheduledValues(ctx.currentTime);
   master.gain.setTargetAtTime(Math.max(volume,.55),ctx.currentTime,.015);
   note(523.25,ctx.currentTime+.06,.6,.7,'sine',master);
   note(659.25,ctx.currentTime+.25,.65,.6,'sine',master);
   if(screen()==='game'||screen()==='map')start();
   updateUI();
  }).catch(()=>{$('sound-test').textContent='ตรวจสอบการอนุญาตเสียง';});
 });
 $('sound-volume').addEventListener('input',e=>{
  volume=Number(e.target.value)/100;
  if(master&&ctx)master.gain.setTargetAtTime(enabled?(soundtrackReady?0:volume*.4):0,ctx.currentTime,.08);
  updateSoundtrack();
 });
 updateUI();
 // Explicit tap on the sound button unlocks audio on Safari and iPad.
 // Browsers require a genuine user gesture before starting audio.
 document.addEventListener('pointerdown',e=>{
  if(e.target.closest('#sound-panel'))return;
  if(!enabled)return;
  // The gesture can occur on a start button before game-screen becomes visible.
  create();ctx.resume().catch(()=>{});
  if(screen()==='game')start();
 },{passive:true});
 document.addEventListener('keydown',e=>{
  if(!enabled||!['Enter',' ','ArrowLeft','ArrowRight','KeyA','KeyD','KeyE'].includes(e.code))return;
  create();ctx.resume().catch(()=>{});
  if(screen()==='game')start();
 });
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden)stop();
  else if(enabled&&(screen()==='game'||screen()==='map')&&ctx&&ctx.state==='running')start();
 });
 // Detect scene changes without modifying the game update loop.
 setInterval(()=>{
  if(screen()!=='game'&&screen()!=='map'){if(active)stop();updateSoundtrack();return;}
  if(!active&&enabled&&ctx&&ctx.state==='running')start();
  tick();
  updateSoundtrack();
 },300);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);
else attach();
})();
