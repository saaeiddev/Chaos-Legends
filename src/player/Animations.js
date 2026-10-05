import * as THREE from 'three';
export class Animations {
  constructor(model,clips){this.mixer=new THREE.AnimationMixer(model);this.actions=new Map();this.current=null;this.locked=0;
    for(const clip of clips)this.actions.set(clip.name,this.mixer.clipAction(clip));this.play('Idle');}
  find(names){for(const name of Array.isArray(names)?names:[names]){if(this.actions.has(name))return this.actions.get(name);const fuzzy=[...this.actions.keys()].find(n=>n.toLowerCase().endsWith(name.toLowerCase()));if(fuzzy)return this.actions.get(fuzzy);}return this.actions.values().next().value;}
  play(names,once=false,speed=1,force=false){if(this.locked>0&&!force)return;const action=this.find(names);if(!action)return;if(this.current===action&&!once){action.setEffectiveTimeScale(speed);return;}const prev=this.current;action.reset();action.setEffectiveTimeScale(speed);action.setEffectiveWeight(1);action.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity);action.clampWhenFinished=once;action.play();if(prev&&prev!==action)action.crossFadeFrom(prev,0.16,true);this.current=action;if(once)this.locked=Math.min(action.getClip().duration/speed,1.5);}
  update(dt){this.locked=Math.max(0,this.locked-dt);this.mixer.update(dt);}
  dispose(){this.mixer.stopAllAction();}
}
