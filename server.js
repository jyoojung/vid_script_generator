const http = require('http');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const PORT = 3000;

const handler = require('./api/generate');

// Vercel-style res adapter for plain Node.js http
function wrapRes(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    }
  };
  res.end = (function(originalEnd) {
    return function(...args) {
      return originalEnd.apply(res, args);
    };
  })(res.end);
  return res;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  wrapRes(res);

  // Serve API
  if (url.pathname === '/api/generate') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch {
        req.body = {};
      }
      try {
        await handler(req, res);
      } catch (err) {
        console.error('[server] Unhandled error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }
      }
    });
    return;
  }

  // Serve static files
  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
  filePath = path.join(__dirname, filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
    };
    res.setHeader('Content-Type', mimeTypes[ext] || 'text/plain');
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  const key = process.env.OPENAI_API_KEY;
  console.log(`🔑 OPENAI_API_KEY: ${key ? `설정됨 (${key.substring(0, 8)}...)` : '❌ 없음!'}`);
});
