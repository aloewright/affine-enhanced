#!/bin/bash

# AFFiNE Google Cloud Setup Script
# This script sets up the Google Cloud project for zero-touch deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=""
REGION="us-central1"
ZONE="us-central1-a"
GITHUB_REPO="aloewright/affine-enhanced"

echo -e "${BLUE}🚀 AFFiNE Google Cloud Setup${NC}"
echo "This script will set up Google Cloud infrastructure for automated deployment."
echo

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Google Cloud CLI is not installed${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform is not installed${NC}"
    echo "Please install it from: https://www.terraform.io/downloads"
    exit 1
fi

# Get project ID if not set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}📝 Please enter your Google Cloud Project ID:${NC}"
    read -r PROJECT_ID
    
    if [ -z "$PROJECT_ID" ]; then
        echo -e "${RED}❌ Project ID is required${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}🔧 Setting up project: $PROJECT_ID${NC}"

# Set the project
gcloud config set project "$PROJECT_ID"

# Enable required APIs
echo -e "${YELLOW}🔌 Enabling required APIs...${NC}"
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    sqladmin.googleapis.com \
    redis.googleapis.com \
    vpcaccess.googleapis.com \
    secretmanager.googleapis.com \
    servicenetworking.googleapis.com \
    artifactregistry.googleapis.com \
    iam.googleapis.com \
    cloudresourcemanager.googleapis.com \
    compute.googleapis.com

# Create service account for GitHub Actions
echo -e "${YELLOW}👤 Creating service account for GitHub Actions...${NC}"
SERVICE_ACCOUNT_NAME="github-actions"
SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"

gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
    --display-name="GitHub Actions Service Account" \
    --description="Service account for GitHub Actions CI/CD" || true

# Grant necessary roles to the service account
echo -e "${YELLOW}🔐 Granting roles to service account...${NC}"
ROLES=(
    "roles/run.admin"
    "roles/iam.serviceAccountUser"
    "roles/cloudsql.admin"
    "roles/redis.admin"
    "roles/compute.networkAdmin"
    "roles/artifactregistry.admin"
    "roles/secretmanager.admin"
    "roles/serviceusage.serviceUsageAdmin"
    "roles/resourcemanager.projectIamAdmin"
)

for role in "${ROLES[@]}"; do
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
        --role="$role"
done

# Set up Workload Identity Federation
echo -e "${YELLOW}🔑 Setting up Workload Identity Federation...${NC}"
POOL_ID="github-pool"
PROVIDER_ID="github-provider"

# Create workload identity pool
gcloud iam workload-identity-pools create "$POOL_ID" \
    --location="global" \
    --description="GitHub Actions pool" || true

# Get the pool name
POOL_NAME=$(gcloud iam workload-identity-pools describe "$POOL_ID" \
    --location="global" \
    --format="value(name)")

# Create workload identity provider
gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" \
    --workload-identity-pool="$POOL_ID" \
    --location="global" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.actor=assertion.actor,attribute.aud=assertion.aud" \
    --attribute-condition="assertion.repository=='$GITHUB_REPO'" || true

# Allow the GitHub repo to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding "$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/$POOL_NAME/attribute.repository/$GITHUB_REPO"

# Create Terraform state bucket
echo -e "${YELLOW}🗃️  Creating Terraform state bucket...${NC}"
BUCKET_NAME="$PROJECT_ID-terraform-state"
gsutil mb -p "$PROJECT_ID" -c STANDARD -l "$REGION" "gs://$BUCKET_NAME" || true
gsutil versioning set on "gs://$BUCKET_NAME"

# Set up GitHub secrets
echo -e "${YELLOW}📋 GitHub Secrets Configuration${NC}"
echo "Please add the following secrets to your GitHub repository:"
echo "Repository Settings > Secrets and variables > Actions > New repository secret"
echo
echo -e "${GREEN}GCP_PROJECT_ID${NC}: $PROJECT_ID"
echo -e "${GREEN}WIF_PROVIDER${NC}: $POOL_NAME/providers/$PROVIDER_ID"
echo -e "${GREEN}WIF_SERVICE_ACCOUNT${NC}: $SERVICE_ACCOUNT_EMAIL"
echo

# Initialize Terraform
echo -e "${YELLOW}🏗️  Initializing Terraform...${NC}"
cd infrastructure/terraform

# Create terraform.tfvars
cat > terraform.tfvars << EOF
project_id = "$PROJECT_ID"
region     = "$REGION"
zone       = "$ZONE"
EOF

# Update backend configuration
sed -i.bak "s/affine-terraform-state/$BUCKET_NAME/g" main.tf

terraform init
terraform plan

echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. Add the GitHub secrets listed above to your repository"
echo "2. Review and customize the Terraform configuration if needed"
echo "3. Push your code to the main branch to trigger deployment"
echo "4. Your application will be automatically deployed to Google Cloud Run"
echo
echo -e "${YELLOW}💡 Useful Commands:${NC}"
echo "• Deploy infrastructure: terraform apply"
echo "• Check logs: gcloud run services logs tail affine-service --region=$REGION"
echo "• Get service URL: gcloud run services describe affine-service --region=$REGION --format='value(status.url)'"
echo
echo -e "${GREEN}🎉 Your AFFiNE instance will be available at the Cloud Run URL after deployment!${NC}"
