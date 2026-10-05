import { GAME, DEFAULT_SETTINGS } from '../config.js';
export function readJSON(key,fallback){try { const v=JSON.parse(localStorage.getItem(key)); return v && typeof v==='object' ? v : fallback; }catch {return fallback;}}
export function writeJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
export function loadSettings(){const s={...DEFAULT_SETTINGS,...readJSON(GAME.settingsKey,{})};
  if(!['low','medium','high','ultra'].includes(s.quality))s.quality='high';
  for(const key of ['scale','sensitivity','master','music','sfx']){const n=Number(s[key]);s[key]=Number.isFinite(n)?Math.min(key==='sensitivity'?2.5:1.5,Math.max(key==='sensitivity'?0.2:0,n)):DEFAULT_SETTINGS[key];}
  s.scale=Math.max(0.5,s.scale);return s;}
