import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { runtimeFiles } from './runtime-files.mjs';
const portArgument = process.argv.find((value) => value.startsWith('--port='));
const port = Number(portArgument?.split('=')[1] ?? process.env.PORT ?? 8080);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp' };
const allowed = new Set(runtimeFiles);
http.createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Cache-Control', 'no-cache, must-revalidate');
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return;
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { response.writeHead(400); response.end(); return; }
  const file = pathname === '/' ? 'index.html' : pathname.slice(1);
  if (!allowed.has(file)) { response.writeHead(404); response.end('Not found'); return; }
  try {
    const body = await readFile(new URL(`../dist/${file}`, import.meta.url));
    response.writeHead(200, { 'Content-Type': types[extname(file)] });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch { response.writeHead(404); response.end('Run npm run build first'); }
}).listen(port, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${port}`));
