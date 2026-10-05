import * as THREE from 'three';
import { Animations } from './Animations.js';
import { weaponModel,mat,mesh,bevel } from '../world/Art.js';
import { angleDamp,damp,clamp } from '../utils/math.js';
import { GAME,WEAPONS } from '../config.js';
import { playerClips,poseArms } from './Pose.js';
export class Player {
  constructor(game){this.game=game;const c=game.assets.character('Ranger',2.12);this.root=c.group;this.model=c.model;this.clips=playerClips(c.model,c.clips);this.pos=this.root.position;this.vel=new THREE.Vector3();this.forward=new THREE.Vector3(0,0,-1);this.health=100;this.coins=0;this.grounded=true;this.facing=Math.PI;this.root.rotation.y=this.facing;this.anim=new Animations(this.model,this.clips);this.model.getObjectByName('Ranger_Bow').visible=false;
    this.weaponRig=new THREE.Group();this.weaponRig.position.set(0.43,1.21,0.31);this.root.add(this.weaponRig);this.weaponMeshes=WEAPONS.map((w,i)=>{const m=weaponModel(i);this.weaponRig.add(m);m.visible=i===0;return m;});
    // Original brass goggles, scarf clasp and overconfident hero crest.
    const head=this.model.getObjectByName('Head');if(head){this.root.updateWorldMatrix(true,true);const crest=new THREE.Group();crest.scale.setScalar(1/c.scale);crest.position.copy(head.worldToLocal(this.root.localToWorld(new THREE.Vector3(0,1.82,0.47))));crest.quaternion.copy(head.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(this.root.getWorldQuaternion(new THREE.Quaternion())));for(const x of [-0.078,0.078]){mesh(new THREE.TorusGeometry(0.07,0.012,5,12),0xdab77e,crest,[x,0.025,0.024]);mesh(new THREE.SphereGeometry(0.045,10,8),0xfff0cc,crest,[x,0.025,0.027],[1,1.15,.3]);mesh(new THREE.SphereGeometry(0.023,8,6),0x20333a,crest,[x+.007,0.025,0.043],[1,1,.35]);const brow=mesh(bevel(.105,.023,.025,.008),0x614536,crest,[x,.125,.008]);brow.rotation.z=x<0?-.16:.16;}head.add(crest);}
    game.renderer.scene.add(this.root);this.reset();
  }
  reset(){this.pos.set(0,this.game.world.height(0,10),10);this.vel.set(0,0,0);this.health=GAME.maxHealth;this.coins=0;this.grounded=true;this.invulnerable=0;this.dash=0;this.shock=0;this.dashTime=0;this.boost=0;this.shield=0;this.meleeTimer=0;this.step=0;this.idle=0;this.root.rotation.y=Math.PI;this.root.rotation.z=0;this.root.visible=true;this.anim.locked=0;this.anim.play('Idle',false,1,true);}
  pose(){poseArms(this);}
  update(dt){const input=this.game.input,cam=this.game.camera;this.invulnerable=Math.max(0,this.invulnerable-dt);this.dash=Math.max(0,this.dash-dt);this.shock=Math.max(0,this.shock-dt);this.dashTime=Math.max(0,this.dashTime-dt);this.boost=Math.max(0,this.boost-dt);this.shield=Math.max(0,this.shield-dt);this.meleeTimer=Math.max(0,this.meleeTimer-dt);this.anim.update(dt);
    const move=new THREE.Vector3((input.down('KeyD')?1:0)-(input.down('KeyA')?1:0),0,(input.down('KeyS')?1:0)-(input.down('KeyW')?1:0));if(move.lengthSq()>0)move.normalize();move.applyAxisAngle(new THREE.Vector3(0,1,0),cam.yaw);
    const crouch=input.down('KeyC')||input.down('ControlLeft'),sprint=input.down('ShiftLeft')&&!input.mouse.aim&&!crouch;
    const speed=crouch?2:input.mouse.aim?3.2:sprint?7.6:4.6;
    if(this.dashTime>0){this.vel.x=this.forward.x*24;this.vel.z=this.forward.z*24;}else{this.vel.x=damp(this.vel.x,move.x*speed,move.lengthSq()?15:11,dt);this.vel.z=damp(this.vel.z,move.z*speed,move.lengthSq()?15:11,dt);}
    if(input.once('Space')&&this.grounded){this.vel.y=7.4;this.grounded=false;this.game.audio.play('jump');this.anim.play('Jump',true,1,true);}
    this.vel.y-=20*dt;const oldY=this.pos.y;this.pos.addScaledVector(this.vel,dt);this.game.world.collision.resolve(this.pos,0.38,crouch?1.35:2);
    const floor=this.game.world.height(this.pos.x,this.pos.z);if(this.pos.y<=floor){if(!this.grounded&&this.vel.y<-4){this.game.audio.play('land');this.anim.play('Land',true,1,true);this.game.effects.burst(this.pos,0xccbf98,8,2,0.4);}this.pos.y=floor;this.vel.y=0;this.grounded=true;}else if(this.pos.y-floor>0.16)this.grounded=false;
    // The locked gate is also a checkpoint boundary, so there is no progression exploit around the wall.
    if(this.game.mission.stage<4&&this.pos.z<-45.1){this.pos.z=-45.1;this.vel.z=0;}
    if(this.pos.y<-0.95&&this.pos.z<-51&&this.pos.z>-66){this.hurt(14);this.pos.set(0,this.game.world.height(0,-50),-50);this.vel.set(0,0,0);this.game.ui.toast('A tactical swim. Return to the bridge.');}
    const moving=Math.hypot(this.vel.x,this.vel.z)>0.2;
    if(input.mouse.aim||input.mouse.fire){const target=cam.yaw+Math.PI;this.root.rotation.y=angleDamp(this.root.rotation.y,target,18,dt);this.forward.set(-Math.sin(cam.yaw),0,-Math.cos(cam.yaw));}
    else if(moving){const target=Math.atan2(move.x,move.z);this.root.rotation.y=angleDamp(this.root.rotation.y,target,13,dt);this.forward.copy(move);}
    if(this.meleeTimer===0&&this.game.combat.reloadTimer===0){if(!this.grounded)this.anim.play(this.vel.y>0?'Jump':'Fall',false,1);else if(moving)this.anim.play(sprint?['Run_Holding','Run']:['Run_Holding','Walk','Run'],false,sprint?1.15:crouch?0.6:0.78);else this.anim.play(input.mouse.aim?'Aim':['Idle','Idle_Weapon']);}
    this.model.scale.y=this.game.assets.characterScale??this.model.scale.x;this.model.scale.y*=crouch?0.73:1;
    this.weaponRig.rotation.x=damp(this.weaponRig.rotation.x,-cam.pitch*0.72,12,dt);this.weaponRig.position.y=damp(this.weaponRig.position.y,crouch?0.88:input.mouse.aim?1.42:1.25,14,dt);this.weaponRig.rotation.z=this.game.combat.reloadTimer>0?Math.sin(this.game.combat.reloadTimer*5)*0.18:0;poseArms(this);
    this.step+=dt;if(moving&&this.grounded&&this.step>(sprint?0.29:0.42)){this.game.audio.play('step');this.step=0;}
    if(input.once('KeyQ'))this.arcaneDash();if(input.once('KeyE'))this.shockwave();if(input.once('KeyV'))this.melee();
    this.idle=moving?0:this.idle+dt;if(this.idle>10){this.idle=0;this.anim.play('PickUp',true);this.game.ui.quip('Hero: “I am waiting heroically.”');}
  }
  arcaneDash(){if(this.dash>0)return;this.dash=4;this.dashTime=0.22;this.invulnerable=0.35;this.forward.set(-Math.sin(this.game.camera.yaw),0,-Math.cos(this.game.camera.yaw));this.game.effects.burst(this.pos.clone().add(new THREE.Vector3(0,1,0)),0x80edd3,40,5,0.8);this.game.audio.play('dash');this.game.camera.shake=0.08;this.anim.play('Roll',true,1.8,true);}
  shockwave(){if(this.shock>0)return;this.shock=9;this.game.effects.ring(this.pos,0x8bcde7,8.5,0.6);this.game.effects.burst(this.pos,0xa0e8da,55,9,0.7);for(const enemy of this.game.enemies.enemies){const d=enemy.pos.distanceTo(this.pos);if(enemy.alive&&d<8.5){const knock=enemy.pos.clone().sub(this.pos).normalize().multiplyScalar(12);enemy.hurt(58,knock,false,'shockwave');}}this.game.audio.play('shock');this.game.camera.shake=0.18;this.anim.play(['Punch','Bow_Shoot','PickUp'],true,1.4,true);}
  melee(){if(this.meleeTimer>0)return;this.meleeTimer=0.6;this.anim.play('Punch',true,1.5,true);for(const enemy of this.game.enemies.enemies){if(!enemy.alive)continue;const delta=enemy.pos.clone().sub(this.pos);if(delta.length()<3.1&&delta.normalize().dot(this.forward)>0.1){enemy.hurt(74,delta.multiplyScalar(10),false,'melee');this.game.effects.burst(enemy.pos.clone().add(new THREE.Vector3(0,1,0)),0xffda90,22,5,0.4);}}this.game.audio.play('shock');}
  hurt(amount){if(this.invulnerable>0||this.game.state!=='playing')return;this.health=Math.max(0,this.health-amount*(this.shield>0?0.45:1));this.invulnerable=0.55;this.game.audio.play('damage');this.game.camera.shake=0.17;this.game.ui.damage();if(this.health<=0){this.anim.play('Death',true,1,true);this.game.die();}}
  collect(type){this.game.audio.play('pickup');this.game.effects.burst(this.pos.clone().add(new THREE.Vector3(0,0.7,0)),0xffd886,12,3,0.5);this.game.stats.collectibles++;if(type==='health'){this.health=clamp(this.health+32,0,100);this.game.ui.toast('+32 health');}else if(type==='ammo'){for(let i=0;i<4;i++)this.game.combat.ammo[i].reserve+=Math.ceil(WEAPONS[i].mag*2);this.game.ui.toast('All weapons replenished');}else if(type==='boost'){this.boost=18;this.game.ui.toast('Double damage · 18 seconds');}else if(type==='shield'){this.shield=18;this.game.ui.toast('Arcane shield · 18 seconds');}else{this.coins++;this.game.addScore(25);}this.game.save();}
}
