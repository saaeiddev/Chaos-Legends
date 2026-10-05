import * as THREE from 'three';
import { Animations } from '../player/Animations.js';
import { chickenModel,mushroomCap,mesh,crystal,mat } from '../world/Art.js';
import { angleDamp } from '../utils/math.js';
const TYPES={
  grunt:{model:'Rogue',height:1.6,hp:72,speed:2.6,radius:0.48,damage:10,range:1.7,reward:100,tint:0x97c8a3},
  archer:{model:'Ranger',height:1.8,hp:84,speed:2.15,radius:0.52,damage:9,range:19,reward:150,tint:0xb2d2a0},
  orc:{model:'Warrior',height:2.65,hp:220,speed:1.55,radius:0.8,damage:21,range:2.4,reward:280,tint:0xa7b69e},
  mushroom:{model:'Slime',height:1.35,hp:42,speed:3.7,radius:0.53,damage:25,range:2.3,reward:125,tint:0xe4ab82},
  chicken:{model:null,height:1.5,hp:75,speed:2.7,radius:0.48,damage:8,range:23,reward:175,tint:0xfff0b7},
  boss:{model:'Warrior',height:4.3,hp:1500,speed:1.3,radius:1.3,damage:27,range:4,reward:1600,tint:0xc3a2ac},
};
export class Enemy {
  constructor(manager,type,x,z,zone){this.manager=manager;this.game=manager.game;this.type=type;Object.assign(this,TYPES[type]);this.maxHp=this.hp;this.zone=zone;this.id=manager.nextId++;this.alive=true;this.state='idle';this.timer=0;this.attack=1+Math.random();this.hurtTimer=0;this.deathTime=0;this.knock=new THREE.Vector3();this.spawn=new THREE.Vector3(x,this.game.world.height(x,z),z);this.phase=Math.random()*6.28;this.reposition=0;this.shield=false;
    if(type==='chicken'){this.root=chickenModel();this.root.scale.setScalar(1.15);this.anim=null;this.model=this.root;}else{const c=this.game.assets.character(this.model,this.height);this.root=c.group;this.model=c.model;this.anim=new Animations(c.model,c.clips);this.root.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.color.multiply(new THREE.Color(this.tint));}});}
    if(type==='mushroom'){const cap=mushroomCap();cap.position.y=1.06;cap.scale.setScalar(0.67);this.root.add(cap);}
    if(type==='boss'){const crown=new THREE.Group();crown.position.y=3.95;for(let i=0;i<6;i++){const a=i/6*Math.PI*2;crystal(crown,[Math.cos(a)*0.38,0,Math.sin(a)*0.38],0.5,0xf2c575);}this.root.add(crown);const bubble=new THREE.Mesh(new THREE.SphereGeometry(2.35,16,12),new THREE.MeshBasicMaterial({color:0xbaa3ed,wireframe:true,transparent:true,opacity:0.12,depthWrite:false}));bubble.position.y=2;this.root.add(bubble);this.bubble=bubble;}
    this.pos=this.root.position;this.pos.copy(this.spawn);this.root.visible=zone==='village';this.game.renderer.scene.add(this.root);
    this.healthBar=this.makeHealthBar();this.root.add(this.healthBar);this.healthBar.position.y=this.height+0.32;this.healthBar.visible=false;this.head=this.model.getObjectByName('Head');
  }
  makeHealthBar(){const g=new THREE.Group();const back=new THREE.Mesh(new THREE.PlaneGeometry(0.95,0.07),new THREE.MeshBasicMaterial({color:0x283c37,depthTest:false}));g.add(back);const fill=new THREE.Mesh(new THREE.PlaneGeometry(0.9,0.035),new THREE.MeshBasicMaterial({color:this.type==='boss'?0xf5d890:0xf4b597,depthTest:false}));fill.position.z=0.005;g.add(fill);g.userData.fill=fill;return g;}
  headPosition(){if(this.type==='mushroom')return this.pos.clone().add(new THREE.Vector3(0,1.34,0));if(this.head){this.head.updateWorldMatrix(true,false);const p=new THREE.Vector3();this.head.getWorldPosition(p);p.y+=this.height*.11;return p;}return this.pos.clone().add(new THREE.Vector3(0,this.type==='chicken'?1.1:this.height*0.86,0));}
  update(dt){this.phase+=dt;this.anim?.update(dt);if(!this.alive){this.deathTime+=dt;this.root.rotation.z=Math.sin(this.deathTime*5)*0.15;if(this.deathTime>1.4){this.root.position.y-=dt*1.3;if(this.deathTime>2.5)this.root.visible=false;}return;}
    const g=this.game,p=g.player;this.hurtTimer=Math.max(0,this.hurtTimer-dt);this.attack=Math.max(0,this.attack-dt);this.timer+=dt;this.pos.addScaledVector(this.knock,dt);this.knock.multiplyScalar(Math.exp(-6*dt));g.world.collision.resolve(this.pos,this.radius,this.height);const ground=g.world.height(this.pos.x,this.pos.z);this.pos.y=ground+(this.type==='chicken'?2.2+Math.sin(this.phase*2.3)*0.4:0);
    this.healthBar.lookAt(g.renderer.camera.position);this.healthBar.userData.fill.scale.x=Math.max(0,this.hp/this.maxHp);this.healthBar.userData.fill.position.x=-(1-this.hp/this.maxHp)*0.45;this.healthBar.visible=this.hp<this.maxHp&&this.pos.distanceTo(p.pos)<23&&this.type!=='boss';
    if(this.type==='chicken')this.root.userData.wings?.forEach((w,i)=>w.rotation.z=Math.sin(this.phase*13)*0.65*(i?1:-1));
    const delta=p.pos.clone().sub(this.pos);delta.y=0;const dist=delta.length();const active=this.zone==='village'?g.mission.stage>=1:this.zone==='bridge'?g.mission.stage>=4:g.mission.stage>=5;
    this.root.visible=(active||this.zone==='village')&&dist<60;
    if(!active||dist>32){this.state='patrol';this.anim?.play('Walk',false,0.5);const target=this.spawn.clone().add(new THREE.Vector3(Math.sin(this.phase*.4)*1.2,0,Math.cos(this.phase*.4)*1.2));const d=target.sub(this.pos);d.y=0;if(d.length()>0.1){d.normalize();this.pos.addScaledVector(d,dt*0.5);this.root.rotation.y=angleDamp(this.root.rotation.y,Math.atan2(d.x,d.z),4,dt);}return;}
    if(this.hurtTimer>0){this.state='hurt';return;}
    if(this.type==='boss'){this.boss(dt,dist,delta);return;}
    this.root.rotation.y=angleDamp(this.root.rotation.y,Math.atan2(delta.x,delta.z),8,dt);
    const ranged=this.type==='archer'||this.type==='chicken';
    if(this.type==='mushroom'&&dist<2.3){this.state='attack';this.timer=0;this.detonate();return;}
    const from=this.pos.clone().add(new THREE.Vector3(0,ranged?this.height*0.75:1,0)),to=p.pos.clone().add(new THREE.Vector3(0,1.2,0));const line=g.world.collision.lineClear(from,to);
    if(dist<this.range&&line){this.state='attack';if(this.attack===0){this.attack=ranged?2.15:this.type==='orc'?1.75:1.2;this.anim?.play(ranged?['Bow_Shoot','Spell1','Punch']:['Dagger_Attack','Sword_Attack','Punch','Attack'],true,1.2,true);if(ranged)this.manager.projectile(from,to,this.damage,this.type==='chicken'?0xb9a3f1:0xffcd91,this.id);else if(p.grounded||dist<1.1)p.hurt(this.damage);
      g.audio.play(this.type==='chicken'?'chicken':'enemy');if(Math.random()<0.1&&this.type==='grunt')g.ui.quip('Goblin: “This was supposed to be a picnic!”');}
      if(ranged&&dist<7){this.move(delta.normalize().multiplyScalar(-1),dt,0.9);this.state='reposition';}else if(ranged){const side=new THREE.Vector3(-delta.z,0,delta.x).normalize().multiplyScalar(Math.sin(this.phase*0.5)>0?1:-1);this.move(side,dt,0.34);}else if(this.attack>0.7)this.anim?.play('Idle_Attacking');
    }else{this.state=line?'chase':'reposition';delta.normalize();if(!line){const side=new THREE.Vector3(-delta.z,0,delta.x);delta.addScaledVector(side,Math.sin(this.phase*0.6)>0?0.9:-0.9).normalize();}this.move(delta,dt);this.anim?.play(['Run','Running_A','Walk'],false,0.85);}
  }
  move(direction,dt,mult=1){const before=this.pos.clone();this.pos.addScaledVector(direction,this.speed*dt*mult);this.game.world.collision.resolve(this.pos,this.radius,this.height);if(this.pos.distanceTo(before)<0.015&&mult>0.5){this.pos.x+=Math.sin(this.phase)*dt;this.pos.z+=Math.cos(this.phase)*dt;this.game.world.collision.resolve(this.pos,this.radius,this.height);}}
  boss(dt,dist,delta){const g=this.game;this.shield=this.timer%8<2;this.bubble.visible=this.shield;this.bubble.rotation.y+=dt*0.4;this.state=this.shield?'shield':'chase';this.root.rotation.y=angleDamp(this.root.rotation.y,Math.atan2(delta.x,delta.z),5,dt);
    if(this.attack===0){this.attack=this.hp<this.maxHp*.5?2.6:3.5;if(dist<8){this.state='shockwave';this.anim.play('Sword_Attack2',true,0.9,true);g.effects.ring(this.pos,0xe5ad86,10,0.7);g.audio.play('boss');this.manager.waves.push({origin:this.pos.clone(),radius:0,life:0.85,hit:false});g.ui.quip('Grand Gobbler: “I demand a more flattering boss bar!”');}else{this.anim.play('Sword_Attack',true,1,true);const from=this.pos.clone().add(new THREE.Vector3(0,2.8,0)),to=g.player.pos.clone().add(new THREE.Vector3(0,1.1,0));for(const offset of [-1,0,1])this.manager.projectile(from,to.clone().add(new THREE.Vector3(offset*2.4,0,0)),this.damage,0xf0b675,this.id);}
      if(this.hp<this.maxHp*.45&&this.manager.enemies.filter(e=>e.alive&&e.type==='mushroom').length<2){this.manager.spawn('mushroom',this.pos.x-3,this.pos.z+3,'boss');this.manager.spawn('mushroom',this.pos.x+3,this.pos.z+3,'boss');}}
    if(dist>3.5){this.move(delta.normalize(),dt,this.shield?0.55:1);this.anim.play(['Run_Weapon','Run','Walk'],false,0.7);}else if(this.attack>1.8){g.player.hurt(12);}
  }
  detonate(){if(!this.alive)return;const pos=this.pos.clone().add(new THREE.Vector3(0,0.7,0));this.die(false);this.game.explosion(pos,4.2,26,'enemy');}
  hurt(amount,knock,headshot=false,source='bullet'){if(!this.alive)return;if(this.type==='boss'&&this.shield){amount*=0.18;this.game.ui.toast('Arcane shield active · wait for the glow to fade',1.2);}this.hp-=amount;this.hurtTimer=0.18;if(knock)this.knock.addScaledVector(knock,this.type==='boss'?0.1:this.type==='orc'?0.35:1);this.anim?.play(['RecieveHit','RecieveHit_2','Dragon_Hit'],true,1.5,true);this.game.ui.floating(Math.round(amount),this.headPosition(),headshot);if(headshot){this.game.stats.headshots++;this.game.addScore(20);}if(this.hp<=0)this.die(true,headshot);}
  die(reward=true,headshot=false){if(!this.alive)return;this.alive=false;this.state='death';this.healthBar.visible=false;this.anim?.play(['Death','Death_A'],true,1,true);this.game.effects.burst(this.pos.clone().add(new THREE.Vector3(0,0.8,0)),0xb4e0a3,30,5,0.7);this.game.audio.play('kill');if(reward){this.game.stats.kills++;this.game.addScore(this.reward);this.game.combo++;this.game.comboTime=3.5;if(this.game.combo>1)this.game.addScore(Math.min(5,this.game.combo)*15);if(this.type==='boss')this.game.mission.bossDefeated();else if(Math.random()<0.23)this.game.world.pickup(this.game.player.health<65?'health':'ammo',this.pos.x,this.pos.z);}if(this.type==='chicken'){this.root.rotation.x=1.3;}this.game.ui.kill(this.type,headshot);}
  dispose(){this.game.renderer.scene.remove(this.root);this.anim?.dispose();this.root.traverse(o=>{if(o.isMesh&&o.material&&o.material!==mat(0)){/* Materials are shared with cached models except character tint copies. */}});}
}
