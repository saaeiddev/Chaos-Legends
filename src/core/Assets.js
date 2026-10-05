import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
export const TOWN_ASSETS=['wall','wall-window-shutters','wall-window-stone','wall-door','wall-corner','wall-wood','wall-wood-detail-cross','roof','roof-gable','roof-gable-end','roof-gable-top','roof-high','roof-high-point','pillar-stone','pillar-wood','fountain-round-detail','fountain-center','tree','tree-high','tree-high-round','tree-crooked','rock-large','rock-small','rock-wide','lantern','fence','fence-broken','fence-gate','planks','stall-red','stall-green','cart','chimney','banner-red','banner-green','wall-arch','wall-broken','stairs-stone'];
export class Assets {
  constructor(onProgress){this.models=new Map();this.onProgress=onProgress;this.manager=new THREE.LoadingManager();this.loader=new GLTFLoader(this.manager);}
  async load(){
    const paths=[...TOWN_ASSETS.map(x=>['town/'+x,`town/${x}.glb`]),...['Ranger','Warrior','Rogue','Slime'].map(x=>['char/'+x,`characters/${x}.glb`])];
    const total=paths.length;let done=0;const workers=Array.from({length:4},async()=>{while(paths.length){const [key,path]=paths.shift();const model=await this.loader.loadAsync(`${import.meta.env.BASE_URL}assets/${path}`);model.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=true;if(o.material){o.material.roughness=Math.max(o.material.roughness??0.8,0.65);}}});this.models.set(key,model);this.onProgress(++done,total);}});
    await Promise.all(workers);
  }
  get(key){const asset=this.models.get(key);if(!asset)throw new Error('Missing model: '+key);return asset;}
  instance(key){return clone(this.get(key).scene);}
  character(key,height=2.1){const asset=this.get('char/'+key);const model=clone(asset.scene);const box=new THREE.Box3().setFromObject(model);const size=box.getSize(new THREE.Vector3());const scale=height/Math.max(size.y,0.01);model.scale.setScalar(scale);model.position.y=-box.min.y*scale;const group=new THREE.Group();group.add(model);return{group,model,clips:asset.animations,scale};}
}
