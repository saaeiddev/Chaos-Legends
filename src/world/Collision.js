import { clamp } from '../utils/math.js';
export class Collision {
  constructor(){this.boxes=[];}
  box(x,z,w,d,bottom=-5,top=10,owner=null){const box={minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,bottom,top,owner,active:true};this.boxes.push(box);return box;}
  resolve(pos,radius=0.36,height=1.9){
    for(let iteration=0;iteration<3;iteration++)for(const b of this.boxes){if(!b.active||pos.y>=b.top-0.05||pos.y+height<b.bottom)continue;const x=clamp(pos.x,b.minX,b.maxX),z=clamp(pos.z,b.minZ,b.maxZ),dx=pos.x-x,dz=pos.z-z,dist=Math.hypot(dx,dz);
      if(dist>=radius)continue;if(dist>0.00001){pos.x+=dx/dist*(radius-dist);pos.z+=dz/dist*(radius-dist);}else{const sides=[pos.x-b.minX,b.maxX-pos.x,pos.z-b.minZ,b.maxZ-pos.z];const i=sides.indexOf(Math.min(...sides));if(i===0)pos.x=b.minX-radius;else if(i===1)pos.x=b.maxX+radius;else if(i===2)pos.z=b.minZ-radius;else pos.z=b.maxZ+radius;}}
    pos.x=clamp(pos.x,-27,27);pos.z=clamp(pos.z,-115,16);return pos;
  }
  ray(origin,dir,limit=Infinity,filter=null){let closest=limit;for(const b of this.boxes){if(!b.active||filter&&!filter(b))continue;let near=0,far=closest;for(const [axis,min,max] of [['x','minX','maxX'],['y','bottom','top'],['z','minZ','maxZ']]){if(Math.abs(dir[axis])<1e-8){if(origin[axis]<b[min]||origin[axis]>b[max]){far=-1;break;}}else{let a=(b[min]-origin[axis])/dir[axis],c=(b[max]-origin[axis])/dir[axis];if(a>c)[a,c]=[c,a];near=Math.max(near,a);far=Math.min(far,c);}}if(near<=far&&far>=0)closest=Math.min(closest,near);}return closest;}
  lineClear(a,b){const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,len=Math.hypot(dx,dy,dz);return this.ray(a,{x:dx/len,y:dy/len,z:dz/len},len)>=len-0.15;}
}
