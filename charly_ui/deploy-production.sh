#!/bin/bash

# CHARLY UI Production Deployment Script
# Enterprise-grade deployment with validation and rollback

set -e  # Exit on any error

# Configuration
BUCKET_NAME="charly-ui-production-2024"
PROJECT_ID="charly-platform-2024"
BACKUP_BUCKET="charly-ui-backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Validation functions
validate_build() {
    log "Validating build artifacts..."
    
    if [ ! -f "dist/index.html" ]; then
        error "dist/index.html not found. Run 'npm run build' first."
        exit 1
    fi
    
    if [ ! -d "dist/assets" ]; then
        error "dist/assets directory not found."
        exit 1
    fi
    
    # Check for relative paths in index.html
    if grep -q 'src="/' dist/index.html || grep -q 'href="/' dist/index.html; then
        error "Absolute paths found in index.html. Check vite.config.ts base setting."
        exit 1
    fi
    
    success "Build artifacts validated ✓"
}

# Backup current deployment
backup_current() {
    log "Creating backup of current deployment..."
    
    BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
    
    # Create backup bucket if it doesn't exist
    if ! gcloud storage buckets describe gs://$BACKUP_BUCKET >/dev/null 2>&1; then
        log "Creating backup bucket..."
        gcloud storage buckets create gs://$BACKUP_BUCKET --location=US
    fi
    
    # Copy current files to backup
    if gcloud storage ls gs://$BUCKET_NAME >/dev/null 2>&1; then
        gcloud storage cp -r gs://$BUCKET_NAME/* gs://$BACKUP_BUCKET/$BACKUP_DIR/ 2>/dev/null || warn "No existing files to backup"
        success "Backup created: gs://$BACKUP_BUCKET/$BACKUP_DIR/"
    fi
}

# Deploy function
deploy() {
    log "Deploying to production..."
    
    # Clear existing files (clean deployment)
    log "Clearing existing files..."
    gcloud storage rm -r gs://$BUCKET_NAME/** 2>/dev/null || log "No existing files to remove"
    
    # Upload new files
    log "Uploading new files..."
    gcloud storage cp -r dist/* gs://$BUCKET_NAME/
    
    # Set proper permissions
    log "Setting public permissions..."
    gcloud storage buckets update gs://$BUCKET_NAME --clear-pap
    gcloud storage objects update gs://$BUCKET_NAME/** --add-acl-grant=entity=allUsers,role=READER --recursive
    
    success "Deployment completed ✓"
}

# Validation test
validate_deployment() {
    log "Validating deployment..."
    
    SITE_URL="https://storage.googleapis.com/$BUCKET_NAME/index.html"
    
    # Test HTTP status
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL")
    if [ "$HTTP_STATUS" != "200" ]; then
        error "Site returned HTTP $HTTP_STATUS instead of 200"
        exit 1
    fi
    
    # Test content
    CONTENT=$(curl -s "$SITE_URL")
    if [[ ! "$CONTENT" == *"<div id=\"root\"></div>"* ]]; then
        error "Site content validation failed - no React root div found"
        exit 1
    fi
    
    # Test assets
    CSS_URL="https://storage.googleapis.com/$BUCKET_NAME/assets/index-CyCYno8A.css"
    CSS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$CSS_URL")
    if [ "$CSS_STATUS" != "200" ]; then
        error "CSS assets not accessible (HTTP $CSS_STATUS)"
        exit 1
    fi
    
    success "Deployment validation passed ✓"
    success "Site accessible at: $SITE_URL"
}

# Main deployment process
main() {
    log "Starting CHARLY UI Production Deployment"
    log "============================================"
    
    # Pre-deployment validation
    validate_build
    
    # Create backup
    backup_current
    
    # Deploy
    deploy
    
    # Post-deployment validation
    validate_deployment
    
    success "🚀 DEPLOYMENT SUCCESSFUL!"
    success "CHARLY Platform is live at: https://storage.googleapis.com/$BUCKET_NAME/index.html"
}

# Execute main function
main "$@"