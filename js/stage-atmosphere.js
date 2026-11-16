"use strict";
/* Lightweight ambient atmosphere for each of the nine educational stages. */
(()=>{
 const host=document.getElementById('game-screen');
 const game=document.getElementById('game');
 if(!host||!game)return;
 const layer=document.createElement('canvas');
 layer.className='stage-atmosphere';
 layer.setAttribute('aria-hidden','true');
 host.insertBefore(layer,game.nextSibling);
 const css=document.createElement('style');
 css.textContent='.game-screen{position:relative}.stage-atmosphere{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1}.game-screen #game{position:relative;z-index:0}@media(prefers-reduced-motion:reduce){.stage-atmosphere{display:none}}';
 document.head.append(css);
 const ctx=layer.getContext('2d',{alpha:true});
 if(!ctx)return;
 const themes={
  farm:{type:'petal',colors:['#ffc1df','#ff91c8','#fff0fa'],count:24,wind:0.24},
  boat:{type:'water',colors:['#e4f9ff','#bde9ff','#ffffff'],count:19,wind:0.12},
  market:{type:'dust',colors:['#ffdf91','#fff3c9','#f8c66d'],count:20,wind:0.07},
  port:{type:'water',colors:['#f7e9c4','#d8f6ff','#fff8df'],count:18,wind:0.18},
  foreignTrade:{type:'leaf',colors:['#f9d87c','#e4ad5d','#d9eb99'],count:19,wind:0.2},
  internationalPort:{type:'water',colors:['#e6f9ff','#c1e9f8','#fff4cc'],count:22,wind:0.16},
  checkpoint:{type:'leaf',colors:['#ddbb73','#a9c17a','#d99c5c'],count:18,wind:0.21},
  treasury:{type:'dust',colors:['#fce6a5','#fff3cc','#dcb96a'],count:19,wind:0.055},
  royalPalace:{type:'spark',colors:['#ffeab1','#fff7db','#ffcf7b'],count:24,wind:0.07}
 };
 let w=0,h=0,particles=[],current='',last=0,elapsed=0;
 const rand=(a,b)=>a+Math.random()*(b-a);
 const make=(theme,anywhere=true)=>({
  x:rand(-20,w+20),y:anywhere?rand(-20,h+20):rand(-30,-4),
  r:rand(1.3,theme.type==='petal'?5:theme.type==='leaf'?4.2:3.2),
  speed:rand(0.22,0.62),phase:rand(0,Math.PI*2),color:theme.colors[Math.floor(Math.random()*theme.colors.length)],
  opacity:rand(.24,.66),rotation:rand(0,Math.PI*2),turn:rand(-.012,.012)
 });
 function resize(){
  const rect=game.getBoundingClientRect();
  const parent=host.getBoundingClientRect();
  const scale=Math.min(1.5,window.devicePixelRatio||1);
  w=rect.width;h=rect.height;
  layer.style.left=(rect.left-parent.left)+'px';layer.style.top=(rect.top-parent.top)+'px';
  layer.style.width=w+'px';layer.style.height=h+'px';
  layer.width=Math.max(1,Math.round(w*scale));layer.height=Math.max(1,Math.round(h*scale));
  ctx.setTransform(scale,0,0,scale,0,0);
  particles=[];current='';
 }
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(resize).observe(game);
 else window.addEventListener('resize',resize);
 resize();
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 function frame(time){
  requestAnimationFrame(frame);
  if(time-last<32)return;
  const dt=Math.min((time-last)/16.67,2);last=time;elapsed+=dt;
  const scene=typeof scenes!=='undefined'?scenes[sceneIndex]?.id:null;
  const active=!reduced?.matches&&!document.hidden&&!host.classList.contains('hidden')&&!window.ayutthayaVisualLoading?.()&&themes[scene];
  if(!active){ctx.clearRect(0,0,w,h);current='';return;}
  const theme=themes[scene];
  if(scene!==current){
   current=scene;particles=Array.from({length:Math.min(theme.count,Math.max(8,Math.floor(w*h/23000)))},()=>make(theme));
  }
  ctx.clearRect(0,0,w,h);
  for(const p of particles){
   p.y+=(theme.type==='water'?-0.24:p.speed)*dt;
   p.x+=(theme.wind+Math.sin(elapsed*.018+p.phase)*.22)*dt;
   p.rotation+=p.turn*dt;
   if(p.y>h+12||p.x>w+16||p.y< -18||p.x< -20){Object.assign(p,make(theme,false));if(theme.type==='water')p.y=h+10;}
   const pulse=.7+.3*Math.sin(elapsed*.028+p.phase);
   ctx.globalAlpha=p.opacity*pulse;
   ctx.fillStyle=p.color;
   if(theme.type==='petal'||theme.type==='leaf'){
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rotation);
    ctx.beginPath();ctx.ellipse(0,0,p.r*1.45,p.r*.68,0,0,Math.PI*2);ctx.fill();ctx.restore();
   }else{
    ctx.beginPath();ctx.arc(p.x,p.y,p.r*(theme.type==='spark'?pulse:1),0,Math.PI*2);ctx.fill();
    if(theme.type==='spark'&&p.r>2.2){
     ctx.strokeStyle=p.color;ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(p.x-p.r*2,p.y);ctx.lineTo(p.x+p.r*2,p.y);ctx.moveTo(p.x,p.y-p.r*2);ctx.lineTo(p.x,p.y+p.r*2);ctx.stroke();
    }
   }
  }
  ctx.globalAlpha=1;
 }
 requestAnimationFrame(frame);
})();