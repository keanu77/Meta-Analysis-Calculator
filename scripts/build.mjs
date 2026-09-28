import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runtimeFiles, hostingFiles } from './runtime-files.mjs';
const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
await rm(output, { recursive: true, force: true });
for (const file of [...runtimeFiles, ...hostingFiles]) {
  const destination = new URL(file, output);
  await mkdir(dirname(fileURLToPath(destination)), { recursive: true });
  await copyFile(new URL(file, root), destination);
}
// Bypass browser caches left by the former one-year cache policy on first release.
let html = await readFile(new URL('index.html', output), 'utf8');
const headerPolicy = await readFile(new URL('_headers', output));
for (const file of runtimeFiles.filter((file) => /\.(js|css)$/.test(file))) {
  // Changed response headers also need fresh cache keys on existing CDN entries.
  const digest = createHash('sha256').update(await readFile(new URL(file, output))).update(headerPolicy).digest('hex').slice(0, 16);
  html = html.replaceAll(`"${file}"`, `"${file}?v=${digest}"`);
}
await writeFile(new URL('index.html', output), html);
console.log(`Built ${runtimeFiles.length} reviewed runtime files and ${hostingFiles.length} hosting files in dist/`);
