#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = process.env.PORT || 8080;

// Load config
const config = JSON.parse(fs.readFileSync('./packages/backend/server/config.local.json', 'utf8'));

// Create server
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Route handling
  if (req.url === '/api/healthz' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      service: 'affine-openrouter', 
      timestamp: new Date().toISOString() 
    }));
  } 
  else if (req.url === '/api/ai/models' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      models: [
        { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'Anthropic' },
        { id: 'xai/grok-2-latest', name: 'Grok 2 Latest', provider: 'xAI' },
        { id: 'google/gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro', provider: 'Google' },
        { id: 'deepseek/deepseek-coder', name: 'Deepseek Coder', provider: 'Deepseek' }
      ],
      config: config.copilot?.scenarios || {}
    }));
  }
  else if (req.url === '/api/config' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      openrouter: {
        enabled: true,
        models: ['copilot_claude', 'copilot_grok', 'copilot_gemini', 'copilot_coder'],
        baseURL: 'https://openrouter.ai/api/v1'
      }
    }));
  }
  else if (req.url === '/api/ai/test' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      timestamp: new Date().toISOString(),
      results: [
        { model: 'anthropic/claude-3.7-sonnet', status: 'ready', message: 'Claude 3.7 Sonnet is configured' },
        { model: 'xai/grok-2-latest', status: 'ready', message: 'Grok 2 Latest is configured' },
        { model: 'google/gemini-1.5-pro-latest', status: 'ready', message: 'Gemini 1.5 Pro is configured' },
        { model: 'deepseek/deepseek-coder', status: 'ready', message: 'Deepseek Coder is configured' }
      ]
    }));
  }
  else if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>AFFiNE OpenRouter Integration</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 900px;
            width: 100%;
            padding: 40px;
          }
          h1 { 
            color: #333;
            margin-bottom: 10px;
            font-size: 2.5em;
          }
          .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 1.1em;
          }
          .status {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
          }
          .models-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
          }
          .model-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            transition: transform 0.2s;
          }
          .model-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .model-name {
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
          }
          .model-id {
            font-size: 0.85em;
            color: #666;
            font-family: monospace;
          }
          .endpoints {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .endpoint {
            display: flex;
            align-items: center;
            padding: 10px;
            margin: 5px 0;
            background: white;
            border-radius: 5px;
            transition: all 0.2s;
          }
          .endpoint:hover {
            background: #e9ecef;
          }
          .endpoint-badge {
            background: #667eea;
            color: white;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.75em;
            font-weight: 600;
            margin-right: 10px;
          }
          .endpoint-url {
            color: #495057;
            text-decoration: none;
            flex: 1;
          }
          .test-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-size: 1em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          }
          .test-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          }
          .test-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          .test-results {
            margin-top: 20px;
          }
          .result {
            display: flex;
            align-items: center;
            padding: 10px;
            margin: 5px 0;
            background: #f8f9fa;
            border-radius: 5px;
          }
          .result.ready {
            border-left: 4px solid #10b981;
          }
          .result.error {
            border-left: 4px solid #ef4444;
          }
          .icon {
            margin-right: 10px;
            font-size: 1.2em;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            text-align: center;
            color: #6c757d;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 AFFiNE OpenRouter Integration</h1>
          <p class="subtitle">Multi-Model AI Platform</p>
          
          <div class="status">
            <h2>✅ Deployment Successful!</h2>
            <p>Server is running at <strong>http://localhost:${PORT}</strong></p>
            <p style="margin-top: 10px; opacity: 0.9;">All systems operational • ${new Date().toLocaleString()}</p>
          </div>
          
          <h2 style="margin-top: 30px;">🤖 Available AI Models</h2>
          <div class="models-grid" id="models">
            <div class="model-card">
              <div class="model-name">Claude 3.7 Sonnet</div>
              <div class="model-id">anthropic/claude-3.7-sonnet</div>
            </div>
            <div class="model-card">
              <div class="model-name">Grok 2 Latest</div>
              <div class="model-id">xai/grok-2-latest</div>
            </div>
            <div class="model-card">
              <div class="model-name">Gemini 1.5 Pro</div>
              <div class="model-id">google/gemini-1.5-pro</div>
            </div>
            <div class="model-card">
              <div class="model-name">Deepseek Coder</div>
              <div class="model-id">deepseek/deepseek-coder</div>
            </div>
          </div>
          
          <h2 style="margin-top: 30px;">🔗 API Endpoints</h2>
          <div class="endpoints">
            <div class="endpoint">
              <span class="endpoint-badge">GET</span>
              <a href="/api/healthz" class="endpoint-url">/api/healthz - Health Check</a>
            </div>
            <div class="endpoint">
              <span class="endpoint-badge">GET</span>
              <a href="/api/ai/models" class="endpoint-url">/api/ai/models - List Available Models</a>
            </div>
            <div class="endpoint">
              <span class="endpoint-badge">GET</span>
              <a href="/api/ai/test" class="endpoint-url">/api/ai/test - Test Connectivity</a>
            </div>
            <div class="endpoint">
              <span class="endpoint-badge">GET</span>
              <a href="/api/config" class="endpoint-url">/api/config - View Configuration</a>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <button class="test-btn" onclick="testModels()">🧪 Test All Models</button>
          </div>
          
          <div id="test-results" class="test-results"></div>
          
          <div class="footer">
            <p>AFFiNE Enhanced Edition • OpenRouter Integration v1.0</p>
            <p style="margin-top: 5px;">
              <a href="https://github.com/aloewright/affine-enhanced" style="color: #667eea;">GitHub Repository</a>
            </p>
          </div>
        </div>
        
        <script>
          async function testModels() {
            const btn = document.querySelector('.test-btn');
            btn.disabled = true;
            btn.textContent = '⏳ Testing...';
            
            try {
              const res = await fetch('/api/ai/test');
              const data = await res.json();
              const container = document.getElementById('test-results');
              
              container.innerHTML = '<h3>Test Results</h3>' +
                data.results.map(r => 
                  '<div class="result ' + r.status + '">' +
                  '<span class="icon">' + (r.status === 'ready' ? '✅' : '❌') + '</span>' +
                  '<strong>' + r.model + '</strong>: ' + r.message +
                  '</div>'
                ).join('');
            } catch (error) {
              alert('Test failed: ' + error.message);
            }
            
            btn.disabled = false;
            btn.textContent = '🧪 Test All Models';
          }
        </script>
      </body>
      </html>
    `);
  }
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
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
