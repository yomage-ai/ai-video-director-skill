#!/usr/bin/env node
import {pathToFileURL} from 'node:url';
import {prepareChatcutUpload} from './lib/chatcut-upload-compat.mjs';
import {activateRuntimePaths} from './lib/setup-runtime.mjs';

const args=process.argv.slice(2);
const separator=args.indexOf('--');
const ownArgs=separator<0?args:args.slice(0,separator);
const forwarded=separator<0?[]:args.slice(separator+1);
const help=ownArgs.includes('--help');
if (help) {
  console.log('Agent upload entry: node scripts/chatcut-upload.mjs --helper <absolute-official-helper> -- <official upload arguments>\nAgent preparation: add --prepare-only without upload arguments. No user media or account data is read during preparation.');
} else {
  try {
    const index=ownArgs.indexOf('--helper');
    const prepareOnly=ownArgs.includes('--prepare-only');
    const allowed=prepareOnly?['--helper',ownArgs[index+1],'--prepare-only']:['--helper',ownArgs[index+1]];
    if (index<0 || ownArgs.length!==allowed.length || ownArgs.some(a=>!allowed.includes(a))) throw new Error('Use --helper <absolute-official-helper>, optionally --prepare-only; place upload arguments after --.');
    if (prepareOnly && forwarded.length) throw new Error('--prepare-only does not accept upload arguments.');
    if (!prepareOnly && !forwarded.length) throw new Error('Official upload arguments are required after --.');
    const receipt=prepareChatcutUpload(ownArgs[index+1]);
    if (prepareOnly) console.log(JSON.stringify(receipt,null,2));
    else {
      activateRuntimePaths();
      process.stderr.write('[ai-video-director] Using verified ChatCut upload compatibility profile: 2 parallel parts/file, 600s request limit, 2 attempts.\n');
      // Execute in this foreground process. Preserve official auth, metadata, storage,
      // finalization, output JSON and host cancellation; do not echo credentials.
      process.argv=[process.execPath,receipt.helper,...forwarded];
      await import(pathToFileURL(receipt.helper).href);
    }
  } catch(e) {
    process.stderr.write(JSON.stringify({ok:false,stage:'chatcut-upload-preparation',message:e.message})+'\n');
    process.exitCode=1;
  }
}
