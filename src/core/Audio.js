// All sounds and music are synthesized here; no commercial samples are used.
export class Audio {
  constructor(settings){this.settings=settings;this.ctx=null;this.nextBeat=0;this.beat=0;this.muted=true;this.footTimer=0;}
  async init(){if(!this.ctx){this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);this.sfx=this.ctx.createGain();this.sfx.connect(this.master);this.music=this.ctx.createGain();this.music.connect(this.master);this.noise=this.ctx.createBuffer(1,this.ctx.sampleRate,this.ctx.sampleRate);const data=this.noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1);}await this.ctx.resume();this.apply(this.settings);this.nextBeat=this.ctx.currentTime+0.1;}
  apply(s){this.settings=s;if(!this.ctx)return;this.master.gain.value=s.master;this.sfx.gain.value=s.sfx;this.music.gain.value=s.music;}
  ambience(){if(!this.ctx||this.wind)return;this.wind=this.ctx.createBufferSource();this.wind.buffer=this.noise;this.wind.loop=true;const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=420;const gain=this.ctx.createGain();gain.gain.value=.019;this.wind.connect(filter);filter.connect(gain);gain.connect(this.music);this.wind.start();}
  tone(freq,duration=0.15,type='sine',volume=0.1,slide=0,channel='sfx',when=0){if(!this.ctx||this.ctx.state!=='running')return;const t=Math.max(this.ctx.currentTime,when),osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,t);if(slide)osc.frequency.exponentialRampToValueAtTime(Math.max(25,freq+slide),t+duration);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(volume,t+0.006);gain.gain.exponentialRampToValueAtTime(0.001,t+duration);osc.connect(gain);gain.connect(this[channel]);osc.start(t);osc.stop(t+duration+0.02);osc.onended=()=>{osc.disconnect();gain.disconnect();};}
  burst(duration=0.12,volume=0.1,cutoff=1800){if(!this.ctx||this.ctx.state!=='running')return;const src=this.ctx.createBufferSource();src.buffer=this.noise;const f=this.ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=cutoff;const g=this.ctx.createGain();g.gain.setValueAtTime(volume,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,this.ctx.currentTime+duration);src.connect(f);f.connect(g);g.connect(this.sfx);src.start();src.stop(this.ctx.currentTime+duration);src.onended=()=>{src.disconnect();f.disconnect();g.disconnect();};}
  play(name,variant=0){if(this.muted)return;switch(name){
    case 'shot':this.burst(variant===1?0.24:0.09,variant===1?0.26:0.12,variant===2?2800:1600);this.tone(variant===2?380:180,0.12,'sawtooth',0.055,-130);break;
    case 'reload':this.burst(0.04,0.065,4500);this.tone(700,0.06,'triangle',0.05,-180);break;
    case 'hit':this.tone(900,0.055,'triangle',0.06,280);break;
    case 'headshot':this.tone(1100,0.14,'sine',0.1,600);break;
    case 'damage':this.burst(0.18,0.12,500);this.tone(120,0.2,'triangle',0.1,-75);break;
    case 'step':this.burst(0.065,0.03,450);break;
    case 'jump':this.burst(0.08,0.05,700);break;
    case 'land':this.burst(0.1,0.06,350);break;
    case 'dash':this.burst(0.24,0.13,3000);this.tone(220,0.25,'sine',0.08,1000);break;
    case 'shock':this.tone(600,0.4,'sawtooth',0.07,-520);this.burst(0.3,0.12,700);break;
    case 'explosion':this.burst(0.6,0.24,700);this.tone(80,0.45,'sine',0.25,-50);break;
    case 'chicken':this.tone(620,0.13,'square',0.045,480);this.tone(390,0.22,'triangle',0.065,-140);break;
    case 'pickup':[660,830,990].forEach((n,i)=>this.tone(n,0.13,'sine',0.07,0,'sfx',this.ctx.currentTime+i*0.05));break;
    case 'kill':this.tone(500,0.12,'triangle',0.065,-240);break;
    case 'objective':[392,523,659].forEach((n,i)=>this.tone(n,0.25,'triangle',0.065,0,'sfx',this.ctx.currentTime+i*0.11));break;
    case 'ui':this.tone(620,0.08,'sine',0.055,100);break;
    case 'boss':this.tone(60,0.75,'sawtooth',0.07,40);break;
    case 'enemy':this.tone(190,0.17,'sawtooth',0.045,-100);break;
  }}
  update(active){if(!this.ctx||this.ctx.state!=='running'||!active){if(this.ctx)this.nextBeat=this.ctx.currentTime+0.1;return;}this.ambience();const now=this.ctx.currentTime;while(this.nextBeat<now+0.12){const melody=[392,0,494,587,659,587,494,0,330,392,440,494,523,494,392,0];const note=melody[this.beat%melody.length];if(note)this.tone(note,0.45,'triangle',0.11,0,'music',this.nextBeat);if(this.beat%4===0){this.tone(this.beat%8===0?98:110,0.9,'sine',0.18,0,'music',this.nextBeat);this.tone(65,0.12,'sine',0.19,-25,'music',this.nextBeat);}this.nextBeat+=0.31;this.beat++;}}
  stop(){this.muted=true;if(this.ctx){this.nextBeat=this.ctx.currentTime+0.1;this.music.gain.value=0;}}
}
