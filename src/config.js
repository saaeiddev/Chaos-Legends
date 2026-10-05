export const GAME = {
  title: 'Chaos Legends', subtitle: 'Whispering Valley',
  author: 'Amir Saeid Dehghan',
  repo: 'https://github.com/saaeiddev/Chaos-Legends',
  saveKey: 'chaos-legends-save-v1', settingsKey: 'chaos-legends-settings-v1',
  maxHealth: 100,
};
export const WEAPONS = [
  { id:'blaster', name:'Arcane Blaster', short:'BLASTER', key:'1', color:0x75efc5, mag:32, reserve:320, damage:23, rate:0.115, reload:1.45, spread:0.018, range:80, pellets:1, description:'Fast magic. Extremely questionable aim.' },
  { id:'boomstick', name:'Goblin Boomstick', short:'BOOMSTICK', key:'2', color:0xffba73, mag:7, reserve:70, damage:17, rate:0.72, reload:1.9, spread:0.075, range:26, pellets:8, description:'Eight good reasons to take a step back.' },
  { id:'rifle', name:'Crystal Rifle', short:'CRYSTAL RIFLE', key:'3', color:0xbca5ff, mag:6, reserve:54, damage:96, rate:0.88, reload:1.75, spread:0.002, range:110, pellets:1, description:'One crystal. One very bad day.' },
  { id:'chicken', name:'Chicken Launcher', short:'CHICKEN', key:'4', color:0xffe293, mag:4, reserve:32, damage:100, rate:1.1, reload:2.1, spread:0.005, range:70, pellets:1, description:'Poultry in motion. Explosive personality.' },
];
export const DEFAULT_SETTINGS = {
  quality:'high', scale:1, shadows:true, particles:true, post:true,
  sensitivity:1, master:0.6, music:0.26, sfx:0.85,
};
export const OBJECTIVES = [
  { title:'Enter the village', detail:'Follow the lanterns to the village square.', pos:[0,0,-17] },
  { title:'Clear the village square', detail:'The goblins have confused looting with tourism.', pos:[0,0,-28] },
  { title:'Find the gate key', detail:'Look for the glowing chest near the village well. Press F.', pos:[-9,0,-31] },
  { title:'Destroy the goblin barricade', detail:'Shoot the timber barrier. The red barrels may help.', pos:[0,0,-46] },
  { title:'Cross the old bridge', detail:'Take the bridge to the ruined watchtower.', pos:[0,0,-64] },
  { title:'Defeat the Grand Gobbler', detail:'Dodge his shockwave. Shoot when his shield drops.', pos:[0,0,-91] },
  { title:'Recover the valley crystal', detail:'The artifact is on the tower altar. Press F.', pos:[0,0,-106] },
];
