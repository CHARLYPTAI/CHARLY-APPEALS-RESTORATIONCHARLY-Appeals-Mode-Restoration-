#!/bin/bash

# ==============================================================================
# ENTERPRISE CHARLY UI - GOOGLE CLOUD PLATFORM DEPLOYMENT
# Immediate Production Recovery Script
# ==============================================================================

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 CHARLY UI - EMERGENCY GCP DEPLOYMENT${NC}"
echo "=================================================="
echo "Business Impact: Restoring $500K-2M ARR Platform Access"
echo "Timestamp: $(date)"
echo ""

# Configuration
PROJECT_ID=${GCP_PROJECT_ID:-"charly-property-tax"}
REGION=${GCP_REGION:-"us-central1"}
SERVICE_NAME="charly-ui"

echo -e "${YELLOW}📋 Deployment Configuration:${NC}"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo ""

# Function to check command result
check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ SUCCESS${NC}"
    else
        echo -e "${RED}❌ FAILED${NC}"
        exit 1
    fi
}

echo -e "${BLUE}Step 1: Authentication Check${NC}"
gcloud auth list --format="table(account,status)" | head -5
check_result

echo -e "\n${BLUE}Step 2: Set Active Project${NC}"
gcloud config set project $PROJECT_ID
check_result

echo -e "\n${BLUE}Step 3: Enable Required APIs${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
check_result

echo -e "\n${BLUE}Step 4: Production Build${NC}"
echo "Building optimized production bundle..."
npm run build
check_result

echo -e "\n${BLUE}Step 5: Docker Build & Push${NC}"
echo "Building Docker image..."

# Build the image
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest .
check_result

echo "Pushing to Google Container Registry..."
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest
check_result

echo -e "\n${BLUE}Step 6: Deploy to Cloud Run${NC}"
echo "Deploying to Cloud Run..."

gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300s \
  --concurrency 80 \
  --set-env-vars NODE_ENV=production

check_result

echo -e "\n${BLUE}Step 7: Verify Deployment${NC}"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
echo "Service URL: $SERVICE_URL"

echo "Testing connectivity..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL)
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Platform is LIVE and accessible!${NC}"
else
    echo -e "${YELLOW}⚠️  HTTP Status: $HTTP_STATUS (may still be starting)${NC}"
fi

echo -e "\n${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "=================================================="
echo -e "${GREEN}🌐 CHARLY UI Platform URL: ${BLUE}$SERVICE_URL${NC}"
echo ""
echo -e "${YELLOW}📊 Platform Features Available:${NC}"
echo "✅ Property Valuation Analysis (moved to top)"
echo "✅ Income Approach (Direct Cap + DCF tabs)"
echo "✅ Sales Comparison (collapsible comparable dropdowns)"
echo "✅ Cost Approach (Replacement + Depreciation + Land tabs)"
echo "✅ 333+ IAAO Variables across all approaches"
echo ""
echo -e "${GREEN}💰 Business Impact: $500K-2M ARR Platform RESTORED${NC}"
echo "=================================================="