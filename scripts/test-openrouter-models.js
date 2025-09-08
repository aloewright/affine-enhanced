#!/usr/bin/env node
/**
 * Test OpenRouter Multi-Model Integration
 * Verifies that all configured AI models are working through OpenRouter API
 */

const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKey = envContent.match(/OPENROUTER_API_KEY=(.+)/)?.[1]?.trim();

if (!apiKey || apiKey === 'your-openrouter-api-key-here') {
  console.error('\n❌ OPENROUTER_API_KEY not configured in .env.local');
  console.log('\n📝 To use OpenRouter multi-model features:');
  console.log('   1. Get your API key from https://openrouter.ai/keys');
  console.log('   2. Update OPENROUTER_API_KEY in .env.local');
  console.log('   3. Restart the backend server\n');
  process.exit(1);
}

// Models to test (from our config)
const models = [
  { name: 'Claude 3.7 Sonnet', model: 'anthropic/claude-3.7-sonnet' },
  { name: 'Grok 2 Latest', model: 'xai/grok-2-latest' },
  { name: 'Gemini 1.5 Pro Latest', model: 'google/gemini-1.5-pro-latest' },
  { name: 'Deepseek Coder Latest', model: 'deepseek/deepseek-coder' }
];

// Test function for each model
async function testModel(modelInfo) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      model: modelInfo.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant testing OpenRouter integration.'
        },
        {
          role: 'user',
          content: `Briefly confirm you are ${modelInfo.name} working via OpenRouter. Just say your model name and "operational".`
        }
      ],
      max_tokens: 50,
      temperature: 0.7
    });

    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': data.length,
        'HTTP-Referer': 'https://github.com/aloewright/affine-enhanced',
        'X-Title': 'AFFiNE OpenRouter Test'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          if (result.choices && result.choices[0]?.message?.content) {
            resolve({
              success: true,
              model: modelInfo.name,
              response: result.choices[0].message.content
            });
          } else if (result.error) {
            resolve({
              success: false,
              model: modelInfo.name,
              error: result.error.message || 'Unknown error'
            });
          } else {
            resolve({
              success: false,
              model: modelInfo.name,
              error: 'Invalid response format'
            });
          }
        } catch (error) {
          resolve({
            success: false,
            model: modelInfo.name,
            error: `Parse error: ${error.message}`
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        model: modelInfo.name,
        error: `Request error: ${error.message}`
      });
    });

    req.write(data);
    req.end();
  });
}

// Main test runner
async function runTests() {
  console.log('\\n🧪 Testing OpenRouter Multi-Model Integration\\n');
  console.log('=' .repeat(50));
  
  const results = [];
  
  for (const modelInfo of models) {
    console.log(`\\nTesting ${modelInfo.name}...`);
    const result = await testModel(modelInfo);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${result.model}: SUCCESS`);
      console.log(`   Response: ${result.response}`);
    } else {
      console.log(`❌ ${result.model}: FAILED`);
      console.log(`   Error: ${result.error}`);
    }
  }
  
  console.log('\\n' + '=' .repeat(50));
  console.log('\\n📊 Test Summary:\\n');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`  ✅ Successful: ${successful}/${models.length}`);
  console.log(`  ❌ Failed: ${failed}/${models.length}`);
  
  if (successful === models.length) {
    console.log('\\n🎉 All models are operational via OpenRouter!\\n');
    process.exit(0);
  } else {
    console.log('\\n⚠️  Some models failed. Check your OpenRouter subscription and API limits.\\n');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('\\n❌ Test runner error:', error);
  process.exit(1);
});
