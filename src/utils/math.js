export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
export const damp = (a, b, speed, dt) => a + (b-a)*(1-Math.exp(-speed*dt));
export function seededRandom(seed=831){ return ()=> { seed |= 0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
export function angleDamp(a,b,s,dt){ let d=(b-a+Math.PI)%(Math.PI*2); if(d<0)d+=Math.PI*2; return a+(d-Math.PI)*(1-Math.exp(-s*dt)); }
export function formatTime(s){return `${Math.floor(s/60).toString().padStart(2,'0')}:${Math.floor(s%60).toString().padStart(2,'0')}`;}
