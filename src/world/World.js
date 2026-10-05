import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Collision } from './Collision.js';
import { seededRandom } from '../utils/math.js';
import { mat,mesh,bevel,crystal,barrelModel,crateModel,chestModel } from './Art.js';
export class World {
  constructor(game){this.game=game;this.scene=game.renderer.scene;this.assets=game.assets;this.collision=new Collision();this.dynamic=new THREE.Group();this.scene.add(this.dynamic);this.statics=new THREE.Group();this.scene.add(this.statics);this.props=[];this.pickups=[];this.pickupSerial=0;this.labels=[];this.phase=0;this.rng=seededRandom();this.build();}
  terrainHeight(x,z){let h=0.18*Math.sin(z*0.13)+0.12*Math.sin(x*0.3);h+=Math.max(0,Math.abs(x)-15)**2*0.024;h+=Math.max(0,-z-72)*0.025;if(z<-51&&z>-66)h-=2.7*Math.sin((-z-51)/15*Math.PI)**2;return h;}
  height(x,z){if(Math.abs(x)<3.9&&z<-50.5&&z>-66.5)return 0.25;return this.terrainHeight(x,z);}
  groundRay(origin,dir,limit){for(let t=.5;t<limit;t+=1){const x=origin.x+dir.x*t,z=origin.z+dir.z*t;if(origin.y+dir.y*t<=this.height(x,z)){let lo=Math.max(0,t-1),hi=t;for(let i=0;i<6;i++){const m=(lo+hi)/2;if(origin.y+dir.y*m>this.height(origin.x+dir.x*m,origin.z+dir.z*m))lo=m;else hi=m;}return hi;}}return limit;}
  place(name,x,z,scale=1,rotation=0,y=null){const o=this.assets.instance('town/'+name);o.position.set(x,y??this.terrainHeight(x,z),z);o.scale.setScalar(scale);o.rotation.y=rotation;this.statics.add(o);return o;}
  makeGround(){const w=180,d=210,segX=100,segZ=120,g=new THREE.PlaneGeometry(w,d,segX,segZ);g.rotateX(-Math.PI/2);const p=g.attributes.position,color=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i)-45,h=this.terrainHeight(x,z);p.setY(i,h);p.setZ(i,z);const road=Math.abs(x)<3.2 && z>-48 || (Math.abs(x)<3.5&&z<-66&&z>-111);const c=new THREE.Color(road?0xaaa486:0x718d68);const k=0.92+this.rng()*0.14;c.multiplyScalar(k);if(z<-51&&z>-66)c.setHex(0x677e74);color.push(c.r,c.g,c.b);}g.setAttribute('color',new THREE.Float32BufferAttribute(color,3));g.computeVertexNormals();const ground=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));ground.receiveShadow=true;this.statics.add(ground);
    const river=new THREE.Mesh(new THREE.PlaneGeometry(150,10),new THREE.MeshStandardMaterial({color:0x559f9f,roughness:0.2,metalness:0.25,transparent:true,opacity:0.91}));river.rotation.x=-Math.PI/2;river.position.set(0,-0.67,-58.4);this.scene.add(river);this.water=river;
    for(let i=0;i<24;i++){const line=new THREE.Mesh(new THREE.PlaneGeometry(1+this.rng()*3,0.035),new THREE.MeshBasicMaterial({color:0xd8f2df,transparent:true,opacity:0.25}));line.rotation.x=-Math.PI/2;line.position.set((this.rng()-0.5)*75,-0.655,-55-this.rng()*7);this.scene.add(line);this.labels.push({kind:'water',object:line,speed:0.1+this.rng()*0.25});}
  }
  house(x,z,w=6,d=7.5,levels=1,roofColor=0x7d6576){const y=this.terrainHeight(x,z),height=3*levels;this.collision.box(x,z,w+0.4,d+0.4,y-0.5,y+height+2.7);const floor=mesh(bevel(w+0.4,0.35,d+0.4),0x7d8674,this.statics,[x,y+0.03,z]);
    // Tile the CC0 half-timber walls around each footprint.
    for(let level=0;level<levels;level++){
      for(let i=0;i<Math.ceil(d/3);i++)for(const side of [-1,1]){const name=i===1&&side===1?'wall-window-shutters':'wall';this.place(name,x+side*(w/2-1.35),z-d/2+1.5+i*3,3,side===1?0:Math.PI,y+level*3);}
      for(let i=0;i<Math.ceil(w/3);i++)for(const side of [-1,1]){const name=level===0&&i===0&&side===1?'wall-door':'wall-window-stone';this.place(name,x-w/2+1.5+i*3,z+side*(d/2-1.35),3,side===1?-Math.PI/2:Math.PI/2,y+level*3);}
    }
    const shape=new THREE.Shape();shape.moveTo(-w/2-0.45,0);shape.lineTo(0,2.4);shape.lineTo(w/2+0.45,0);shape.lineTo(-w/2-0.45,0);
    const roof=mesh(new THREE.ExtrudeGeometry(shape,{depth:d+0.8,bevelEnabled:true,bevelSegments:1,bevelThickness:0.12,bevelSize:0.12,steps:1}),roofColor,this.statics,[x,y+height,z-d/2-0.4]);
    for(let i=0;i<8;i++){const strip=mesh(bevel(w/2+0.6,0.08,0.08,0.02),0xad978b,this.statics,[x-w/4-0.12,y+height+1.15,z-d/2+i*d/7]);strip.rotation.z=0.6;const s=strip.clone();s.position.x=x+w/4+0.12;s.rotation.z=-0.6;this.statics.add(s);}
    this.place('chimney',x+w/4,z-d/4,2,0,y+height+1.1);this.place('banner-green',x-w/2-0.1,z,2,-Math.PI/2,y+height-2.2);return floor;
  }
  tower(x,z){const y=this.terrainHeight(x,z);const base=mesh(new THREE.CylinderGeometry(4.2,4.8,1,12),0x6b7975,this.statics,[x,y+0.25,z]);base.receiveShadow=true;
    const column=mesh(new THREE.CylinderGeometry(2.5,3.1,10,12,1,true,0,Math.PI*1.52),0x87958a,this.statics,[x,y+5,z]);column.rotation.y=0.7;this.collision.box(x-1.8,z,1.8,4.3,y,y+9);this.collision.box(x+1.8,z-1.5,1.4,3,y,y+9);this.collision.box(x,z-2.2,4.6,1.3,y,y+10);
    for(let i=0;i<12;i++){const a=i/12*Math.PI*2;if(i>8)continue;mesh(bevel(0.85,1.2,0.85,0.04),0x849789,this.statics,[x+Math.sin(a)*2.58,y+10.4,z+Math.cos(a)*2.58]);}
    for(const h of [2,5,8]){const trim=mesh(new THREE.TorusGeometry(2.64,0.16,5,12,Math.PI*1.5),0x586c66,this.statics,[x,y+h,z]);trim.rotation.x=Math.PI/2;trim.rotation.z=-0.7;}
    const altar=mesh(new THREE.CylinderGeometry(0.9,1.2,0.6,6),0x728779,this.statics,[x,y+0.5,z+1.5]);this.altar=altar;
  }
  sign(text,x,z){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#463f32';ctx.fillRect(0,0,512,128);ctx.strokeStyle='#bca77b';ctx.lineWidth=9;ctx.strokeRect(5,5,502,118);ctx.fillStyle='#f6e9c2';ctx.font='bold 27px sans-serif';ctx.textAlign='center';ctx.fillText(text,256,72);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Mesh(new THREE.PlaneGeometry(3,0.75),new THREE.MeshStandardMaterial({map:t,roughness:1,side:THREE.DoubleSide}));const y=this.height(x,z);s.position.set(x,y+1.65,z);this.statics.add(s);mesh(bevel(0.15,1.4,0.15,0.02),0x66553d,this.statics,[x,y+0.7,z]);}
  prop(type,x,z){const o=type==='barrel'?barrelModel():type==='chest'?chestModel():crateModel();const y=this.height(x,z);o.position.set(x,y,z);this.dynamic.add(o);const p={type,object:o,pos:o.position,hp:type==='barrel'?30:50,alive:true,opened:false,collider:this.collision.box(x,z,type==='chest'?1.35:1.2,1.2,y,y+1.3),id:this.props.length};p.collider.owner=p;o.traverse(m=>{if(m.isMesh)m.userData.prop=p;});this.props.push(p);return p;}
  build(){this.makeGround();
    this.house(-11,-24,6,7.5,1,0x617c88);this.house(12,-26,6,7.5,2,0x897970);this.house(-14,-39,6,6,2,0x786e89);this.house(12,-41,6,6,1,0x678178);this.house(-13,-8,5,6,1,0x987f68);
    this.place('fountain-round-detail',6,-33,1.7);this.place('fountain-center',6,-33,1.7);this.collision.box(6,-33,3.2,3.2,-1,1);
    this.place('stall-red',-7,-23,2.2,0.4);this.place('stall-green',9,-18,2.2,-0.4);this.place('cart',-8,-16,2.5,0.3);
    // Bridge deck and actual collision rails, over the sculpted creek bed.
    for(let i=0;i<12;i++)this.place('planks',0,-50.9-i*1.27,7.5,0,-0.2);
    for(const x of [-4.1,4.1]){this.collision.box(x,-58.5,0.2,16,-2,1.5);for(let i=0;i<6;i++)this.place('fence',x,-51.5-i*2.6,2.5,0,0.34);}
    // The wall spans the valley; progress is enforced even if the player walks around it.
    for(const x of [-11.5,11.5]){mesh(bevel(15,3.2,0.65),0x798a79,this.statics,[x,this.height(x,-46)+1.5,-46]);this.collision.box(x,-46,15,0.8,-3,4);}
    const barrier=new THREE.Group();barrier.position.set(0,this.height(0,-46),-46);this.dynamic.add(barrier);for(let i=0;i<7;i++){const board=mesh(bevel(0.48,3.3,0.22,0.03),i%2?0x916746:0xa47952,barrier,[-3+i,1.6,0]);board.rotation.z=(i%2?0.08:-0.1);}
    for(const y of [0.7,2.4])mesh(bevel(7,0.25,0.25,0.02),0x5c493a,barrier,[0,y,0.16]);
    this.barricade={type:'barricade',object:barrier,pos:barrier.position,hp:240,alive:true,collider:this.collision.box(0,-46,7.7,0.7,-4,4),id:'barricade'};this.barricade.collider.owner=this.barricade;barrier.traverse(m=>{if(m.isMesh)m.userData.prop=this.barricade;});this.props.push(this.barricade);
    this.gateLock=this.collision.box(0,-46.25,8,0.3,-10,40);this.gateLock.owner='locked';
    this.keyChest=this.prop('chest',-9,-31);this.prop('chest',18,-73);this.prop('chest',-18,-4);
    for(const [x,z] of [[-2.5,-42],[2.5,-42],[-7,-28],[10,-35],[-12,-74],[10,-89]])this.prop('barrel',x,z);
    for(const [x,z] of [[-5,-19],[6,-23],[-4,-36],[7,-39],[-8,-71],[9,-79],[-12,-98]])this.prop('crate',x,z);
    this.tower(0,-108);this.tower(-24,-82);this.tower(28,-100);
    // Dense scenery is batched into shared meshes after placement.
    for(let n=0;n<175;n++){const x=(this.rng()-0.5)*100,z=14-this.rng()*150;if(Math.abs(x)<19||z<-115)continue;const name=['tree-high','tree-high-round','tree-crooked','tree'][n%4];this.place(name,x,z,2+this.rng()*2.8,this.rng()*6.28);}
    for(let n=0;n<90;n++){const x=(this.rng()-0.5)*88,z=12-this.rng()*140;if(Math.abs(x)<7)continue;this.place(n%3?'rock-small':'rock-large',x,z,0.8+this.rng()*2,this.rng()*6.28);if(Math.abs(x)<24&&n%3===0)this.collision.box(x,z,1.6,1.6,this.height(x,z)-0.5,this.height(x,z)+1);}
    for(let z=3;z>-108;z-=13)for(const x of [-5.5,5.5]){this.place('lantern',x,z,1.8);const spark=mesh(new THREE.SphereGeometry(0.1,6,5),0xffc778,this.scene,[x,this.height(x,z)+2.25,z],[1,1,1],true);}
    for(const [x,z,text] of [[-5,5,'WHISPERING VALLEY'],[6,-17,'NO LOOTING. PROBABLY.'],[-7,-43,'BRIDGE INSPECTED BY GOBLINS'],[9,-73,'BOSS. VERY LARGE EGO.'],[-17,-5,'SECRET? THIS WAY.']])this.sign(text,x,z);
    const rand=this.rng;const grassGeo=new THREE.ConeGeometry(0.18,0.5,3),grass=new THREE.InstancedMesh(grassGeo,mat(0x9ba973),400);const dummy=new THREE.Object3D();for(let i=0;i<400;i++){let x=(rand()-0.5)*90,z=15-rand()*140;if(Math.abs(x)<5)x+=x<0?-8:8;dummy.position.set(x,this.terrainHeight(x,z)+0.15,z);dummy.rotation.set(0,rand()*6.2,(rand()-0.5)*0.2);dummy.scale.set(0.5+rand(),0.5+rand(),0.5+rand());dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);}grass.castShadow=false;this.scene.add(grass);
    for(let i=0;i<17;i++){const x=(i%2?1:-1)*(4+rand()*11),z=3-i*6.1;this.pickup(i%5===0?'health':i%4===0?'ammo':'coin',x,z);}
    this.crystal=crystal(this.dynamic,[0,this.height(0,-106)+1.12,-106],1.15);this.crystal.visible=false;
    this.batch();this.statics.updateMatrixWorld(true);
  }
  batch(){this.statics.updateMatrixWorld(true);const groups=new Map(),meshes=[];this.statics.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material))return;const m=o.material;const key=[m.color?.getHex(),m.map?.image?.src??m.map?.uuid,m.vertexColors,m.transparent,m.side,m.emissive?.getHex()].join(':');if(!groups.has(key))groups.set(key,{material:m,geometries:[]});let geo=o.geometry.clone();if(geo.index)geo=geo.toNonIndexed();if(!geo.attributes.normal)geo.computeVertexNormals();if(!geo.attributes.uv)geo.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count*2),2));if(!m.vertexColors)geo.deleteAttribute('color');geo.applyMatrix4(o.matrixWorld);groups.get(key).geometries.push(geo);meshes.push(o);});
    for(const [key,g] of groups){try{const geo=mergeGeometries(g.geometries,false);if(!geo)continue;const o=new THREE.Mesh(geo,g.material);o.castShadow=!g.material.vertexColors;o.receiveShadow=true;o.name='BatchedEnvironment';this.scene.add(o);for(const a of g.geometries)a.dispose();}catch(e){console.warn('Environment batching skipped',key,e);}}
    for(const o of meshes)o.removeFromParent();
  }
  pickup(type,x,z){const g=new THREE.Group();const color=type==='health'?0xf7a78d:type==='ammo'?0x9fbde2:type==='boost'?0xf9d889:type==='shield'?0xaec8ff:0xffd17c;
    if(type==='coin'){const m=mesh(new THREE.CylinderGeometry(0.24,0.24,0.08,10),color,g,[0,0,0]);m.rotation.x=Math.PI/2;mesh(new THREE.TorusGeometry(0.16,0.02,5,10),0xffe8b2,g,[0,0,0.05]);}
    else if(type==='health'){mesh(new THREE.LatheGeometry([new THREE.Vector2(0,-0.15),new THREE.Vector2(0.22,-0.12),new THREE.Vector2(0.24,0.1),new THREE.Vector2(0.1,0.25),new THREE.Vector2(0.1,0.36)],10),color,g);mesh(new THREE.CylinderGeometry(0.12,0.12,0.1,8),0xd0a778,g,[0,0.4,0]);}
    else crystal(g,[0,-0.25,0],0.55,color);
    g.position.set(x,this.height(x,z)+0.85,z);this.dynamic.add(g);const p={id:this.pickupSerial++,type,object:g,base:g.position.y,phase:this.rng()*6.28,alive:true};this.pickups.push(p);return p;
  }
  damageProp(p,amount,force=false){if(!p.alive||p.type==='chest')return;if(p.type==='barricade'&&this.game.mission.stage<3){this.game.ui.toast('Find the village key first. Goblin building regulations.');return;}p.hp-=amount;if(p.hp>0&&!force)return;p.alive=false;p.object.visible=false;p.collider.active=false;this.game.effects.burst(p.pos,p.type==='barrel'?0xffa25b:0xb59061,p.type==='barrel'?80:30,p.type==='barrel'?10:5,0.75);
    if(p.type==='barrel'){this.game.explosion(p.pos,6.5,95,'barrel');}else{this.game.audio.play('hit');if(p.type==='crate')this.pickup(Math.random()<0.45?'health':'ammo',p.pos.x,p.pos.z);}
  }
  interact(player){let nearest=null,distance=2.7;for(const p of this.props){if(p.type!=='chest'||p.opened)continue;const d=p.pos.distanceTo(player.pos);if(d<distance){nearest=p;distance=d;}}if(nearest)return{label:nearest===this.keyChest?'Open the village key chest':'Open treasure chest',action:()=>{
      if(nearest===this.keyChest&&this.game.mission.stage<2){this.game.ui.toast('Clear the square before opening the key chest.');return;}nearest.opened=true;nearest.object.userData.lid.rotation.x+=0.7;this.game.audio.play('pickup');if(nearest===this.keyChest)this.game.mission.key();else{player.coins+=10;this.game.stats.collectibles+=1;this.game.addScore(250);this.pickup('boost',nearest.pos.x,nearest.pos.z+1);this.pickup('shield',nearest.pos.x+1,nearest.pos.z);this.game.ui.toast('Treasure! +10 coins · damage boost · shield');this.game.save();}}};
    if(this.crystal.visible&&this.game.mission.stage===6&&player.pos.distanceTo(this.crystal.position)<3.5)return{label:'Recover the valley crystal',action:()=>this.game.mission.complete()};return null;
  }
  update(dt){this.phase+=dt;for(const p of this.pickups){if(!p.alive)continue;p.object.rotation.y+=dt*1.5;p.object.position.y=p.base+Math.sin(this.phase*2.2+p.phase)*0.14;if(this.game.state==='playing'&&p.object.position.distanceTo(this.game.player.pos.clone().add(new THREE.Vector3(0,0.7,0)))<1.05){p.alive=false;p.object.visible=false;this.game.player.collect(p.type);}}
    this.crystal.rotation.y+=dt*0.55;for(const label of this.labels){if(label.kind==='water'){label.object.position.x+=dt*label.speed;if(label.object.position.x>40)label.object.position.x=-40;}}
  }
  reset(){for(const p of this.props){p.alive=true;p.hp=p.type==='barricade'?240:p.type==='barrel'?30:50;p.opened=false;p.object.visible=true;p.collider.active=true;if(p.object.userData.lid)p.object.userData.lid.rotation.x=0;}this.gateLock.active=true;this.crystal.visible=false;for(const p of this.pickups){p.alive=false;this.dynamic.remove(p.object);}this.pickups=[];this.pickupSerial=0;for(let i=0;i<17;i++)this.pickup(i%5===0?'health':i%4===0?'ammo':'coin',(i%2?1:-1)*(4+i%5),3-i*6.1);}
}
