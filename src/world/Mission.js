import * as THREE from 'three';
import { OBJECTIVES } from '../config.js';
export class Mission {
  constructor(game){this.game=game;this.stage=0;this.elapsed=0;const geo=new THREE.OctahedronGeometry(0.25,0);this.marker=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xffdb96,transparent:true,opacity:0.9,depthTest:false}));game.renderer.scene.add(this.marker);}
  reset(){this.stage=0;this.elapsed=0;this.marker.visible=true;this.game.world.gateLock.active=true;}
  next(){this.stage++;this.game.audio.play('objective');const o=OBJECTIVES[this.stage];if(o)this.game.ui.toast(o.title,3);this.game.save();}
  key(){if(this.stage!==2)return;this.next();this.game.ui.quip('Hero: “A key. My lifelong training has prepared me for this.”');}
  bossDefeated(){if(this.stage===5){this.next();this.game.world.crystal.visible=true;this.game.world.pickup('health',0,-98);}}
  update(dt){this.elapsed+=dt;const p=this.game.player.pos;if(this.stage===0&&p.z<-17){this.next();this.game.ui.quip('Goblin: “The reservation was for eight, not a hero!”');}else if(this.stage===1&&this.game.enemies.villageAlive===0)this.next();else if(this.stage===3&&!this.game.world.barricade.alive){this.game.world.gateLock.active=false;this.next();}else if(this.stage===4&&p.z<-69){this.next();this.game.ui.quip('Grand Gobbler: “Who authorized the dramatic entrance?”');}
    const o=OBJECTIVES[this.stage];if(o){this.marker.position.set(o.pos[0],this.game.world.height(o.pos[0],o.pos[2])+3.5+Math.sin(this.elapsed*2)*0.25,o.pos[2]);this.marker.rotation.y+=dt*1.1;}this.game.ui.objective(this.stage,this.game.enemies.villageAlive);
  }
  complete(){if(this.stage!==6)return;this.stage=7;this.marker.visible=false;this.game.world.crystal.visible=false;this.game.addScore(2000+Math.max(0,600-Math.floor(this.elapsed)));this.game.audio.play('objective');this.game.win();}
}
