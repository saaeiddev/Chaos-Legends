import * as THREE from 'three';
import { Enemy } from './Enemy.js';
const SPAWNS=[
 ['grunt',-3,-22,'village'],['grunt',3,-26,'village'],['archer',8,-27,'village'],['grunt',-5,-34,'village'],['mushroom',1,-34,'village'],['orc',2,-38,'village'],['archer',-7,-39,'village'],['chicken',7,-36,'village'],
 ['grunt',-5,-70,'bridge'],['archer',5,-74,'bridge'],['orc',-7,-80,'bridge'],['mushroom',2,-75,'bridge'],['mushroom',-2,-78,'bridge'],['chicken',9,-79,'bridge'],['grunt',-9,-85,'bridge'],['archer',6,-85,'bridge'],
 ['boss',0,-96,'boss'],['archer',-8,-99,'boss'],['grunt',6,-101,'boss'],['chicken',-7,-105,'boss'],
];
export class EnemyManager {
  constructor(game){this.game=game;this.enemies=[];this.projectiles=[];this.pool=[];this.waves=[];this.nextId=0;this.reset();}
  spawn(type,x,z,zone){const e=new Enemy(this,type,x,z,zone);this.enemies.push(e);return e;}
  reset(){for(const e of this.enemies)e.dispose();this.enemies=[];for(const p of this.projectiles){p.mesh.visible=false;this.pool.push(p.mesh);}this.projectiles=[];this.waves=[];this.nextId=0;for(const spec of SPAWNS)this.spawn(...spec);}
  projectile(from,to,damage,color,owner){let m=this.pool.pop();if(!m){m=new THREE.Mesh(new THREE.IcosahedronGeometry(0.14,1),new THREE.MeshBasicMaterial({color}));this.game.renderer.scene.add(m);}m.material.color.setHex(color);m.visible=true;m.position.copy(from);const vel=to.clone().sub(from).normalize().multiplyScalar(11);this.projectiles.push({mesh:m,vel,damage,life:4,owner});}
  update(dt){for(const e of this.enemies)e.update(dt);
    // Separation keeps melee enemies readable instead of stacking in one silhouette.
    const alive=this.enemies.filter(e=>e.alive&&e.type!=='chicken');for(let i=0;i<alive.length;i++)for(let j=i+1;j<alive.length;j++){const a=alive[i],b=alive[j],dx=a.pos.x-b.pos.x,dz=a.pos.z-b.pos.z,d=Math.hypot(dx,dz),r=a.radius+b.radius;if(d<r&&d>0.01){const k=(r-d)*0.2/d;a.pos.x+=dx*k;a.pos.z+=dz*k;b.pos.x-=dx*k;b.pos.z-=dz*k;}}
    const g=this.game;for(let i=this.projectiles.length-1;i>=0;i--){const p=this.projectiles[i];p.life-=dt;p.mesh.position.addScaledVector(p.vel,dt);let hit=p.life<=0||p.mesh.position.y<g.world.height(p.mesh.position.x,p.mesh.position.z)||g.world.collision.ray(p.mesh.position,p.vel.clone().normalize(),0.2)<0.2;
      const playerCenter=g.player.pos.clone().add(new THREE.Vector3(0,1,0));if(p.mesh.position.distanceTo(playerCenter)<0.65){g.player.hurt(p.damage);hit=true;}
      if(!hit)for(const e of this.enemies){if(!e.alive||e.id===p.owner)continue;if(e.pos.clone().add(new THREE.Vector3(0,e.height*.5,0)).distanceTo(p.mesh.position)<e.radius*.75){e.hurt(p.damage*.7,p.vel.clone().multiplyScalar(0.1),false,'friendly-fire');hit=true;g.ui.quip('Goblin: “Friendly fire is still very unfriendly!”');break;}}
      if(hit){g.effects.burst(p.mesh.position,0xe8bd92,6,1.5,0.3);p.mesh.visible=false;this.pool.push(p.mesh);this.projectiles.splice(i,1);}}
    for(let i=this.waves.length-1;i>=0;i--){const w=this.waves[i];w.life-=dt;w.radius+=dt*13;const d=Math.hypot(g.player.pos.x-w.origin.x,g.player.pos.z-w.origin.z);if(!w.hit&&Math.abs(d-w.radius)<0.8&&g.player.grounded){g.player.hurt(28);w.hit=true;}if(w.life<=0)this.waves.splice(i,1);}
  }
  get boss(){return this.enemies.find(e=>e.type==='boss');}
  get villageAlive(){return this.enemies.filter(e=>e.zone==='village'&&e.alive).length;}
}
