import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
export class Renderer {
  constructor(canvas,settings){
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0xb5c9c5);this.scene.fog=new THREE.FogExp2(0xb5c9c5,0.009);
    this.camera=new THREE.PerspectiveCamera(61,innerWidth/innerHeight,0.08,220);
    this.webgl=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',alpha:false});
    this.webgl.outputColorSpace=THREE.SRGBColorSpace;this.webgl.toneMapping=THREE.ACESFilmicToneMapping;this.webgl.toneMappingExposure=1.12;
    this.webgl.shadowMap.type=THREE.PCFSoftShadowMap;this.webgl.info.autoReset=false;
    this.scene.add(new THREE.HemisphereLight(0xd9eddf,0x334449,2.35));
    this.sun=new THREE.DirectionalLight(0xffe3b5,3.25);this.sun.position.set(-24,42,9);this.sun.castShadow=true;
    Object.assign(this.sun.shadow.camera,{left:-34,right:34,top:36,bottom:-36,near:1,far:125});
    this.sun.shadow.bias=-0.0007;this.sun.shadow.normalBias=0.025;this.scene.add(this.sun,this.sun.target);
    this.composer=new EffectComposer(this.webgl);this.composer.addPass(new RenderPass(this.scene,this.camera));
    this.bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),0.18,0.35,1.2);this.composer.addPass(this.bloom);this.composer.addPass(new OutputPass());
    window.addEventListener('resize',()=>this.resize());this.apply(settings);
    this.webgl.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();window.dispatchEvent(new CustomEvent('game-render-failed',{detail:'The graphics context was interrupted. Reload the game to recover.'}));});
  }
  apply(s){this.settings=s;this.webgl.shadowMap.enabled=s.shadows&&s.quality!=='low';const size=s.quality==='ultra'?2048:s.quality==='high'?1536:1024;
    this.sun.shadow.mapSize.set(size,size);if(this.sun.shadow.map){this.sun.shadow.map.dispose();this.sun.shadow.map=null;}this.resize();}
  resize(){const s=this.settings;const cap=s.quality==='low'?1:s.quality==='medium'?1.25:1.8;this.webgl.setPixelRatio(Math.min(devicePixelRatio,cap)*s.scale);this.webgl.setSize(innerWidth,innerHeight);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.composer.setPixelRatio(this.webgl.getPixelRatio());this.composer.setSize(innerWidth,innerHeight);}
  followLight(p){this.sun.position.set(p.x-24,p.y+42,p.z+9);this.sun.target.position.set(p.x,p.y,p.z-7);this.sun.target.updateMatrixWorld();}
  render(){this.webgl.info.reset();if(this.settings.post&&this.settings.quality!=='low')this.composer.render();else this.webgl.render(this.scene,this.camera);}
}
