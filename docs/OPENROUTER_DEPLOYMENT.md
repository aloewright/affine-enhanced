# OpenRouter Multi-Model Integration Deployment Guide

## Overview
This guide covers the deployment of OpenRouter multi-model AI integration for AFFiNE, including configuration, testing, and monitoring.

## Features Implemented

### 1. Multi-Model AI Support
- **Claude 3.7 Sonnet** (`anthropic/claude-3.7-sonnet`)
- **Grok 2 Latest** (`xai/grok-2-latest`)
- **Gemini 1.5 Pro Latest** (`google/gemini-1.5-pro-latest`)
- **Deepseek Coder Latest** (`deepseek/deepseek-coder`)

### 2. Infrastructure Improvements
- Fixed NGINX header buffer size issues (400 errors)
- Added accessibility testing for input elements
- Created test scripts for model validation

## Deployment Steps

### Step 1: Configure OpenRouter API Key

1. Get your API key from [OpenRouter](https://openrouter.ai/keys)
2. Update `.env.local`:
```bash
OPENROUTER_API_KEY=your-actual-api-key-here
```

### Step 2: Build Docker Images

#### Backend Image
```bash
docker build -f Dockerfile.backend -t affine-backend:openrouter .
```

#### Frontend Image
```bash
docker build -f Dockerfile.frontend -t affine-frontend:nginx-fix .
```

### Step 3: Deploy with Docker Compose

Create a `docker-compose.yml`:
```yaml
version: '3.8'
services:
  backend:
    image: affine-backend:openrouter
    environment:
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
    ports:
      - "3010:3010"
    
  frontend:
    image: affine-frontend:nginx-fix
    ports:
      - "80:80"
    depends_on:
      - backend
```

Deploy:
```bash
docker-compose up -d
```

### Step 4: Test Integration

#### Test OpenRouter Models
```bash
node scripts/test-openrouter-models.js
```

Expected output:
```
🧪 Testing OpenRouter Multi-Model Integration
✅ Claude 3.7 Sonnet: SUCCESS
✅ Grok 2 Latest: SUCCESS
✅ Gemini 1.5 Pro Latest: SUCCESS
✅ Deepseek Coder Latest: SUCCESS
```

#### Test Accessibility
```bash
node scripts/check-input-accessibility.js
```

### Step 5: Monitor and Verify

1. **Check Backend Logs**:
```bash
docker logs affine-backend -f
```

2. **Verify NGINX Config**:
```bash
docker exec affine-frontend nginx -t
```

3. **Test AI Features in UI**:
- Navigate to AFFiNE interface
- Use AI copilot features
- Verify model switching works

## Configuration Files

### Backend Configuration
Location: `packages/backend/server/config.local.json`

Key settings:
```json
{
  "copilot": {
    "openai": {
      "baseURL": "https://openrouter.ai/api/v1"
    },
    "scenarios": {
      "override_enabled": true,
      "copilot_claude": {
        "endpoint": "openai",
        "model": "anthropic/claude-3.7-sonnet"
      },
      "copilot_grok": {
        "endpoint": "openai",
        "model": "xai/grok-2-latest"
      },
      "copilot_gemini": {
        "endpoint": "openai",
        "model": "google/gemini-1.5-pro-latest"
      },
      "copilot_coder": {
        "endpoint": "openai",
        "model": "deepseek/deepseek-coder"
      }
    }
  }
}
```

### NGINX Configuration
Location: `.github/deployment/front/affine.nginx.conf`

Key settings:
```nginx
http {
    large_client_header_buffers 8 32k;
    # ... rest of config
}
```

## Troubleshooting

### Issue: API Key Not Working
**Solution**: 
- Verify key is active at https://openrouter.ai/keys
- Check account balance and limits
- Ensure key is properly formatted in `.env.local`

### Issue: 400 Request Header Too Large
**Solution**: 
- NGINX config should have `large_client_header_buffers 8 32k`
- Restart NGINX container after config changes

### Issue: Model Not Available
**Solution**:
- Check OpenRouter subscription includes the model
- Verify model name in config matches OpenRouter's naming
- Use test script to validate model availability

### Issue: Accessibility Warnings
**Solution**:
- Run `node scripts/check-input-accessibility.js`
- Add `id` or `name` attributes to flagged input elements
- Re-run test to verify fixes

## Monitoring

### API Usage
Track OpenRouter API usage at: https://openrouter.ai/usage

### Performance Metrics
Monitor response times for each model:
```bash
# Add to backend logging
console.log(`Model: ${model}, Response Time: ${responseTime}ms`);
```

### Error Tracking
Check backend logs for API errors:
```bash
docker logs affine-backend 2>&1 | grep -i "openrouter\|error"
```

## Security Considerations

1. **API Key Management**:
   - Never commit API keys to version control
   - Use environment variables for production
   - Rotate keys regularly

2. **Rate Limiting**:
   - Implement rate limiting for AI endpoints
   - Monitor usage to prevent abuse

3. **Content Filtering**:
   - Consider implementing content moderation
   - Log unusual requests for review

## Rollback Plan

If issues occur:

1. **Quick Rollback**:
```bash
git checkout main
docker-compose down
docker-compose up -d  # with previous images
```

2. **Disable AI Features**:
Set in config:
```json
{
  "copilot": {
    "scenarios": {
      "override_enabled": false
    }
  }
}
```

## Performance Optimization

1. **Cache Responses**:
   - Implement Redis for caching common queries
   - Set appropriate TTL based on content type

2. **Load Balancing**:
   - Distribute requests across models
   - Use fastest model for time-sensitive queries

3. **Async Processing**:
   - Queue long-running AI tasks
   - Implement webhooks for completion notifications

## Future Enhancements

1. **Additional Models**:
   - GPT-4 Turbo
   - Llama 3
   - Mixtral

2. **Model Selection UI**:
   - User preference settings
   - Per-workspace model configuration
   - Cost tracking per model

3. **Advanced Features**:
   - Function calling support
   - Image generation integration
   - Code execution sandboxing

## Support

For issues or questions:
- GitHub Issues: https://github.com/aloewright/affine-enhanced/issues
- PR: https://github.com/aloewright/affine-enhanced/pull/4

## License

This integration follows AFFiNE's existing license terms.
