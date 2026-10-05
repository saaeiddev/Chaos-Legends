import * as THREE from 'three';
import { WEAPONS } from '../config.js';
import { chickenModel } from '../world/Art.js';
export function raySphere(origin,dir,center,radius){const dx=origin.x-center.x,dy=origin.y-center.y,dz=origin.z-center.z,b=dx*dir.x+dy*dir.y+dz*dir.z,c=dx*dx+dy*dy+dz*dz-radius*radius,disc=b*b-c;if(disc<0)return Infinity;const t=-b-Math.sqrt(disc);return t>=0?t:Infinity;}
export class Combat {
  constructor(game){this.game=game;this.index=0;this.cooldown=0;this.reloadTimer=0;this.ammo=WEAPONS.map(w=>({mag:w.mag,reserve:w.reserve}));this.ray=new THREE.Raycaster();this.projectiles=[];this.tracers=[];this.tracerPool=[];this.flashTime=0;}
  reset(){this.index=0;this.cooldown=0;this.reloadTimer=0;this.ammo=WEAPONS.map(w=>({mag:w.mag,reserve:w.reserve}));this.switch(0);for(const p of this.projectiles)this.game.renderer.scene.remove(p.object);this.projectiles=[];for(const t of this.tracers){t.line.visible=false;this.tracerPool.push(t.line);}this.tracers=[];}
  switch(index){if(index<0||index>3||index===this.index&&this.game.player.weaponMeshes[index].visible)return;this.index=index;this.reloadTimer=0;this.cooldown=0.15;this.game.player.weaponMeshes.forEach((m,i)=>m.visible=i===index);this.game.audio.play('ui');this.game.ui.weaponChanged(WEAPONS[index]);}
  reload(){const a=this.ammo[this.index],w=WEAPONS[this.index];if(this.reloadTimer>0||a.mag>=w.mag||a.reserve<=0)return;this.reloadTimer=w.reload;this.game.audio.play('reload');this.game.player.anim.play('Reload',true,1.1,true);}
  update(dt){this.cooldown=Math.max(0,this.cooldown-dt);this.flashTime=Math.max(0,this.flashTime-dt);for(const m of this.game.player.weaponMeshes)m.userData.flash.visible=this.flashTime>0&&m.visible;
    if(this.reloadTimer>0){this.reloadTimer-=dt;if(this.reloadTimer<=0){this.reloadTimer=0;const a=this.ammo[this.index],amount=Math.min(WEAPONS[this.index].mag-a.mag,a.reserve);a.mag+=amount;a.reserve-=amount;this.game.audio.play('reload');}}
    const input=this.game.input;for(let i=0;i<4;i++)if(input.once('Digit'+(i+1)))this.switch(i);if(input.once('KeyR'))this.reload();if(input.mouse.fire&&this.cooldown===0&&this.reloadTimer===0&&this.game.player.meleeTimer===0)this.shoot();
    for(let i=this.projectiles.length-1;i>=0;i--){const p=this.projectiles[i];p.life-=dt;p.object.position.addScaledVector(p.vel,dt);p.vel.y-=3.1*dt;p.object.rotation.y=Math.atan2(p.vel.x,p.vel.z);p.object.rotation.x=-Math.atan2(p.vel.y,Math.hypot(p.vel.x,p.vel.z));p.phase+=dt*22;p.object.userData.wings?.forEach((w,n)=>w.rotation.z=Math.sin(p.phase)*(n?1:-1)*0.6);
      let hit=p.life<=0||p.object.position.y<this.game.world.height(p.object.position.x,p.object.position.z)+0.35;
      if(!hit)hit=this.game.world.collision.ray(p.object.position,p.vel.clone().normalize(),0.6)<0.6;
      if(!hit)hit=this.game.enemies.enemies.some(e=>e.alive&&e.pos.clone().add(new THREE.Vector3(0,e.height*0.45,0)).distanceTo(p.object.position)<e.radius+0.4);
      this.game.effects.burst(p.object.position,0xffdf95,1,0.3,0.2);if(hit){this.game.explosion(p.object.position,7,WEAPONS[3].damage*(this.game.player.boost>0?2:1),'player');this.game.renderer.scene.remove(p.object);this.projectiles.splice(i,1);}}
    for(let i=this.tracers.length-1;i>=0;i--){const t=this.tracers[i];t.life-=dt;t.line.material.opacity=Math.max(0,t.life/0.09)*0.85;if(t.life<=0){t.line.visible=false;this.tracerPool.push(t.line);this.tracers.splice(i,1);}}
  }
  shoot(){const g=this.game,w=WEAPONS[this.index],a=this.ammo[this.index];if(a.mag<=0){this.reload();if(a.reserve<=0)this.cooldown=0.2;return;}a.mag--;this.cooldown=w.rate;g.stats.shots++;this.flashTime=0.05;g.audio.play(this.index===3?'chicken':'shot',this.index);g.camera.shake=Math.max(g.camera.shake,this.index===1?0.13:this.index===2?0.09:0.035);g.camera.pitch-=this.index===1?0.02:0.005;
    const gun=g.player.weaponMeshes[this.index],muzzle=gun.localToWorld(gun.userData.tip.clone());
    this.ray.setFromCamera(new THREE.Vector2(0,0),g.renderer.camera);const origin=this.ray.ray.origin.clone(),dir=this.ray.ray.direction.clone();
    if(this.index===3){const o=chickenModel(false);o.scale.setScalar(0.52);o.position.copy(muzzle);g.renderer.scene.add(o);const target=origin.clone().addScaledVector(dir,40);const vel=target.sub(muzzle).normalize().multiplyScalar(24);vel.y+=1.8;this.projectiles.push({object:o,vel,life:2.9,phase:0});return;}
    let landed=false;
    for(let pellet=0;pellet<w.pellets;pellet++){
      const spread=w.spread*(g.input.mouse.aim?0.25:1);const direction=dir.clone().add(new THREE.Vector3((Math.random()-0.5)*spread,(Math.random()-0.5)*spread,(Math.random()-0.5)*spread)).normalize();
      let dist=w.range,hit=null,head=false;const wallDistance=g.world.collision.ray(origin,direction,w.range,b=>!b.owner||typeof b.owner==='string'||b.owner.type==='chest');dist=Math.min(wallDistance,g.world.groundRay(origin,direction,w.range));
      // Prop meshes have their real silhouette; the collision slabs are used for occlusion.
      const propMeshes=g.world.props.filter(p=>p.alive&&p.type!=='chest').flatMap(p=>{const list=[];p.object.traverse(m=>{if(m.isMesh)list.push(m);});return list;});this.ray.set(origin,direction);const propHits=this.ray.intersectObjects(propMeshes,false);if(propHits.length&&propHits[0].distance<=dist+0.2){hit=propHits[0].object.userData.prop;dist=propHits[0].distance;}
      for(const e of g.enemies.enemies){if(!e.alive)continue;const headPos=e.headPosition();const h=raySphere(origin,direction,headPos,e.type==='boss'?0.72:e.type==='chicken'?0.25:0.27*e.height/2);const b=raySphere(origin,direction,e.pos.clone().add(new THREE.Vector3(0,e.height*0.46,0)),e.radius);const d=Math.min(h,b);if(d<dist){dist=d;hit=e;head=h<=b;}}
      const end=origin.clone().addScaledVector(direction,dist);this.tracer(muzzle,end,w.color);g.effects.burst(end,hit?w.color:0xc3c8ab,hit?8:4,2.2,0.24);
      if(hit){if(hit.hurt){const damage=w.damage*(head?1.9:1)*(g.player.boost>0?2:1);hit.hurt(damage,direction.clone().multiplyScalar(this.index===1?7:2.4),head,'bullet');g.ui.hit(head);if(head)g.audio.play('headshot');else g.audio.play('hit');landed=true;}else g.world.damageProp(hit,w.damage);}
    }
    if(landed)g.stats.hits++;
  }
  tracer(start,end,color){let line=this.tracerPool.pop();if(!line){line=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color,transparent:true,opacity:0.8,depthWrite:false}));this.game.renderer.scene.add(line);}line.geometry.setFromPoints([start,end]);line.material.color.setHex(color);line.material.opacity=0.85;line.visible=true;this.tracers.push({line,life:0.09});}
}
