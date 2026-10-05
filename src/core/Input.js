export class Input {
  constructor(canvas,onUnlock){
    this.canvas=canvas;this.keys=new Set();this.pressed=new Set();this.mouse={x:0,y:0,fire:false,aim:false};this.locked=false;this.active=false;
    window.addEventListener('keydown',e=>{
      if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;
      if(this.active && ['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code))e.preventDefault();
      if(!this.keys.has(e.code))this.pressed.add(e.code);this.keys.add(e.code);
    });
    window.addEventListener('keyup',e=>this.keys.delete(e.code));
    document.addEventListener('mousemove',e=>{if(this.locked&&performance.now()>(this.ignoreMouseUntil||0)){this.mouse.x+=e.movementX;this.mouse.y+=e.movementY;}});
    canvas.addEventListener('mousedown',e=>{if(!this.active)return;if(!this.locked){this.lock();return;}if(e.button===0)this.mouse.fire=true;if(e.button===2)this.mouse.aim=true;});
    window.addEventListener('mouseup',e=>{if(e.button===0)this.mouse.fire=false;if(e.button===2)this.mouse.aim=false;});
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    document.addEventListener('pointerlockchange',()=>{
      const previous=this.locked;this.locked=document.pointerLockElement===canvas;
      if(!previous&&this.locked){this.mouse.x=0;this.mouse.y=0;this.ignoreMouseUntil=performance.now()+180;}
      if(previous&&!this.locked){this.clear();onUnlock();}
    });
    window.addEventListener('blur',()=>{this.clear();if(this.active)onUnlock();});
  }
  down(code){return this.keys.has(code);}
  once(code){if(this.pressed.has(code)){this.pressed.delete(code);return true;}return false;}
  async lock(){if(!this.active)return;try{await this.canvas.requestPointerLock();}catch{ /* A fresh canvas click can grant pointer lock. */ }}
  unlock(){if(document.pointerLockElement)document.exitPointerLock();this.clear();}
  clear(){this.keys.clear();this.pressed.clear();this.mouse.x=0;this.mouse.y=0;this.mouse.fire=false;this.mouse.aim=false;}
  endFrame(){this.pressed.clear();this.mouse.x=0;this.mouse.y=0;}
}
