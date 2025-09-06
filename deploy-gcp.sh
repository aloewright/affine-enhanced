#!/bin/bash

# Deploy AFFiNE with OpenRouter to Google Cloud Platform

set -e

# Configuration
PROJECT_ID="gen-lang-client-0050235412"
REGION="us-central1"
SERVICE_NAME="affine-openrouter"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Starting deployment to GCP..."

# Check if OpenRouter API key is set
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "❌ Error: OPENROUTER_API_KEY environment variable is not set"
    exit 1
fi

# Set the project
gcloud config set project $PROJECT_ID

# Enable necessary APIs
echo "📦 Enabling required GCP APIs..."
gcloud services enable run.googleapis.com \
    containerregistry.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com

# Update or create the secret
echo "🔐 Updating OpenRouter API key secret..."
echo -n "$OPENROUTER_API_KEY" | gcloud secrets create openrouter-api-key \
    --replication-policy="automatic" \
    --data-file=- 2>/dev/null || \
echo -n "$OPENROUTER_API_KEY" | gcloud secrets versions add openrouter-api-key --data-file=-

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t $IMAGE_NAME:latest .

# Push to Container Registry
echo "📤 Pushing to Container Registry..."
docker push $IMAGE_NAME:latest

# Deploy to Cloud Run
echo "☁️ Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --max-instances 10 \
    --min-instances 1 \
    --concurrency 80 \
    --set-env-vars="NODE_ENV=production,PORT=3010,OPENROUTER_ENABLED=true" \
    --update-secrets="OPENROUTER_API_KEY=openrouter-api-key:latest" \
    --service-account="${SERVICE_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" || \
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --max-instances 10 \
    --min-instances 1 \
    --concurrency 80 \
    --set-env-vars="NODE_ENV=production,PORT=3010,OPENROUTER_ENABLED=true" \
    --update-secrets="OPENROUTER_API_KEY=openrouter-api-key:latest"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region $REGION \
    --format 'value(status.url)')

echo "✅ Deployment complete!"
echo "🌐 Service URL: $SERVICE_URL"

# Test the deployment
echo "🧪 Testing deployment..."
curl -f "$SERVICE_URL/api/healthz" && echo "✅ Health check passed!" || echo "❌ Health check failed"
curl -f "$SERVICE_URL/api/ai/models" && echo "✅ OpenRouter models endpoint working!" || echo "❌ Models endpoint failed"
