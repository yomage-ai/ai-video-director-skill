import {readFileSync, writeFileSync} from 'node:fs';

export function classifyHostedChatcut(server,authStatus) {
  if (!server) return 'missing';
  if (server.enabled===false) return 'disabled';
  if (authStatus==='not_logged_in') return 'authentication-required';
  return 'installed-session-verification-required';
}

// Only for a server created by this setup invocation. Never edit or retarget an
// existing registration. Append a child table, preserving all preceding bytes.
export function addNewChatcutHeader(configPath,headers) {
  const source=readFileSync(configPath,'utf8');
  if (!/^\[mcp_servers\.chatcut\]\s*$/m.test(source)) throw new Error('New ChatCut registration is not in the expected host config; Agent must use host MCP settings to finish registration.');
  if (/^\[mcp_servers\.chatcut\.http_headers\]/m.test(source)) throw new Error('ChatCut headers appeared during setup; preserve them and recheck the host result.');
  const section=source.split(/^\[mcp_servers\.chatcut\]\s*$/m)[1].split(/^\[/m)[0];
  if (/^\s*http_headers\s*=/m.test(section)) throw new Error('ChatCut already has inline headers; preserve and verify them.');
  const content='\n[mcp_servers.chatcut.http_headers]\n'+Object.entries(headers).map(([key,value])=>`${JSON.stringify(key)} = ${JSON.stringify(value)}`).join('\n')+'\n';
  // The backup stays next to private host config and never enters the Skill.
  writeFileSync(`${configPath}.avd-${Date.now()}.bak`,source,{flag:'wx',mode:0o600});
  if (readFileSync(configPath,'utf8')!==source) throw new Error('Host config changed during setup; re-read before writing');
  writeFileSync(configPath,source+content,{mode:0o600});
}
