import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || '127.0.0.1';

const functionRoutes = {
  '/api/places/search': 'netlify/functions/places-search.mjs',
  '/api/quote': 'netlify/functions/quote.mjs',
};

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, headers);
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error('Request body too large.'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function handleFunction(req, res, pathname) {
  const modulePath = join(root, functionRoutes[pathname]);
  const mod = await import(pathToFileURL(modulePath).href + `?t=${Date.now()}`);
  const result = await mod.handler({
    httpMethod: req.method,
    headers: req.headers,
    body: await readBody(req),
    path: pathname,
    rawUrl: `http://${host}:${port}${req.url}`,
  });

  send(res, result.statusCode || 200, result.body || '', result.headers || {});
}

async function handleStatic(req, res, pathname) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const normalized = normalize(requested).replace(/^(\.\.[/\\])+/, '');
  const filePath = join(root, normalized);

  if (!filePath.startsWith(root)) {
    send(res, 403, 'Forbidden', { 'content-type': 'text/plain; charset=utf-8' });
    return;
  }

  try {
    const content = await readFile(filePath);
    send(res, 200, content, {
      'content-type': mimeTypes[extname(filePath)] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
  } catch {
    send(res, 404, 'Not found', { 'content-type': 'text/plain; charset=utf-8' });
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (functionRoutes[url.pathname]) {
      await handleFunction(req, res, url.pathname);
      return;
    }
    await handleStatic(req, res, url.pathname);
  } catch (error) {
    console.error(error);
    send(res, 500, JSON.stringify({ error: error.message || 'Internal server error' }), {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    });
  }
});

server.listen(port, host, () => {
  console.log(`Local Netlify-style dev server: http://${host}:${port}/`);
});
