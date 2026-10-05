import { cp,copyFile,rm,writeFile } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
// Keep a ready-to-run build for either existing main/root or main/docs Pages settings.
await copyFile(path.join(root,'docs/index.html'),path.join(root,'index.html'));
await rm(path.join(root,'assets'),{recursive:true,force:true});
await cp(path.join(root,'docs/assets'),path.join(root,'assets'),{recursive:true});
await writeFile(path.join(root,'.nojekyll'),'');
await writeFile(path.join(root,'docs/.nojekyll'),'');
console.log('Packaged repository-relative GitHub Pages builds in / and /docs.');
