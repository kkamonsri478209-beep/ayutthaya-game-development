"use strict";
/* Ayutthaya adventure map: additive layer, keeps original scenes, dialogues and quizzes intact. */
(() => {
 const stageNames=['ทุ่งนา','การเดินทางทางเรือ','ตลาดในกรุงศรีอยุธยา','ท่ารับสินค้าจากหัวเมือง','ย่านการค้าต่างชาติ','ท่าเรือการค้าต่างประเทศ','ด่านขนอน','พระคลังสินค้า','พระราชวังหลวง'];
 const areas=[
  {title:'แหล่งผลิตและทรัพยากร',file:'pin-farming.webp',left:16,top:81,stages:[1,2]},
  {title:'การค้าภายใน',file:'pin-market.webp',left:47,top:63,stages:[3,4]},
  {title:'การค้าต่างประเทศ',file:'pin-trade.webp',left:77,top:60,stages:[5,6]},
  {title:'เศรษฐกิจของรัฐ',file:'pin-palace.webp',left:52,top:27,stages:[7,8,9]}
 ];
 const passed=()=>[stage1Passed,stage2Passed,stage3Passed,stage4Passed,stage5Passed,stage6Passed,stage7Passed,stage8Passed,stage9Passed];
 const available=(stage)=>stage===1||Boolean(passed()[stage-2]);
 let discovered=false, selectedArea=0, mapOpen=false;
 const map=document.createElement('section');map.id='adventure-map-screen';map.className='screen hidden';map.setAttribute('aria-label','แผนที่การผจญภัยกรุงศรีอยุธยา');
 map.innerHTML='<div class="adventure-map-frame"><img class="adventure-map-art" src="ayutthaya-map.webp" alt="แผนที่แฟนตาซีกรุงศรีอยุธยา"><div class="adventure-map-pins"></div></div><div class="adventure-map-top"><strong>แผนที่การผจญภัยกรุงศรีอยุธยา</strong><span>เลือกหมุดเพื่อสำรวจสถานที่</span></div><button type="button" class="adventure-map-back">กลับไปยังฉากเดิม</button><div class="adventure-map-modal hidden" role="dialog" aria-modal="true" aria-label="เลือกด่าน"><div class="adventure-map-panel"><button type="button" class="adventure-map-close" aria-label="ปิด">×</button><h2 class="adventure-map-area-title"></h2><div class="adventure-map-stage-list"></div></div></div>';
 document.querySelector('#app').append(map);
 const pinLayer=map.querySelector('.adventure-map-pins'),modal=map.querySelector('.adventure-map-modal');
 const mapButton=document.createElement('button');mapButton.type='button';mapButton.className='adventure-map-launch hidden';mapButton.textContent='🗺 แผนที่อยุธยา';document.querySelector('#app').append(mapButton);
 function refresh(){
  pinLayer.replaceChildren();
  areas.forEach((area,index)=>{
   const unlocked=available(area.stages[0]);
   const b=document.createElement('button');b.type='button';b.className='adventure-map-pin'+(unlocked?'':' locked');
   b.style.left=area.left+'%';b.style.top=area.top+'%';
   b.setAttribute('aria-label',area.title+(unlocked?'':' (ยังไม่ปลดล็อก)'));
   b.innerHTML='<img src="'+area.file+'" alt=""><span>'+area.title+'</span>'+(unlocked?'':'<span class="adventure-map-lock">🔒</span>');
   b.addEventListener('click',()=>{document.dispatchEvent(new CustomEvent('ayutthaya-map-select'));if(unlocked)openArea(index);else showLocked(area);});pinLayer.append(b);
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
  if(first){const scene=scenes[first+2];if(scene){const path=first===2?(selectedGender==='girl'?'boat-ride-girl.webp':'boat-ride-boy.webp'):scene.bg;if(path)image(path);}}
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
 function openMap(){
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
  if(n===3&&!discovered){
   discovered=true;
   // Preserve the original farm intro: it will run when the first pin is selected.
   openMap();return;
  }
  originalGoToScene(n,direction);
 };
 function launch(stage){
  closeMap();
  originalGoToScene(stage+2);
 }
 map.querySelector('.adventure-map-back').addEventListener('click',closeMap);
 map.querySelector('.adventure-map-close').addEventListener('click',()=>modal.classList.add('hidden'));
 modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.add('hidden');});
 mapButton.addEventListener('click',openMap);
 const originalStartGame=startGame;
 startGame=function(){discovered=false;mapOpen=false;map.classList.add('hidden');mapButton.classList.add('hidden');originalStartGame();};
 const originalShowScreen=showScreen;
 showScreen=function(id){originalShowScreen(id);if(id!=='game-screen'){map.classList.add('hidden');mapButton.classList.add('hidden');}else if(discovered&&!mapOpen){mapButton.classList.remove('hidden');}};
 window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.classList.contains('hidden'))modal.classList.add('hidden');});
})();
