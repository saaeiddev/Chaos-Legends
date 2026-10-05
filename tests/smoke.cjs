const {chromium}=require('playwright');
const fs=require('node:fs');
const {spawn}=require('node:child_process');
(async()=>{
 let server;
 if(!process.env.TEST_BASE_URL){server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5174'],{stdio:'pipe'});await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(d.toString().includes('Local:'))resolve()});server.on('error',reject);});}
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>{errors.push(e.stack);console.log('PAGE ERROR',e.stack)});page.on('console',m=>{if(m.type()==='error'){errors.push(m.text());console.log('CONSOLE ERROR',m.text());}});page.on('response',r=>{if(r.status()>=400){errors.push(`${r.status()} ${r.url()}`);console.log('HTTP ERROR',r.status(),r.url());}});
 if(process.env.SMOKE_LOW)await page.addInitScript(()=>localStorage.setItem('chaos-legends-settings-v1',JSON.stringify({quality:'low',scale:.7,shadows:false,particles:true,post:false})));
 await page.goto((process.env.TEST_BASE_URL||'http://127.0.0.1:5174/')+'?qa=1');await page.waitForFunction(()=>window.chaosLegends?.status().ready,undefined,{timeout:90000});
 fs.mkdirSync('screenshots',{recursive:true});await page.screenshot({path:'screenshots/menu.png'});console.log('menu',await page.evaluate(()=>chaosLegends.status()));
 await page.locator('#play').click();await page.waitForFunction(()=>window.chaosLegends.status().state==='playing');await page.waitForTimeout(500);console.log('playing',await page.evaluate(()=>({...chaosLegends.status(),camera:[__game.camera.yaw,__game.camera.pitch]})));await page.screenshot({path:'screenshots/gameplay.png'});
 console.log('ERRORS',JSON.stringify(errors));await browser.close();server?.kill();if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
