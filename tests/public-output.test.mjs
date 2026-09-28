import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runtimeFiles, hostingFiles } from '../scripts/runtime-files.mjs';
const root = new URL('../', import.meta.url);
test('build only publishes reviewed runtime assets',()=>{
 execFileSync(process.execPath,['scripts/build.mjs'],{cwd:root});
 const files=readdirSync(new URL('dist/',root),{recursive:true,withFileTypes:true}).filter(e=>e.isFile()).map(e=>relative(fileURLToPath(new URL('dist/',root)),join(e.parentPath,e.name)));
 assert.deepEqual(files.sort(),[...runtimeFiles,...hostingFiles].sort());
 const html=readFileSync(new URL('dist/index.html',root),'utf8');
 assert.doesNotMatch(html,/<script[^>]+src="https?:/);
 assert.doesNotMatch(html,/<script[^>]+src="(?:rob-assessment|chart-utils|pdf-export)/);
 for (const file of runtimeFiles.filter(file=>/\.(js|css)$/.test(file))) {
  const digest=createHash('sha256').update(readFileSync(new URL(`dist/${file}`,root))).update(readFileSync(new URL('dist/_headers',root))).digest('hex').slice(0,16);
  assert.ok(html.includes(`"${file}?v=${digest}"`), `${file} must invalidate caches when content or header policy changes`);
 }
 assert.doesNotMatch(readFileSync(new URL('dist/calculator-core.js',root),'utf8'),/localStorage|sessionStorage/);
 for(const file of ['firebase.json','zbpack.json']) {const config=JSON.parse(readFileSync(new URL(file,root)));assert.equal(config.hosting?.public??config.output_dir,'dist');}
 const headers=readFileSync(new URL('dist/_headers',root),'utf8');
 assert.match(headers,/Cache-Control: no-cache, must-revalidate/);
 assert.match(headers,/X-Content-Type-Options: nosniff/);
 // Zeabur's header extension matches exact paths, not Netlify-style globs.
 assert.doesNotMatch(headers,/^\/\*/m);
 for (const path of ['/', ...runtimeFiles.map(file=>`/${file}`), '/404.html', '/_headers']) {
  assert.ok(headers.split('\n').includes(path), `${path} must receive security and cache headers`);
 }
 assert.ok(readFileSync(new URL('dist/404.html',root),'utf8').includes('找不到頁面'));
});
