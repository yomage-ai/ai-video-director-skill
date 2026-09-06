import {createHash} from 'node:crypto';
import {readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const skillRoot = fileURLToPath(new URL('../../', import.meta.url));
const blocked = new Set(['__proto__', 'prototype', 'constructor']);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function mergePreferences(base, override) {
  const result = structuredClone(base);
  for (const [key, value] of Object.entries(override)) {
    if (blocked.has(key)) throw new Error(`Unsafe preference key: ${key}`);
    result[key] = object(value)
      ? mergePreferences(object(result[key]) ? result[key] : {}, value)
      : structuredClone(value);
  }
  return result;
}

export function publicStyle() {
  const file = path.join(skillRoot, 'references/xiaoxiong-public-style.json');
  const style = JSON.parse(readFileSync(file, 'utf8'));
  if (style.schemaVersion !== 1 || style.scope !== 'bundled-public-default' || !object(style.preferences)) {
    throw new Error('Invalid bundled public style contract');
  }
  return style;
}

export function identityAdapter(directory) {
  const root = realpathSync(directory);
  const adapter = JSON.parse(readFileSync(path.join(root, 'references/video-adapter.json'), 'utf8'));
  if (adapter.schemaVersion !== 1 || !adapter.skillId || !object(adapter.preferences) || !object(adapter.assets)) {
    throw new Error('Invalid identity video adapter');
  }
  for (const [group, values] of Object.entries(adapter.preferences)) {
    const allowed = {talkingHead:['signatureOutro','identityProgress'],production:['signatureOutro']}[group];
    if (!allowed || !object(values) || Object.keys(values).some(key=>!allowed.includes(key))) {
      throw new Error('Identity adapters may only supply identity fields, not shared editing style');
    }
  }
  const assets = {};
  for (const [role, ref] of Object.entries(adapter.assets)) {
    if (typeof ref.path !== 'string' || path.isAbsolute(ref.path) || !/^[a-f0-9]{64}$/.test(ref.sha256)) {
      throw new Error(`Identity asset ${role} requires a relative path and SHA-256`);
    }
    const file = realpathSync(path.resolve(root, ref.path));
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Identity asset escapes its Skill');
    const actual = createHash('sha256').update(readFileSync(file)).digest('hex');
    if (actual !== ref.sha256) throw new Error(`Identity asset hash mismatch: ${role}`);
    assets[role] = {...ref, path: file};
  }
  return {...adapter, assets};
}
