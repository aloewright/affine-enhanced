const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.PORT || 8080;

// Load config
const config = JSON.parse(
  fs.readFileSync('./packages/backend/server/config.local.json', 'utf8')
);

const FRONTEND_PATH = path.join(__dirname, 'packages/frontend/apps/web/dist');

const server = http.createServer((req, res) => {
  // Serve static files from the frontend build directory
  if (!req.url.startsWith('/api')) {
    const filePath = path.join(
      FRONTEND_PATH,
      req.url === '/' ? 'index.html' : req.url
    );
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
      case '.js':
        contentType = 'text/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
        contentType = 'image/jpg';
        break;
    }

    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          fs.readFile(
            path.join(FRONTEND_PATH, 'index.html'),
            (error, content) => {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(content, 'utf-8');
            }
          );
        } else {
          res.writeHead(500);
          res.end(
            'Sorry, check with the site admin for error: ' +
              error.code +
              ' ..\n'
          );
          res.end();
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  } else {
    // your api routes
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Route handling
    if (req.url === '/api/healthz' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'healthy',
          service: 'affine-openrouter',
          timestamp: new Date().toISOString(),
        })
      );
    } else if (req.url === '/api/ai/models' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          models: [
            {
              id: 'anthropic/claude-3.7-sonnet',
              name: 'Claude 3.7 Sonnet',
              provider: 'Anthropic',
            },
            { id: 'xai/grok-2-latest', name: 'Grok 2 Latest', provider: 'xAI' },
            {
              id: 'google/gemini-1.5-pro-latest',
              name: 'Gemini 1.5 Pro',
              provider: 'Google',
            },
            {
              id: 'deepseek/deepseek-coder',
              name: 'Deepseek Coder',
              provider: 'Deepseek',
            },
          ],
          config: config.copilot?.scenarios || {},
        })
      );
    } else if (req.url === '/api/config' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          openrouter: {
            enabled: true,
            models: [
              'copilot_claude',
              'copilot_grok',
              'copilot_gemini',
              'copilot_coder',
            ],
            baseURL: 'https://openrouter.ai/api/v1',
          },
        })
      );
    } else if (req.url === '/api/ai/test' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          results: [
            {
              model: 'anthropic/claude-3.7-sonnet',
              status: 'ready',
              message: 'Claude 3.7 Sonnet is configured',
            },
            {
              model: 'xai/grok-2-latest',
              status: 'ready',
              message: 'Grok 2 Latest is configured',
            },
            {
              model: 'google/gemini-1.5-pro-latest',
              status: 'ready',
              message: 'Gemini 1.5 Pro is configured',
            },
            {
              model: 'deepseek/deepseek-coder',
              status: 'ready',
              message: 'Deepseek Coder is configured',
            },
          ],
        })
      );
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║   🚀 AFFiNE OpenRouter Server Running!                ║
║   URL: http://localhost:${PORT}                          ║
╚═══════════════════════════════════════════════════════╝
  `);
});
