import * as THREE from 'three';
import './style.css';

const $ = (id) => document.getElementById(id);
const canvas = $('church');
let scene, camera, renderer;
let entered = false, praying = false, yaw = 0, pitch = -.035;
let audio, audioGain, soundOn = false;
let previousPosition;
const keys = new Set(), touchMoves = new Set(), targets = [], flames = [], obstacles = [];
const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
let toastTimer;
function toast(message) { $('toast').textContent = message; $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3500); }
function enter() { entered = true; $('welcome').hidden = true; $('exploring').hidden = false; $('touch-controls').hidden = !matchMedia('(pointer: coarse)').matches; canvas.focus(); }
$('enter').onclick = enter;
function startPrayer(pew) {
  if (!entered) enter();
  if (praying) return;
  praying = true; previousPosition = camera?.position.clone();
  if (camera) { camera.position.set(pew?.position.x ?? -3, 1.45, (pew?.position.z ?? 3) + .25); yaw = 0; pitch = 0; }
  keys.clear(); touchMoves.clear(); document.body.classList.add('praying'); $('prayer').hidden = false;
  setTimeout(() => $('prayer-text').focus(), 100);
}
function exitPrayer() { praying = false; $('prayer-text').value = ''; $('prayer').hidden = true; document.body.classList.remove('praying'); if (camera && previousPosition) camera.position.copy(previousPosition); canvas.focus(); }
$('pray').onclick = () => startPrayer(); $('fallback-pray').onclick = () => startPrayer(); $('exit-prayer').onclick = exitPrayer;
const help = $('help-dialog'); $('help').onclick = () => { keys.clear(); touchMoves.clear(); help.showModal(); };
help.querySelectorAll('.close').forEach(button => button.onclick = () => help.close());
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && praying) exitPrayer();
  if (event.target instanceof HTMLTextAreaElement || help.open || !entered || praying) return;
  if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code)) { event.preventDefault(); keys.add(event.code); }
});
window.addEventListener('keyup', event => keys.delete(event.code));
function clearInput() { keys.clear(); touchMoves.clear(); drag = null; }
window.addEventListener('blur', clearInput);
document.addEventListener('visibilitychange', () => { clearInput(); if (audio) { if (document.hidden) audio.suspend(); else if (soundOn) audio.resume(); } });
$('sound').onclick = async () => {
  try {
    if (!audio) {
      audio = new AudioContext(); audioGain = audio.createGain(); audioGain.gain.value = 0; audioGain.connect(audio.destination);
      [130.81,196,261.63,329.63].forEach((frequency, i) => { const oscillator = audio.createOscillator(), gain = audio.createGain(); oscillator.type = 'sine'; oscillator.frequency.value = frequency; oscillator.detune.value = i * 1.2; gain.gain.value = .025 / (i+1); oscillator.connect(gain).connect(audioGain); oscillator.start(); });
    }
    await audio.resume(); soundOn = !soundOn; audioGain.gain.setTargetAtTime(soundOn ? 1 : 0, audio.currentTime, .5);
    $('sound').setAttribute('aria-pressed', String(soundOn)); $('sound').setAttribute('aria-label', `Turn ambient sound ${soundOn ? 'off' : 'on'}`); $('sound').querySelector('span').textContent = `Sound ${soundOn ? 'on' : 'off'}`;
  } catch { toast('Ambient sound is unavailable in this browser.'); }
};
for (const button of document.querySelectorAll('[data-move]')) {
  button.addEventListener('pointerdown', event => { event.preventDefault(); button.setPointerCapture(event.pointerId); touchMoves.add(button.dataset.move); });
  for (const name of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(name, () => touchMoves.delete(button.dataset.move));
}
let drag = null;
canvas.addEventListener('pointerdown', event => { if (!entered || praying || help.open) return; canvas.focus(); drag = { id:event.pointerId, x:event.clientX, y:event.clientY, distance:0 }; canvas.setPointerCapture(event.pointerId); });
canvas.addEventListener('pointermove', event => { if (!drag || event.pointerId !== drag.id) return; const dx = event.clientX-drag.x, dy = event.clientY-drag.y; drag.distance += Math.abs(dx)+Math.abs(dy); yaw -= dx*.003; pitch = THREE.MathUtils.clamp(pitch-dy*.003,-.85,.85); drag.x=event.clientX; drag.y=event.clientY; });
canvas.addEventListener('pointerup', event => { if (!drag) return; const click = drag.distance < 8; drag = null; if (click) interact(event.clientX,event.clientY); });
canvas.addEventListener('pointercancel', () => { drag=null; });
function interact(x,y) {
  pointer.set(x/innerWidth*2-1,-y/innerHeight*2+1); ray.setFromCamera(pointer,camera);
  const hit = ray.intersectObjects(targets,true)[0]; if (!hit) return;
  let object=hit.object; while (object && !object.userData.action) object=object.parent;
  if (object?.userData.action==='candle') lightCandle(object); else if(object?.userData.action==='pew') startPrayer(object);
}
function lightCandle(candle) {
  if (candle.userData.lit) { toast('This candle is already carrying a prayer.'); return; }
  candle.userData.lit=true; candle.userData.flame.visible=true; toast('A little light. A quiet prayer.');
}
$('candle').onclick = () => { const next=targets.find(o=>o.userData.action==='candle'&&!o.userData.lit); if(next) lightCandle(next); else toast('Every candle is alight. May you find peace here.'); };

try { init(); } catch (error) { console.error(error); $('fallback').hidden=false; $('welcome').hidden=true; }
function init() {
  renderer = new THREE.WebGLRenderer({canvas,antialias:devicePixelRatio<2,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.setSize(innerWidth,innerHeight); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
  scene=new THREE.Scene(); scene.background=new THREE.Color('#a49a7b'); scene.fog=new THREE.FogExp2('#9c987d',.022);
  camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,65); camera.position.set(0,1.7,10.5); camera.rotation.order='YXZ';
  scene.add(new THREE.HemisphereLight('#f9e6bd','#645e4c',2.1));
  const sun=new THREE.DirectionalLight('#ffdf9f',3.5); sun.position.set(-5,8,-7); scene.add(sun);
  const fill=new THREE.PointLight('#ffd295',22,16,2); fill.position.set(0,5,-8); scene.add(fill);
  const stone=new THREE.MeshStandardMaterial({color:'#b6a88c',roughness:.93});
  const trim=new THREE.MeshStandardMaterial({color:'#d1c3a1',roughness:.9});
  const dark=new THREE.MeshStandardMaterial({color:'#433827',roughness:.85});
  const wood=new THREE.MeshStandardMaterial({color:'#765337',roughness:.78,map:woodTexture()});
  const gold=new THREE.MeshStandardMaterial({color:'#b49a5e',metalness:.65,roughness:.35});
  const cloth=new THREE.MeshStandardMaterial({color:'#e5ddc4',roughness:1});
  const boxGeometry=new THREE.BoxGeometry(1,1,1);
  function box(w,h,d,x,y,z,material=stone,parent=scene) { const m=new THREE.Mesh(boxGeometry,material);m.scale.set(w,h,d);m.position.set(x,y,z);parent.add(m);return m; }
  // A tiled nave with a clear central aisle.
  box(14,.3,29,0,-.16,0,stone);
  const tiles=[0xb9ad92,0xafa38a,0xc3b69a,0xb2a68d].map(color=>new THREE.MeshStandardMaterial({color,roughness:1}));
  const tileGeometry=new THREE.BoxGeometry(1.95,.025,1.95);
  const tileMesh=new THREE.InstancedMesh(tileGeometry,tiles[0],7*14); const matrix=new THREE.Matrix4();let index=0;
  for(let x=-6;x<=6;x+=2)for(let z=-13;z<=13;z+=2){matrix.makeTranslation(x,.005,z);tileMesh.setMatrixAt(index,matrix);tileMesh.setColorAt(index,new THREE.Color(tiles[(x+z+28)%4].color));index++;}scene.add(tileMesh);
  box(1.8,.025,20,0,.035,2,new THREE.MeshStandardMaterial({color:'#716c53',roughness:1}));
  box(.04,.03,20,-.86,.052,2,gold);box(.04,.03,20,.86,.052,2,gold);
  // Side walls are built around real window openings.
  for(const side of [-1,1]) {
    box(.45,2,29,side*7,1,0);box(.45,1.5,29,side*7,7.25,0);
    for(const z of [-13,-7,-1,5,11,14])box(.5,5,1.1,side*7,4.5,z);
    for(const z of [-10,-4,2,8]) {
      box(.5,5,2.6,side*7,4.5,z+2.1);
      const window=new THREE.Group(); window.position.set(side*6.97,3.8,z);window.rotation.y=side*Math.PI/2;scene.add(window); stainedWindow(window,1.45,3.3);
      box(.8,.18,2.1,side*6.85,2.1,z,trim);
      // Colored patches imply sunlight without expensive real-time shadows.
      const patch=new THREE.Mesh(new THREE.PlaneGeometry(2,4),new THREE.MeshBasicMaterial({color:side<0?'#e8b96e':'#7fadb1',transparent:true,opacity:.16,depthWrite:false}));patch.rotation.x=-Math.PI/2;patch.rotation.z=.6*side;patch.position.set(side*3.9,.065,z+1);scene.add(patch);
    }
    for(const z of [-12,-6,0,6,12]) {
      box(.65,6.4,.65,side*6.45,3.2,z,trim);box(.95,.22,.95,side*6.45,.2,z,trim);box(.95,.25,.95,side*6.45,6.3,z,trim);
      // Arched timber ribs across the sanctuary.
      const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-6.4,6.4,z),new THREE.Vector3(-4,8.5,z),new THREE.Vector3(0,10,z),new THREE.Vector3(4,8.5,z),new THREE.Vector3(6.4,6.4,z)]);
      if(side===-1)scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve,20,.095,5,false),wood));
    }
  }
  box(14,10,.5,0,5,-14);box(14,9,.5,0,4.5,14.5);
  for(const side of [-1,1]){const roof=box(8.5,.25,29,side*3.5,8.6,0,dark);roof.rotation.z=-side*.43;}
  for(const x of [-5,-2.5,0,2.5,5])box(.12,.14,29,x,10-Math.abs(x)*.43,0,wood);
  // Apse, raised altar, and a luminous cross.
  box(10,.2,5,0,.1,-11,trim);box(8,.2,3.9,0,.3,-11.5,trim);
  box(4,.95,1.3,0,.95,-10.5,stone);box(4.5,.14,1.65,0,1.5,-10.5,trim);box(4.55,.05,1.7,0,1.59,-10.5,cloth);box(2,.9,.025,0,1.12,-9.64,cloth);
  const crossMat=new THREE.MeshStandardMaterial({color:'#c6a468',metalness:.45,roughness:.4,emissive:'#9b6822',emissiveIntensity:.2});
  box(.25,3.6,.24,0,4.5,-13.55,crossMat);box(2.1,.24,.24,0,5.1,-13.5,crossMat);
  const halo=new THREE.Mesh(new THREE.RingGeometry(1.6,1.63,48),gold);halo.position.set(0,4.9,-13.6);scene.add(halo);
  const rose=new THREE.Group();rose.position.set(0,7.8,-13.65);scene.add(rose);
  for(let i=0;i<12;i++){const petal=new THREE.Mesh(new THREE.CircleGeometry(.53,6),new THREE.MeshStandardMaterial({color:['#d4a05a','#74988d','#9f6962'][i%3],emissive:['#d4a05a','#74988d','#9f6962'][i%3],emissiveIntensity:.7,side:THREE.DoubleSide}));const a=i*Math.PI/6;petal.position.set(Math.cos(a)*.9,Math.sin(a)*.9,0);rose.add(petal);}rose.add(new THREE.Mesh(new THREE.TorusGeometry(1.5,.12,6,32),trim));
  for(const side of [-1,1])for(let row=0;row<6;row++) {
    const pew=new THREE.Group();pew.position.set(side*3.6,0,-5+row*2.5);pew.userData.action='pew';scene.add(pew);targets.push(pew);
    box(3.9,.16,.8,0,.58,0,wood,pew);box(3.9,.8,.14,0,1.03,.4,wood,pew);
    for(const x of [-1.8,1.8]) {box(.16,.62,.7,x,.3,0,wood,pew);box(.18,.9,1,x,.75,0,wood,pew);box(.24,.12,1.04,x,1.2,0,wood,pew);}
    obstacles.push({x:side*3.6,z:pew.position.z,w:2.15,d:.7});
  }
  // Votive candles with individual interactive flames.
  for(const side of [-1,1]) {
    box(1.5,1,.85,side*4.7,.5,-8,wood);box(1.8,.13,1,side*4.7,1.08,-8,gold);
    for(let i=0;i<6;i++)createCandle(side*4.7+(i%3-1)*.42,1.15,-8+(Math.floor(i/3)-.5)*.4,i===0);
  }
  createCandle(-1.7,1.64,-10.5,true);createCandle(1.7,1.64,-10.5,true);
  function createCandle(x,y,z,lit) {
    const candle=new THREE.Group();candle.position.set(x,y,z);candle.userData.action='candle';scene.add(candle);targets.push(candle);
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.105,.12,.36,10),cloth);body.position.y=.18;candle.add(body);
    const wick=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.09,4),dark);wick.position.y=.39;candle.add(wick);
    const flame=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),new THREE.MeshBasicMaterial({color:'#ffcf72'}));flame.position.y=.47;flame.scale.y=1.9;candle.add(flame);candle.userData.flame=flame;candle.userData.lit=lit;flame.visible=lit;flames.push(flame);
    const hit=new THREE.Mesh(new THREE.BoxGeometry(.32,.7,.32),new THREE.MeshBasicMaterial({visible:false}));hit.position.y=.3;candle.add(hit);
  }
  // Gentle shafts of warm light, no shadow maps or postprocessing.
  for(const z of [-9,-3,3,9]) {
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([-6.8,5.7,z-0.6,-6.8,5.7,z+.6,1,.1,z+5.4, -6.8,5.7,z-.6,1,.1,z+5.4,-2,.1,z+5.4],3));
    scene.add(new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:'#ffe3a1',transparent:true,opacity:.065,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending})));
  }
  const dustGeometry=new THREE.BufferGeometry(), positions=[];let seed=51;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};for(let i=0;i<100;i++)positions.push((random()-.5)*12,random()*7, (random()-.5)*25);
  dustGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));scene.add(new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:'#ffdf99',size:.025,transparent:true,opacity:.45})));
  let last=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.setAnimationLoop(time=>{ if(document.hidden)return;const dt=Math.min((time-last)/1000,.05);last=time;
    if(entered&&!praying&&!help.open){const forward=Number(keys.has('KeyW')||keys.has('ArrowUp')||touchMoves.has('forward'))-Number(keys.has('KeyS')||keys.has('ArrowDown')||touchMoves.has('back'));const side=Number(keys.has('KeyD')||keys.has('ArrowRight')||touchMoves.has('right'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')||touchMoves.has('left'));const length=Math.hypot(forward,side)||1;const speed=2.5*dt/length;const dx=(side*Math.cos(yaw)-forward*Math.sin(yaw))*speed,dz=(-forward*Math.cos(yaw)-side*Math.sin(yaw))*speed;
      const canMove=(x,z)=>Math.abs(x)<6.1&&z>-8.9&&z<13&&!obstacles.some(o=>Math.abs(x-o.x)<o.w&&Math.abs(z-o.z)<o.d);
      if(canMove(camera.position.x+dx,camera.position.z))camera.position.x+=dx;if(canMove(camera.position.x,camera.position.z+dz))camera.position.z+=dz;
    }
    camera.rotation.set(pitch,yaw,0);if(!reduced)flames.forEach((flame,i)=>{if(flame.visible)flame.scale.y=1.8+Math.sin(time*.005+i)*.18;});renderer.render(scene,camera);
  });
  window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
}
function woodTexture() {
  const c=document.createElement('canvas');c.width=64;c.height=128;const context=c.getContext('2d');context.fillStyle='#bfa587';context.fillRect(0,0,64,128);for(let i=0;i<32;i++){context.strokeStyle=`rgba(65,38,17,${.04+(i%4)*.025})`;context.beginPath();context.moveTo(i*2,0);context.bezierCurveTo(i*2+3,40,i*2-3,80,i*2,128);context.stroke();}const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function stainedWindow(group,width,height) {
  const colors=['#aa7550','#728f91','#c2a967','#788e74','#ac7770','#7c94a5'];
  for(let row=0;row<6;row++)for(let col=0;col<3;col++) {
    const color=colors[(row+col*2)%colors.length];const pane=new THREE.Mesh(new THREE.PlaneGeometry(width/3-.035,height/6-.035),new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.65,side:THREE.DoubleSide,roughness:.4}));pane.position.set((col-1)*width/3,(row-2.5)*height/6,0);group.add(pane);
  }
  const frame=new THREE.MeshStandardMaterial({color:'#504837',roughness:.8});
  for(const x of [-width/2,width/2, -width/6,width/6]){const bar=new THREE.Mesh(new THREE.BoxGeometry(.045,height,.06),frame);bar.position.x=x;group.add(bar);}
  for(let r=0;r<=6;r++){const bar=new THREE.Mesh(new THREE.BoxGeometry(width,.035,.06),frame);bar.position.y=-height/2+r*height/6;group.add(bar);}
  const arch=new THREE.Mesh(new THREE.TorusGeometry(width/2,.065,6,20,Math.PI),frame);arch.position.y=height/2;group.add(arch);
}
