#!/usr/bin/env node
import {createHash, randomUUID} from 'node:crypto';
import {copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {skillRoot} from './lib/style-profile.mjs';

const hash = data => createHash('sha256').update(data).digest('hex');
const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
try {
  if (outIndex < 0 || !args[outIndex+1] || args[outIndex+1].startsWith('--')) throw new Error('Usage: prepare-style-assets.mjs --out <project-style-assets-directory>');
  const output = path.resolve(args[outIndex+1]);
  const relative = path.relative(path.resolve(skillRoot,'../..'), output);
  if (!relative.startsWith('..') && !path.isAbsolute(relative)) throw new Error('Write downloaded assets into the external video project, not the Skill repository');
  const source = path.join(skillRoot,'assets/style');
  const font = JSON.parse(readFileSync(path.join(source,'font-source.json'),'utf8'));
  const license = readFileSync(path.join(source,font.licenseFile));
  if (hash(license) !== font.licenseSha256) throw new Error('Bundled font license checksum mismatch');
  mkdirSync(output,{recursive:true});
  const destination = path.join(output,font.filename);
  if (existsSync(destination)) {
    if (hash(readFileSync(destination)) !== font.sha256) throw new Error('Existing font differs from the pinned version; use a new asset directory and preserve the current project');
  } else {
    const response = await fetch(font.url,{signal:AbortSignal.timeout(60000)});
    if (!response.ok) throw new Error(`Font download failed: HTTP ${response.status}`);
    const content = Buffer.from(await response.arrayBuffer());
    if (hash(content) !== font.sha256) throw new Error('Font checksum mismatch; refusing to use a different font');
    const temporary = `${destination}.${randomUUID()}.tmp`;
    try { writeFileSync(temporary,content,{flag:'wx'}); renameSync(temporary,destination); }
    finally { rmSync(temporary,{force:true}); }
  }
  for (const name of ['OFL-NotoSansSC.txt','xiaoxiong-style.css','notebook-nib.svg','reference-board.html']) {
    const destination = path.join(output,name);
    const data = readFileSync(path.join(source,name));
    if (existsSync(destination) && !readFileSync(destination).equals(data)) throw new Error(`Existing style asset differs: ${name}; use a new version directory`);
    copyFileSync(path.join(source,name),destination);
  }
  console.log(JSON.stringify({ok:true,output,font:{path:destination,sha256:font.sha256,license:font.license},referenceBoard:path.join(output,'reference-board.html')},null,2));
} catch (error) { console.error(error.message); process.exitCode=1; }
