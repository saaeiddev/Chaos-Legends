import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
const materials=new Map();
export function mat(color,emissive=false){const key=color+'-'+emissive;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:0.72,metalness:emissive?0.16:0.08,emissive:emissive?color:0x000000,emissiveIntensity:emissive?1.5:0}));return materials.get(key);}
export function mesh(geo,color,parent,pos=[0,0,0],scale=[1,1,1],emissive=false){const m=new THREE.Mesh(geo,mat(color,emissive));m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;if(parent)parent.add(m);return m;}
export function bevel(w,h,d,r=0.08){return new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3));}
export function batchRigid(group){const buckets=new Map();for(const o of [...group.children]){if(!o.isMesh||o===group.userData.flash||Array.isArray(o.material))continue;if(!buckets.has(o.material))buckets.set(o.material,[]);buckets.get(o.material).push(o);}for(const [material,parts] of buckets){if(parts.length<2)continue;const geos=parts.map(o=>{o.updateMatrix();let geo=o.geometry.clone();if(geo.index)geo=geo.toNonIndexed();if(!geo.attributes.uv)geo.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count*2),2));return geo.applyMatrix4(o.matrix);});const merged=mergeGeometries(geos,false);if(merged){for(const o of parts){o.removeFromParent();o.geometry.dispose();}const m=new THREE.Mesh(merged,material);m.castShadow=true;m.receiveShadow=true;group.add(m);}for(const geo of geos)geo.dispose();}return group;}
export function crystal(parent,pos,scale=1,color=0x8af2cc){const geo=new THREE.LatheGeometry([new THREE.Vector2(0,0),new THREE.Vector2(0.24,0.25),new THREE.Vector2(0.2,0.85),new THREE.Vector2(0,1.18)],6);const m=mesh(geo,color,parent,pos,[scale,scale,scale],true);return m;}
export function weaponModel(index){
  const g=new THREE.Group(),colors=[0x6ef2c2,0xffb75f,0xb6a2ff,0xffd979],c=colors[index];
  // Custom hard-surface silhouettes with rounded receivers, brass collars and crystal chambers.
  const receiver=mesh(bevel(0.22,0.3,0.58),0x293d46,g,[0,0,0]);
  mesh(bevel(0.09,0.15,0.28,0.025),0xb89b6a,g,[0,0.12,0]);
  const barrelCount=index===1?2:1;
  for(let i=0;i<barrelCount;i++){const b=mesh(new THREE.CylinderGeometry(index===3?0.15:0.075,index===3?0.15:0.075,index===2?0.9:0.54,10,1,true),0x334b53,g,[(i-(barrelCount-1)/2)*0.14,0.07,index===2?0.54:0.4]);b.rotation.x=Math.PI/2;
    const ring=mesh(new THREE.TorusGeometry(index===3?0.15:0.078,0.02,6,12),0xd1ad74,g,[b.position.x,0.07,index===2?0.99:0.69]);
    mesh(new THREE.CylinderGeometry(index===3?0.09:0.04,index===3?0.09:0.04,0.03,10),c,g,[b.position.x,0.07,index===2?0.99:0.695],[1,1,1],true).rotation.x=Math.PI/2;
    ring.rotation.z=0;
  }
  const handle=mesh(bevel(0.13,0.32,0.15,0.025),0x7b5340,g,[0,-0.25,-0.1]);handle.rotation.x=-0.25;
  mesh(bevel(0.2,0.15,0.32),0x6f5546,g,[0,-0.05,-0.4]);
  crystal(g,[0,0.1,-0.15],0.22,c).rotation.x=Math.PI/2;
  if(index===2){mesh(new THREE.CylinderGeometry(0.075,0.075,0.28,12),0x20373e,g,[0,0.29,0.02]).rotation.x=Math.PI/2;mesh(new THREE.CircleGeometry(0.055,12),c,g,[0,0.29,0.163],[1,1,1],true);}
  if(index===3){const chicken=chickenModel(false);chicken.scale.setScalar(0.22);chicken.position.set(0,0.1,-0.4);g.add(chicken);}
  const flash=mesh(new THREE.IcosahedronGeometry(0.14,0),c,g,[0,0.08,index===2?1.05:0.76],[1,1,1],true);flash.visible=false;flash.castShadow=false;g.userData.flash=flash;g.userData.tip=new THREE.Vector3(0,0.08,index===2?1.1:0.8);return batchRigid(g);
}
export function chickenModel(wizard=true){
  const g=new THREE.Group();g.name='WizardChicken';
  const body=mesh(new THREE.LatheGeometry([new THREE.Vector2(0,-0.34),new THREE.Vector2(0.2,-0.32),new THREE.Vector2(0.39,-0.1),new THREE.Vector2(0.43,0.22),new THREE.Vector2(0.26,0.4),new THREE.Vector2(0,0.42)],12),0xf3e6c8,g,[0,0.45,0],[1,1,1.3]);
  const head=mesh(new THREE.SphereGeometry(0.27,12,10),0xfff0d0,g,[0,0.91,0.26],[1,1.15,1]);
  mesh(new THREE.ConeGeometry(0.13,0.26,4),0xf5a744,g,[0,0.85,0.56],[1,1,1]).rotation.x=Math.PI/2;
  for(const s of [-1,1]){
    mesh(new THREE.SphereGeometry(0.086,10,8),0xffffff,g,[s*0.17,1,0.445]);mesh(new THREE.SphereGeometry(0.045,8,6),0x1a2730,g,[s*0.17,1.0,0.512]);
    const wing=new THREE.Group();wing.position.set(s*0.33,0.58,0);g.add(wing);
    const shape=new THREE.Shape();shape.moveTo(0,0);shape.bezierCurveTo(s*0.35,0.08,s*0.5,-0.13,s*0.49,-0.42);shape.lineTo(s*0.33,-0.36);shape.lineTo(s*0.23,-0.47);shape.lineTo(s*0.08,-0.4);shape.lineTo(0,0);
    const feather=mesh(new THREE.ExtrudeGeometry(shape,{depth:0.12,bevelEnabled:true,bevelSize:0.018,bevelThickness:0.015,bevelSegments:1,steps:1,curveSegments:5}),0xdbcda9,wing,[0,0,-0.06]);feather.rotation.x=-0.12;
    wing.name=s===1?'Wing.R':'Wing.L';
    const leg=mesh(new THREE.CylinderGeometry(0.025,0.033,0.22,6),0xf0a24d,g,[s*0.13,0.05,0.08]);mesh(bevel(0.16,0.055,0.22,0.025),0xf0a24d,g,[s*0.13,-0.08,0.14]);
  }
  for(let n=0;n<3;n++)mesh(new THREE.SphereGeometry(0.08,8,6),0xdb5952,g,[0,1.16+n*0.015,0.22-n*0.12],[1,1.3,1]);
  mesh(new THREE.ConeGeometry(0.18,0.4,5),0xd5c7a2,g,[0,0.53,-0.49]).rotation.x=-1.1;
  if(wizard){mesh(new THREE.CylinderGeometry(0.43,0.43,0.06,12),0x6556a3,g,[0,1.22,0.2]);const hat=mesh(new THREE.ConeGeometry(0.28,0.73,10),0x7464b4,g,[0,1.58,0.2]);hat.rotation.z=-0.18;mesh(new THREE.TorusGeometry(0.245,0.036,6,12),0xd9b876,g,[0,1.29,0.2]).rotation.x=Math.PI/2;crystal(g,[0.05,1.82,0.2],0.16,0xb59cff);}
  g.userData.wings=[g.getObjectByName('Wing.L'),g.getObjectByName('Wing.R')];return batchRigid(g);
}
export function mushroomCap(){const g=new THREE.Group();mesh(new THREE.LatheGeometry([new THREE.Vector2(0,0.1),new THREE.Vector2(0.83,0.1),new THREE.Vector2(0.94,0.2),new THREE.Vector2(0.83,0.47),new THREE.Vector2(0.53,0.73),new THREE.Vector2(0,0.86)],14),0xc45648,g);for(let i=0;i<8;i++){const a=i*2.4,r=0.37+0.16*(i%3);mesh(new THREE.SphereGeometry(0.1+0.025*(i%2),8,5),0xffe9c3,g,[Math.cos(a)*r,0.7-r*0.37,Math.sin(a)*r],[1,0.3,1]);}return g;}
export function barrelModel(){const g=new THREE.Group();mesh(new THREE.LatheGeometry([new THREE.Vector2(0.38,0),new THREE.Vector2(0.43,0.1),new THREE.Vector2(0.48,0.6),new THREE.Vector2(0.43,1.1),new THREE.Vector2(0.38,1.2)],12),0xa74e3c,g);for(const y of [0.12,0.59,1.08])mesh(new THREE.TorusGeometry(y===0.59?0.48:0.43,0.038,5,12),0x493f37,g,[0,y,0]).rotation.x=Math.PI/2;mesh(new THREE.CylinderGeometry(0.38,0.38,0.04,12),0xbe7650,g,[0,1.2,0]);crystal(g,[0,1.21,0],0.26,0xff8055);return batchRigid(g);}
export function crateModel(){const g=new THREE.Group();mesh(bevel(1.16,1.14,1.16,0.05),0x916e4b,g,[0,0.58,0]);for(const y of [0.1,1.05])mesh(bevel(1.28,0.12,1.28,0.02),0x584c3b,g,[0,y,0]);for(const z of [-0.595,0.595]){const plank=mesh(bevel(0.14,1.3,0.07,0.025),0xb48b58,g,[0,0.58,z]);plank.rotation.z=-0.7;}return batchRigid(g);}
export function chestModel(){const g=new THREE.Group();mesh(bevel(1.3,0.75,0.83),0x796244,g,[0,0.4,0]);const lid=mesh(new THREE.CylinderGeometry(0.44,0.44,1.3,10,1,false,0,Math.PI),0xb09153,g,[0,0.78,0]);lid.rotation.z=Math.PI/2;lid.rotation.y=Math.PI/2;for(const x of [-0.48,0.48])mesh(bevel(0.08,0.91,0.92,0.035),0xcfb36a,g,[x,0.53,0]);mesh(bevel(0.18,0.22,0.045,0.015),0xe3c573,g,[0,0.68,0.45]);g.userData.lid=lid;return g;}
