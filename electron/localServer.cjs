const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 28765;

const MIME_BY_EXT = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

function safeJoin(rootDir, urlPathname) {
  const decoded = decodeURIComponent(urlPathname || '/');
  const withoutQuery = decoded.split('?')[0];
  const normalized = path
    .normalize(withoutQuery)
    .replace(/^([/\\])+/, ''); // remove leading slashes
  const fullPath = path.join(rootDir, normalized);
  const rootResolved = path.resolve(rootDir);
  const fullResolved = path.resolve(fullPath);
  if (!fullResolved.startsWith(rootResolved)) return null;
  return fullResolved;
}

function isApiLikePath(urlPathname) {
  return (
    urlPathname === '/api' ||
    urlPathname.startsWith('/api/') ||
    urlPathname.startsWith('/socket.io/')
  );
}

function send(res, statusCode, headers, body) {
  res.writeHead(statusCode, headers);
  res.end(body);
}

function sendNotFound(res) {
  send(
    res,
    404,
    {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
    JSON.stringify({ error: 'not_found' })
  );
}

function sendServerError(res, err) {
  send(
    res,
    500,
    {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
    JSON.stringify({ error: 'internal_error', message: String(err?.message || err) })
  );
}

function readFileIfExists(filePath) {
  return new Promise((resolve) => {
    fs.stat(filePath, (statErr, stat) => {
      if (statErr || !stat) return resolve(null);
      if (stat.isDirectory()) return resolve(null);
      fs.readFile(filePath, (readErr, data) => {
        if (readErr) return resolve(null);
        resolve(data);
      });
    });
  });
}

async function serveStatic(req, res, rootDir) {
  const requestUrl = new URL(req.url || '/', `http://${DEFAULT_HOST}`);
  const pathname = requestUrl.pathname || '/';

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, { 'content-type': 'text/plain; charset=utf-8' }, 'Method Not Allowed');
  }

  // Não fazemos proxy nem atendemos API aqui (isso evita SPA fallback mascarar erros de API).
  if (isApiLikePath(pathname)) return sendNotFound(res);

  const targetPath =
    pathname === '/' ? path.join(rootDir, 'index.html') : safeJoin(rootDir, pathname);
  if (!targetPath) return sendNotFound(res);

  // 1) tenta servir arquivo real
  const fileData = await readFileIfExists(targetPath);
  if (fileData) {
    const ext = path.extname(targetPath).toLowerCase();
    const contentType = MIME_BY_EXT[ext] || 'application/octet-stream';
    const headers = {
      'content-type': contentType,
      // Assets hashed podem cachear; index.html não.
      'cache-control': ext === '.html' ? 'no-store' : 'public, max-age=31536000, immutable',
    };
    if (req.method === 'HEAD') return send(res, 200, headers, undefined);
    return send(res, 200, headers, fileData);
  }

  // 2) fallback SPA (React Router)
  const indexPath = path.join(rootDir, 'index.html');
  const indexData = await readFileIfExists(indexPath);
  if (!indexData) return sendNotFound(res);

  if (req.method === 'HEAD') {
    return send(res, 200, { 'content-type': MIME_BY_EXT['.html'], 'cache-control': 'no-store' });
  }
  return send(
    res,
    200,
    { 'content-type': MIME_BY_EXT['.html'], 'cache-control': 'no-store' },
    indexData
  );
}

function startLocalStaticServer(options) {
  const rootDir = options?.rootDir;
  if (!rootDir) throw new Error('startLocalStaticServer: options.rootDir é obrigatório');

  const host = options?.host || DEFAULT_HOST;
  const port = Number(options?.port || DEFAULT_PORT);

  const server = http.createServer(async (req, res) => {
    try {
      await serveStatic(req, res, rootDir);
    } catch (err) {
      sendServerError(res, err);
    }
  });

  const ready = new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      resolve();
    });
  });

  const url = `http://${host}:${port}`;

  return {
    url,
    port,
    host,
    ready,
    close: () =>
      new Promise((resolve) => {
        server.close(() => resolve());
      }),
  };
}

module.exports = {
  startLocalStaticServer,
  DEFAULT_PORT,
  DEFAULT_HOST,
};
