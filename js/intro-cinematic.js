"use strict";
/* Automatic opening cinematic; all educational stages remain manually playable. */
(()=>{
 let active=false,finished=false,last=0,dialogueAt=0,dialoguePosition=-1,coinTriggered=false;
 const overlay=document.createElement('div');
 overlay.className='intro-cinematic-ui hidden';
 overlay.innerHTML='<span class="intro-cinematic-label">บทนำ · การเดินทางข้ามกาลเวลา</span><button type="button" class="intro-cinematic-skip">ข้ามบทนำ ▶</button>';
 document.querySelector('#app').append(overlay);
 const spark=document.createElement('div');spark.className='intro-coin-spark hidden';spark.setAttribute('aria-hidden','true');document.querySelector('#game-screen').append(spark);
 function stop(){active=false;finished=true;overlay.classList.add('hidden');spark.classList.add('hidden');keys.left=keys.right=false;}
 function showMap(){stop();dialogue=null;dialogueDone=null;dialogueBox.classList.add('hidden');coinFound=true;goToScene(3);}
 function begin(){
  active=true;finished=false;last=0;dialogueAt=0;dialoguePosition=-1;coinTriggered=false;
  overlay.classList.remove('hidden');spark.classList.add('hidden');
 }
 const originalStart=startGame;
 startGame=function(){originalStart();begin();};
 overlay.querySelector('button').addEventListener('click',showMap);
 function tick(time){
  requestAnimationFrame(tick);
  if(!active)return;
  if(document.querySelector('#game-screen').classList.contains('hidden')){stop();return;}
  if(!last)last=time;
  const dt=Math.min((time-last)/1000,.05);last=time;
  if(quizActive){stop();return;}
  if(dialogue){
   keys.right=false;player.moving=false;
   if(dialogueIndex!==dialoguePosition){dialoguePosition=dialogueIndex;dialogueAt=time;}
   if(time-dialogueAt>2350){advanceDialogue();dialogueAt=time;dialoguePosition=dialogueIndex;}
   return;
  }
  dialoguePosition=-1;
  if(sceneIndex>2){stop();return;}
  if(sceneIndex===2){
   if(!coinTriggered&&player.x>=730){
    coinTriggered=true;player.x=770;player.moving=false;
    spark.classList.remove('hidden');
    interact();
    return;
   }
   if(coinTriggered){showMap();return;}
  }
  // Use the original movement engine so walking sprites animate in sync with travel.
  keys.left=false;keys.right=true;player.facing=1;
  // The original update() advances school and road automatically at the edge.
 }
 requestAnimationFrame(tick);
})();
