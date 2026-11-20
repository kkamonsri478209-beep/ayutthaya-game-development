"use strict";
/* Ayutthaya adventure map: additive layer, keeps original scenes, dialogues and quizzes intact. */
(() => {
 const stageNames=['ทุ่งนาแห่งความอุดมสมบูรณ์','สายน้ำแห่งการค้า','ตลาดหลากหลาย สินค้ามากมาย','สำเภาการค้าแห่งอยุธยา','ความลับแห่งพระคลังสินค้า'];
 const sceneForStage=[3,4,5,8,10];
 const areas=[
  {title:'แหล่งผลิตและทรัพยากร',file:'pin-farming.png',left:16,top:81,stages:[1,2]},
  {title:'การค้าภายใน',file:'pin-market.png',left:47,top:63,stages:[3]},
  {title:'การค้าต่างประเทศ',file:'pin-trade.png',left:77,top:60,stages:[4]},
  {title:'เศรษฐกิจของรัฐ',file:'pin-palace.png',left:52,top:27,stages:[5]}
 ];
 const passed=()=>[stage1Passed,stage2Passed,stage3Passed,stage6Passed,stage8Passed];
 const available=(stage)=>stage===1||Boolean(passed()[stage-2]);
 let discovered=false, selectedArea=0, mapOpen=false, newlyUnlockedArea=-1, transitionBusy=false;
 const map=document.createElement('section');map.id='adventure-map-screen';map.className='screen hidden';map.setAttribute('aria-label','แผนที่การผจญภัยกรุงศรีอยุธยา');
 map.innerHTML='<div class="adventure-map-frame"><img class="adventure-map-art" src="ayutthaya-map.png" alt="แผนที่แฟนตาซีกรุงศรีอยุธยา"><div class="adventure-map-pins"></div></div><div class="adventure-map-top"><strong>แผนที่การผจญภัยกรุงศรีอยุธยา</strong><span>เลือกหมุดเพื่อสำรวจสถานที่</span></div><button type="button" class="adventure-map-back">กลับไปยังฉากเดิม</button><div class="adventure-map-modal hidden" role="dialog" aria-modal="true" aria-label="เลือกด่าน"><div class="adventure-map-panel"><button type="button" class="adventure-map-close" aria-label="ปิด">×</button><h2 class="adventure-map-area-title"></h2><div class="adventure-map-stage-list"></div></div></div>';
 document.querySelector('#app').append(map);
 const pinLayer=map.querySelector('.adventure-map-pins'),modal=map.querySelector('.adventure-map-modal');
 const curtain=document.createElement('div');curtain.className='adventure-cutscene-curtain';curtain.setAttribute('aria-hidden','true');document.querySelector('#app').append(curtain);
 const basePortal=document.createElement('div');basePortal.className='intro-time-portal adventure-base-portal hidden';basePortal.setAttribute('aria-label','คัตซีนปลดล็อกฐานถัดไป');basePortal.innerHTML='<div class="intro-time-portal-aura"></div><div class="intro-time-portal-ring"></div><div class="intro-time-portal-core"></div><div class="intro-time-portal-stars"></div><div class="intro-time-portal-caption"></div>';document.querySelector('#app').append(basePortal);
 const mapButton=document.createElement('button');mapButton.type='button';mapButton.className='adventure-map-launch hidden';mapButton.textContent='🗺 แผนที่อยุธยา';document.querySelector('#app').append(mapButton);
 function refresh(){
  pinLayer.replaceChildren();
  areas.forEach((area,index)=>{
   const unlocked=available(area.stages[0]);
   const b=document.createElement('button');b.type='button';b.className='adventure-map-pin'+(unlocked?'':' locked')+(index===newlyUnlockedArea?' just-unlocked':'');
   b.style.left=area.left+'%';b.style.top=area.top+'%';
   b.setAttribute('aria-label',area.title+(unlocked?'':' (ยังไม่ปลดล็อก)'));
   b.innerHTML='<img src="'+area.file+'" alt=""><span>'+area.title+'</span>'+(unlocked?'':'<span class="adventure-map-lock">🔒</span>');
   b.addEventListener('click',()=>{document.dispatchEvent(new CustomEvent('ayutthaya-map-select'));if(unlocked){const next=area.stages.find(stage=>!passed()[stage-1]&&available(stage));if(next)launch(next);else openArea(index);}else showLocked(area);});pinLayer.append(b);
  });
 }
 function showLocked(area){
  modal.classList.remove('hidden');
  map.querySelector('.adventure-map-area-title').textContent=area.title+' — ยังไม่ปลดล็อก';
  map.querySelector('.adventure-map-stage-list').textContent='ทำภารกิจในเขตก่อนหน้าให้สำเร็จเพื่อปลดล็อกพื้นที่นี้';
 }
 function openArea(index){
  selectedArea=index;const area=areas[index];
  // Warm the first unlocked destination while the player reads the stage list.
  const first=area.stages.find(available);
  if(first){const scene=scenes[sceneForStage[first-1]];if(scene){const path=first===2?(selectedGender==='girl'?'boat-ride-girl.webp':'boat-ride-boy.webp'):scene.bg;if(path)image(path);}}
  map.querySelector('.adventure-map-area-title').textContent=area.title;
  const list=map.querySelector('.adventure-map-stage-list');list.replaceChildren();
  area.stages.forEach(stage=>{
   const b=document.createElement('button');b.type='button';b.className='adventure-map-stage';
   const done=passed()[stage-1],ready=available(stage);
   b.textContent='ด่านที่ '+stage+' — '+stageNames[stage-1]+(done?' ✓ ผ่านแล้ว':ready?' ▶':' 🔒');
   b.disabled=!ready;b.addEventListener('click',()=>{document.dispatchEvent(new CustomEvent('ayutthaya-map-select'));launch(stage);});list.append(b);
  });
  modal.classList.remove('hidden');
 }
 function openMap(unlockedArea=-1){
  newlyUnlockedArea=unlockedArea;
  if(!discovered)return;
  mapOpen=true;refresh();modal.classList.add('hidden');
  // Load the farm image while the player explores the map, before stage selection.
  image('stage1-farm.webp');
  document.querySelector('#game-screen').classList.add('hidden');
  document.querySelector('#controls').classList.add('hidden');
  map.classList.remove('hidden');mapButton.classList.add('hidden');
  keys.left=keys.right=false;
 }
 function closeMap(){
  mapOpen=false;map.classList.add('hidden');modal.classList.add('hidden');
  document.querySelector('#game-screen').classList.remove('hidden');
  document.querySelector('#controls').classList.remove('hidden');
  mapButton.classList.remove('hidden');
 }
 const originalGoToScene=goToScene;
 goToScene=function(n,direction='forward'){
  if(n===5&&discovered&&stage2Passed&&sceneIndex===4){openMap(1);return;}
  if(n===3&&!discovered){
   discovered=true;
   // Preserve the original farm intro: it will run when the first pin is selected.
   openMap();return;
  }
  originalGoToScene(n,direction);
 };
 function launch(stage){
  closeMap();
  originalGoToScene(sceneForStage[stage-1]);
 }
 // Complete a base with a short dialogue, then a cinematic fade to the unlocked map.
 const transitions={
  4:{area:1,lines:[
   {who:'student',emotion:'curious',text:()=>selectedGender==='girl'?'ดูเหมือนเราจะใกล้ถึงพระนครแล้วนะคะ!':'ดูเหมือนเราจะใกล้ถึงพระนครแล้วนะครับ!'},
   {who:'boatman',emotion:'greeting',text:'ถูกแล้วเจ้าหนู! อีกไม่นานเราจะถึงตลาดอันคึกคักของกรุงศรีอยุธยา เตรียมตัวให้พร้อมเถิด!'},
   {who:'student',emotion:'smile',text:()=>selectedGender==='girl'?'ตลาดสมัยอยุธยาจะเป็นอย่างไรกันนะ อยากเห็นแล้วค่ะ!':'ตลาดสมัยอยุธยาจะเป็นอย่างไรกันนะ อยากเห็นแล้วครับ!'}
  ]},
  5:{area:2,lines:[
   {who:'student',emotion:'curious',text:()=>selectedGender==='girl'?'เราได้เห็นการค้าภายในเมืองแล้ว ต่อไปจะไปที่ไหนกันคะ?':'เราได้เห็นการค้าภายในเมืองแล้ว ต่อไปจะไปที่ไหนกันครับ?'},
   {who:'portOfficer',emotion:'explain',text:'ต่อไปเจ้าจะได้พบย่านการค้าต่างชาติ มีพ่อค้าจากหลายดินแดนนำสินค้ามาแลกเปลี่ยนกัน!'},
   {who:'student',emotion:'smile',text:()=>selectedGender==='girl'?'น่าสนใจจังค่ะ! หนูพร้อมออกเดินทางแล้ว':'น่าสนใจจังครับ! ผมพร้อมออกเดินทางแล้ว'}
  ]},
  8:{area:3,lines:[
   {who:'student',emotion:'curious',text:()=>selectedGender==='girl'?'ได้เห็นเรือสินค้าจากหลายประเทศแล้ว ต่อไปเราจะเรียนรู้อะไรอีกคะ?':'ได้เห็นเรือสินค้าจากหลายประเทศแล้ว ต่อไปเราจะเรียนรู้อะไรอีกครับ?'},
   {who:'foreignExplorer',emotion:'explain',text:'การค้าต้องเกี่ยวข้องกับรายได้ของบ้านเมืองด้วย จงไปเรียนรู้ที่ด่านขนอน แล้วเดินทางต่อไปยังพระคลังสินค้าและพระราชวังเถิด!'},
   {who:'student',emotion:'smile',text:()=>selectedGender==='girl'?'เข้าใจแล้วค่ะ ไปเรียนรู้เรื่องรายได้ของบ้านเมืองกันต่อเลย!':'เข้าใจแล้วครับ ไปเรียนรู้เรื่องรายได้ของบ้านเมืองกันต่อเลย!'}
  ]}
 };
 function cinematicReturn(area){
  const messages=[
   '',
   'เส้นทางแห่งการค้ากำลังเปิดออก...|จงก้าวสู่ตลาดแห่งกรุงศรีอยุธยา',
   'ประตูสู่การค้าต่างแดนได้เปิดแล้ว...|จงออกสำรวจผู้คนและสินค้าจากแดนไกล',
   'ความลับแห่งเศรษฐกิจอยุธยารออยู่...|จงค้นพบการจัดเก็บรายได้และพระคลังของแผ่นดิน'
  ];
  const [headline,detail]=(messages[area]||'การเดินทางครั้งใหม่กำลังเริ่มขึ้น...|จงก้าวต่อไป').split('|');
  const caption=basePortal.querySelector('.intro-time-portal-caption');
  caption.replaceChildren();
  caption.append(document.createTextNode(headline));
  const subtitle=document.createElement('span');subtitle.textContent=detail;caption.append(subtitle);
  basePortal.classList.remove('hidden','intro-portal-reveal');
  // Prepare the new map behind the time portal, then reveal the newly unlocked pin.
  window.setTimeout(()=>openMap(area),950);
  window.setTimeout(()=>basePortal.classList.add('intro-portal-reveal'),2400);
  window.setTimeout(()=>{
   basePortal.classList.add('hidden');
   basePortal.classList.remove('intro-portal-reveal');
   transitionBusy=false;
  },4100);
 }
 // Capture the result button before the original handler advances into the next stage.
 $('quiz-next-btn').addEventListener('click',e=>{
  const config=transitions[sceneIndex];
  if(!discovered||!config||!quizShowingResult||transitionBusy)return;
  const finished=config.area===1?stage2Passed:config.area===2?stage3Passed:stage6Passed;
  if(!finished)return;
  e.preventDefault();e.stopImmediatePropagation();
  transitionBusy=true;
  quizPanel.classList.add('hidden');quizActive=false;quizShowingResult=false;
  openDialogue(config.lines,()=>cinematicReturn(config.area));
 },true);
 const glow=document.createElement('style');
 glow.textContent='.adventure-map-pin.just-unlocked{filter:drop-shadow(0 0 13px #ffe18b) drop-shadow(0 0 24px #f5b943);z-index:5}.adventure-map-pin.just-unlocked img{animation:areaUnlockGlow 1.35s ease-in-out infinite alternate}@keyframes areaUnlockGlow{from{filter:brightness(1)}to{filter:brightness(1.3) saturate(1.3)}}.adventure-cutscene-curtain{position:absolute;inset:0;background:#100d25;opacity:0;pointer-events:none;z-index:110;transition:opacity .6s ease}.adventure-cutscene-curtain.visible{opacity:1;pointer-events:auto}@media(prefers-reduced-motion:reduce){.adventure-map-pin.just-unlocked img{animation:none}.adventure-cutscene-curtain{transition:none}}';
 document.head.append(glow);
 map.querySelector('.adventure-map-back').addEventListener('click',closeMap);
 map.querySelector('.adventure-map-close').addEventListener('click',()=>modal.classList.add('hidden'));
 modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.add('hidden');});
 mapButton.addEventListener('click',openMap);
 const originalStartGame=startGame;
 startGame=function(){discovered=false;mapOpen=false;transitionBusy=false;newlyUnlockedArea=-1;basePortal.classList.add('hidden');basePortal.classList.remove('intro-portal-reveal');map.classList.add('hidden');mapButton.classList.add('hidden');originalStartGame();};
 const originalShowScreen=showScreen;
 showScreen=function(id){originalShowScreen(id);if(id!=='game-screen'){map.classList.add('hidden');mapButton.classList.add('hidden');}else if(discovered&&!mapOpen){mapButton.classList.remove('hidden');}};
 window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.classList.contains('hidden'))modal.classList.add('hidden');});
})();
