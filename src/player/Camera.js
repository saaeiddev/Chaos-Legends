import * as THREE from 'three';
import { damp,clamp } from '../utils/math.js';
export class Camera {
  constructor(game){this.game=game;this.camera=game.renderer.camera;this.yaw=0;this.pitch=-0.05;this.shake=0;this.distance=5.6;this.target=new THREE.Vector3();this.look=new THREE.Vector3();this.initialized=false;this.aim=0;}
  reset(){this.yaw=0;this.pitch=-0.05;this.shake=0;this.initialized=false;}
  update(dt,active=true){const g=this.game,input=g.input;if(active&&input.locked){this.yaw-=input.mouse.x*0.0022*g.settings.sensitivity;this.pitch=clamp(this.pitch+input.mouse.y*0.0018*g.settings.sensitivity,-0.65,0.72);}this.aim=damp(this.aim,active&&input.mouse.aim?1:0,12,dt);
    this.target.copy(g.player.pos).add(new THREE.Vector3(0,1.6,0));const back=new THREE.Vector3(Math.sin(this.yaw)*Math.cos(this.pitch),Math.sin(this.pitch)+0.28,Math.cos(this.yaw)*Math.cos(this.pitch));const shoulder=new THREE.Vector3(Math.cos(this.yaw),0,-Math.sin(this.yaw)).multiplyScalar(0.82-this.aim*0.13);const dist=5.8-this.aim*2.3;
    const desired=this.target.clone().addScaledVector(back,dist).add(shoulder);const delta=desired.clone().sub(this.target);const length=delta.length();delta.normalize();const hit=g.world.collision.ray(this.target,delta,length);if(hit<length)desired.copy(this.target).addScaledVector(delta,Math.max(0.8,hit-0.22));const floor=g.world.height(desired.x,desired.z)+0.25;desired.y=Math.max(desired.y,floor);
    if(!this.initialized){this.camera.position.copy(desired);this.initialized=true;}else this.camera.position.lerp(desired,1-Math.exp(-17*dt));
    const fwd=new THREE.Vector3(-Math.sin(this.yaw)*Math.cos(this.pitch),-Math.sin(this.pitch),-Math.cos(this.yaw)*Math.cos(this.pitch));this.look.copy(this.target).addScaledVector(fwd,30).add(shoulder);
    this.shake=Math.max(0,this.shake-dt*0.9);if(this.shake>0){this.camera.position.x+=(Math.random()-0.5)*this.shake;this.camera.position.y+=(Math.random()-0.5)*this.shake;}
    this.camera.lookAt(this.look);this.camera.fov=damp(this.camera.fov,61-this.aim*13,11,dt);this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();
  }
  menu(dt,t){const cam=this.camera;cam.position.set(Math.sin(t*0.075)*0.8+6,3.1,3.8);cam.lookAt(-1,1.7,-32);cam.fov=58;cam.updateProjectionMatrix();}
}
