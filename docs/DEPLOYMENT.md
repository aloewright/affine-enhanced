# AFFiNE Enhanced - Zero-Touch Deployment Guide

This guide will help you set up completely automated deployment of AFFiNE with enhanced AI providers and MCP support to Google Cloud Platform.

## 🚀 Quick Start (Zero Manual Intervention)

### Prerequisites

1. **Google Cloud Account** with billing enabled
2. **GitHub Account** (repository already created: `aloewright/affine-enhanced`)
3. **Local Tools** (for initial setup only):
   - [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
   - [Terraform](https://www.terraform.io/downloads) (>= 1.0)

### One-Time Setup (5 minutes)

1. **Clone and enter the repository**:
   ```bash
   cd /Users/aloe/git/AFFiNE
   ```

2. **Run the automated setup script**:
   ```bash
   chmod +x scripts/setup-gcloud.sh
   ./scripts/setup-gcloud.sh
   ```
   
   This script will:
   - ✅ Enable all required Google Cloud APIs
   - ✅ Create service accounts and IAM roles
   - ✅ Set up Workload Identity Federation for secure GitHub Actions
   - ✅ Create Terraform state bucket
   - ✅ Configure infrastructure as code
   - ✅ Display the GitHub secrets you need to add

3. **Add GitHub Secrets** (copy-paste from script output):
   - Go to: https://github.com/aloewright/affine-enhanced/settings/secrets/actions
   - Add the 3 secrets shown by the setup script:
     - `GCP_PROJECT_ID`
     - `WIF_PROVIDER`
     - `WIF_SERVICE_ACCOUNT`

4. **Deploy infrastructure** (optional - can be done automatically):
   ```bash
   cd infrastructure/terraform
   terraform apply
   ```

5. **Push to main branch to trigger deployment**:
   ```bash
   git add .
   git commit -m "Initial deployment setup [infrastructure]"
   git push origin main
   ```

That's it! 🎉 Your AFFiNE instance will be automatically deployed and accessible within 10-15 minutes.

## 📋 What Gets Deployed

### Infrastructure (Google Cloud)
- **Cloud Run**: Serverless container hosting (auto-scaling 1-10 instances)
- **Cloud SQL**: PostgreSQL 16 with vector extensions
- **Memorystore**: Redis cache
- **Artifact Registry**: Private Docker registry
- **VPC Network**: Secure private networking
- **Secret Manager**: Encrypted secrets storage
- **Load Balancer**: HTTPS with auto SSL certificates

### CI/CD Pipeline (GitHub Actions)
- **Automated Testing**: Lint, typecheck, unit tests on every PR
- **Docker Build**: Multi-stage optimized container builds
- **Automated Deployment**: Zero-downtime deployments to Cloud Run
- **Health Checks**: Automatic rollback if deployment fails
- **Image Cleanup**: Weekly cleanup of old container images

### Security Features
- **Workload Identity**: No service account keys stored
- **Secret Management**: All sensitive data encrypted at rest
- **Private Networking**: Database and Redis in private VPC
- **Container Security**: Non-root user, minimal attack surface
- **HTTPS Only**: Automatic SSL/TLS certificates

## 🔧 Configuration

### Environment Variables
The deployment automatically configures:
- `NODE_ENV=production`
- `DATABASE_URL` (auto-generated secure connection)
- `REDIS_SERVER_HOST` and `REDIS_SERVER_PORT`
- `NEXTAUTH_SECRET` and `AFFINE_JWT_SECRET` (auto-generated)
- `AFFINE_SERVER_HTTPS=true`

### Custom Configuration
To customize the deployment:

1. **Edit Terraform variables** in `infrastructure/terraform/terraform.tfvars`
2. **Modify resource sizes** in `infrastructure/terraform/main.tf`
3. **Update GitHub Actions** in `.github/workflows/deploy.yml`

### AI Providers (New Features)
- **OpenRouter Integration**: Configure via web UI after deployment
- **MCP Support**: JSON-based configuration for local MCP servers
- **Feature Flags**: `affine.features.openrouter` and `affine.features.mcp`

## 🚢 Deployment Triggers

### Automatic Deployment
- **Main Branch**: Any push to main triggers full deployment
- **Pull Requests**: Runs tests but doesn't deploy
- **Infrastructure**: Include `[infrastructure]` in commit message

### Manual Deployment
- **GitHub Actions**: Manually trigger workflows
- **Terraform**: Direct infrastructure changes
- **gcloud CLI**: Direct Cloud Run deployments

## 📊 Monitoring & Maintenance

### Health Monitoring
- **Built-in Health Checks**: `/api/healthcheck` endpoint
- **Google Cloud Monitoring**: Automatic metrics and alerting
- **GitHub Actions**: Deployment success/failure notifications

### Logs Access
```bash
# Application logs
gcloud run services logs tail affine-service --region=us-central1

# Infrastructure logs
gcloud logging read "resource.type=cloud_run_revision"
```

### Scaling
- **Automatic**: 1-10 instances based on traffic
- **Manual Override**: Edit `main.tf` and redeploy
- **Database**: Automatic scaling and backups

### Updates
- **Application**: Push to main branch (automatic)
- **Dependencies**: Update package.json and push
- **Infrastructure**: Edit Terraform files and commit with `[infrastructure]`

## 💰 Cost Optimization

### Default Configuration (Estimated Monthly Cost)
- **Cloud Run**: ~$20-50 (2 vCPU, 2GB RAM, minimal traffic)
- **Cloud SQL**: ~$25 (db-f1-micro, 20GB storage)
- **Redis**: ~$30 (1GB basic tier)
- **Networking**: ~$5 (VPC, load balancer)
- **Storage**: ~$5 (container images, backups)
- **Total**: ~$85-115/month for light usage

### Cost Reduction Options
1. **Reduce Cloud Run min instances** to 0 (cold starts)
2. **Use smaller database instance** (db-g1-small)
3. **Reduce Redis memory** to 0.5GB
4. **Enable aggressive image cleanup**

## 🔒 Security Best Practices

### Already Implemented
- ✅ Workload Identity Federation (no service account keys)
- ✅ Encrypted secrets in Secret Manager
- ✅ Private networking for databases
- ✅ Non-root container execution
- ✅ Automatic security updates via base image

### Additional Recommendations
- **Custom Domain**: Set up your own domain with Cloud DNS
- **WAF Protection**: Add Cloud Armor for DDoS protection
- **Backup Strategy**: Regular database exports to Cloud Storage
- **Monitoring**: Set up alerting for unusual activity

## 🚨 Troubleshooting

### Common Issues

**Deployment Fails**
```bash
# Check GitHub Actions logs
# Check Cloud Run logs
gcloud run services logs tail affine-service --region=us-central1

# Check container health
gcloud run services describe affine-service --region=us-central1
```

**Database Connection Issues**
```bash
# Test database connectivity
gcloud sql connect affine-postgres-production --user=affine

# Check VPC connector
gcloud compute networks vpc-access connectors list
```

**Permission Issues**
```bash
# Verify service account permissions
gcloud projects get-iam-policy YOUR_PROJECT_ID

# Check Workload Identity setup
gcloud iam workload-identity-pools describe github-pool --location=global
```

### Getting Help
1. **GitHub Issues**: Report bugs or feature requests
2. **Google Cloud Support**: Infrastructure issues
3. **Community**: AFFiNE Discord/Reddit

## 🎯 Next Steps

After deployment:

1. **Access your AFFiNE instance** at the Cloud Run URL
2. **Configure AI Providers** in Settings > AI Providers
3. **Set up MCP servers** in Settings > MCP (Desktop only)
4. **Add custom domain** (optional)
5. **Set up monitoring alerts** (recommended)

Your AFFiNE Enhanced instance is now running with zero manual intervention required for future updates! 🚀
