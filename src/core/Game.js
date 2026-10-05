import * as THREE from 'three';
import { GAME,WEAPONS } from '../config.js';
import { Renderer } from './Renderer.js';
import { Assets } from './Assets.js';
import { Audio } from './Audio.js';
import { Input } from './Input.js';
import { loadSettings,readJSON,writeJSON } from './Storage.js';
import { Particles } from '../effects/Particles.js';
import { World } from '../world/World.js';
import { Mission } from '../world/Mission.js';
import { Player } from '../player/Player.js';
import { Camera } from '../player/Camera.js';
import { Combat } from '../combat/Combat.js';
import { EnemyManager } from '../enemies/EnemyManager.js';
import { UI } from '../ui/UI.js';
export class Game {
  constructor(){this.state='loading';this.settings=loadSettings();this.stats=this.blankStats();this.saved=readJSON(GAME.saveKey,null);this.best=Math.max(0,Number(this.saved?.best)||0);this.combo=0;this.comboTime=0;this.frames=0;this.fps=0;this.fpsTime=0;this.time=0;this.ready=false;this.ui=new UI(this);this.canvas=document.querySelector('#world');this.audio=new Audio(this.settings);this.input=new Input(this.canvas,()=>{if(this.state==='playing')this.pause();});
    window.addEventListener('beforeunload',()=>{if(this.ready&&this.state==='playing')this.save();});window.addEventListener('game-render-failed',e=>{this.pause();this.ui.fatal(e.detail);});document.addEventListener('keydown',e=>{if(e.code==='Escape'&&this.ui.currentModal){this.ui.closeModal();e.preventDefault();}else if(e.code==='Escape'&&this.state==='playing')this.pause();});
  }
  blankStats(){return{score:0,kills:0,shots:0,hits:0,headshots:0,collectibles:0};}
  async init(){
    if(matchMedia('(pointer: coarse)').matches&&innerWidth<1000){this.state='unsupported';this.ui.show('loading',false);this.ui.show('mobile');return;}
    try{this.renderer=new Renderer(this.canvas,this.settings);this.assets=new Assets((a,b)=>this.ui.loading(a,b));await this.assets.load();this.effects=new Particles(this.renderer.scene,this.settings);this.world=new World(this);this.mission=new Mission(this);this.player=new Player(this);this.camera=new Camera(this);this.combat=new Combat(this);this.enemies=new EnemyManager(this);this.ready=true;this.menu();this.ui.loading(47,47);this.last=performance.now();this.animate(this.last);
      // Instrumentation is read-only for visitors. Test controls are available only with ?qa=1.
      window.chaosLegends={version:'1.0.0',status:()=>this.snapshot()};if(new URLSearchParams(location.search).has('qa'))window.__game=this;
    }catch(error){console.error('Game initialization failed:',error);this.state='error';this.ui.fatal('Critical game assets or WebGL could not load. Check the connection and reload in a desktop browser.');}
  }
  animate(now){requestAnimationFrame(t=>this.animate(t));const raw=(now-this.last)/1000;this.last=now;const dt=Math.min(Math.max(raw,0),0.05);this.time+=dt;this.frames++;this.fpsTime+=raw;if(this.fpsTime>1){this.fps=Math.round(this.frames/this.fpsTime);this.frames=0;this.fpsTime=0;}
    if(this.state==='playing'){
      this.camera.update(dt);this.player.update(dt);this.combat.update(dt);this.enemies.update(dt);this.world.update(dt);this.mission.update(dt);this.effects.update(dt);this.comboTime=Math.max(0,this.comboTime-dt);if(this.comboTime===0)this.combo=0;this.renderer.followLight(this.player.pos);this.ui.update(dt);
    }else if(this.state==='menu'){this.camera.menu(dt,this.time);this.player.anim.update(dt);this.player.pose();for(const enemy of this.enemies.enemies)enemy.anim?.update(dt);this.world.update(dt);this.effects.update(dt);}
    this.audio.update(this.state==='playing');this.renderer.render();this.input.endFrame();
  }
  async start(continuing=false){if(!this.ready)return;const checkpoint=continuing?readJSON(GAME.saveKey,null):null;this.state='starting';this.ui.closeModal();this.world.reset();this.player.reset();this.combat.reset();this.enemies.reset();this.mission.reset();this.effects.clear();this.camera.reset();this.stats=this.blankStats();this.combo=0;this.comboTime=0;this.ui.lastStage=-1;
    if(continuing&&checkpoint&&Number.isInteger(checkpoint.stage)&&checkpoint.stage<7){this.mission.stage=checkpoint.stage;this.mission.elapsed=Number(checkpoint.elapsed)||0;this.stats={...this.blankStats(),...checkpoint.stats};this.player.coins=Number(checkpoint.coins)||0;this.player.health=Math.max(50,Math.min(100,Number(checkpoint.health)||100));
      if(Array.isArray(checkpoint.ammo)&&checkpoint.ammo.length===4)this.combat.ammo=checkpoint.ammo.map(a=>({mag:Math.max(0,Number(a.mag)||0),reserve:Math.max(0,Number(a.reserve)||0)}));
      const dead=new Set(checkpoint.dead||[]);for(const enemy of this.enemies.enemies){if(dead.has(enemy.id)||checkpoint.stage>=2&&enemy.zone==='village'){enemy.alive=false;enemy.state='death';enemy.root.visible=false;}}
      for(const p of this.world.props){if((checkpoint.destroyed||[]).includes(p.id)){p.alive=false;p.object.visible=false;p.collider.active=false;}}
      for(const p of this.world.props)if((checkpoint.opened||[]).includes(p.id))p.opened=true;
      for(const p of this.world.pickups)if((checkpoint.collected||[]).includes(p.id)){p.alive=false;p.object.visible=false;}
      const points=[[0,10],[0,-18],[-6,-30],[-1,-39],[0,-49],[0,-72],[0,-101]];const [x,z]=points[checkpoint.stage]||points[0];this.player.pos.set(x,this.world.height(x,z),z);
      if(checkpoint.stage>=3)this.world.keyChest.opened=true;if(checkpoint.stage>=4){this.world.barricade.alive=false;this.world.barricade.object.visible=false;this.world.barricade.collider.active=false;this.world.gateLock.active=false;}if(checkpoint.stage===6)this.world.crystal.visible=true;
    }
    this.player.root.scale.setScalar(1);this.state='playing';this.input.active=true;this.input.clear();this.audio.muted=false;this.ui.screen('playing');this.ui.weaponChanged(WEAPONS[0]);this.camera.update(0.016);this.save();this.input.lock();try{await this.audio.init();}catch(error){console.warn('Audio is unavailable:',error.message);}this.ui.toast(continuing?'Checkpoint restored. Confidence restored.':'WASD to move · Mouse to look · Left click to fire',4);
  }
  pause(){if(this.state!=='playing')return;this.save();this.state='paused';this.input.active=false;this.input.unlock();this.audio.stop();this.ui.screen('pause');}
  resume(){if(this.state!=='paused')return;this.state='playing';this.input.active=true;this.audio.muted=false;this.audio.apply(this.settings);this.ui.screen('playing');this.input.lock();this.audio.ctx?.resume();}
  menu(){if(this.state==='playing'||this.state==='paused')this.save();this.state='menu';this.input.active=false;this.input.unlock();this.audio.stop();this.ui.screen('menu');if(this.player){this.player.pos.set(8,this.world.height(8,-4),-4);this.player.root.scale.setScalar(1.45);this.player.root.rotation.y=0.35;this.player.anim.locked=0;this.player.anim.play('Idle',false,1,true);this.renderer.followLight(this.player.pos);}}
  die(){if(this.state!=='playing')return;this.state='dead';this.input.active=false;this.input.unlock();this.audio.stop();this.best=Math.max(this.best,this.stats.score);const previous=readJSON(GAME.saveKey,null);if(previous)writeJSON(GAME.saveKey,{...previous,best:this.best});this.ui.result(false);}
  win(){if(this.state!=='playing')return;this.state='won';this.input.active=false;this.input.unlock();this.best=Math.max(this.best,this.stats.score);this.save();this.ui.result(true);this.audio.muted=false;this.audio.play('objective');}
  addScore(amount){this.stats.score+=Math.round(amount);}
  explosion(position,radius,damage,source){this.effects.burst(position,0xffc776,85,11,0.85);this.effects.ring(position,0xffc387,radius,0.45);this.audio.play('explosion');this.camera.shake=Math.max(this.camera.shake,0.3);
    let hit=false;for(const enemy of this.enemies.enemies){if(!enemy.alive)continue;const center=enemy.pos.clone().add(new THREE.Vector3(0,enemy.height*.4,0)),d=center.distanceTo(position);if(d<radius){hit=true;const force=center.clone().sub(position).normalize().multiplyScalar(11*(1-d/radius));enemy.hurt(damage*(1-d/radius*.6),force,false,source);}}if(source==='player'&&hit){this.stats.hits++;this.ui.hit(false);}
    if(source!=='player'&&this.player.pos.clone().add(new THREE.Vector3(0,1,0)).distanceTo(position)<radius)this.player.hurt(Math.min(damage*0.45,32));
    for(const p of this.world.props)if(p.alive&&p.pos.distanceTo(position)<radius)this.world.damageProp(p,damage*(p.type==='barrel'?1:0.7));
  }
  applySettings(){writeJSON(GAME.settingsKey,this.settings);this.renderer?.apply(this.settings);this.audio.apply(this.settings);if(this.effects)this.effects.settings=this.settings;}
  save(){if(!this.ready||!this.mission)return;const value={version:1,stage:this.mission.stage,elapsed:this.mission.elapsed,stats:{...this.stats},coins:this.player.coins,health:this.player.health,ammo:this.combat.ammo.map(a=>({...a})),dead:this.enemies.enemies.filter(e=>!e.alive).map(e=>e.id),destroyed:this.world.props.filter(p=>!p.alive).map(p=>p.id),opened:this.world.props.filter(p=>p.opened).map(p=>p.id),collected:this.world.pickups.filter(p=>!p.alive).map(p=>p.id),best:this.best,unlockedWeapons:[0,1,2,3]};writeJSON(GAME.saveKey,value);this.saved=value;}
  canContinue(){const s=readJSON(GAME.saveKey,null);return !!s&&s.version===1&&Number.isInteger(s.stage)&&s.stage>=0&&s.stage<7;}
  snapshot(){return{ready:this.ready,state:this.state,stage:this.mission?.stage,elapsed:this.mission?.elapsed,health:this.player?.health,position:this.player?.pos.toArray(),ammo:this.combat?.ammo,weapon:this.combat?.index,stats:{...this.stats},enemies:this.enemies?.enemies.filter(e=>e.alive).length,models:this.assets?.models.size,fps:this.fps,drawCalls:this.renderer?.webgl.info.render.calls,triangles:this.renderer?.webgl.info.render.triangles};}
}
