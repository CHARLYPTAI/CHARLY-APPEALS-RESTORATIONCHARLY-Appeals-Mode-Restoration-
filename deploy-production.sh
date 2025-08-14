#!/bin/bash
# ============================================================================
# CHARLY PLATFORM - PRODUCTION DEPLOYMENT SCRIPT
# Apple CTO Enterprise Production Deployment - Phase 3A
# ============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
ENV_FILE="$PROJECT_ROOT/.env.production"
BACKUP_DIR="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"

# Logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Pre-deployment checks
check_requirements() {
    log "🔍 Checking deployment requirements..."
    
    # Check if running as non-root
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
    fi
    
    # Check required tools
    local required_tools=("docker" "docker-compose" "git" "curl" "jq")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            error "Required tool '$tool' is not installed"
        fi
    done
    
    # Check environment file
    if [[ ! -f "$ENV_FILE" ]]; then
        error "Production environment file not found: $ENV_FILE"
    fi
    
    # Source environment variables
    set -a
    source "$ENV_FILE"
    set +a
    
    # Validate critical environment variables
    local required_vars=("DOMAIN" "DB_PASSWORD" "JWT_SECRET" "REDIS_PASSWORD")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error "Required environment variable '$var' is not set"
        fi
    done
    
    success "All requirements check passed"
}

# Pre-deployment backup
create_backup() {
    log "📦 Creating pre-deployment backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup current deployment if exists
    if docker-compose -f docker-compose.production.yml ps -q charly-app &> /dev/null; then
        log "Creating database backup..."
        docker-compose -f docker-compose.production.yml exec -T postgres \
            pg_dump -U charly charly_prod > "$BACKUP_DIR/database.sql" || warn "Database backup failed"
        
        log "Creating application data backup..."
        docker cp "$(docker-compose -f docker-compose.production.yml ps -q charly-app):/app/data" \
            "$BACKUP_DIR/app-data" 2>/dev/null || warn "App data backup failed"
    fi
    
    # Backup configuration
    cp -r "$PROJECT_ROOT/config" "$BACKUP_DIR/" 2>/dev/null || true
    cp "$ENV_FILE" "$BACKUP_DIR/.env.production" 2>/dev/null || true
    
    success "Backup created: $BACKUP_DIR"
}

# Build and test images
build_images() {
    log "🏗️ Building production images..."
    
    # Build the production image
    docker build -f Dockerfile.production -t charly-platform:latest . || error "Docker build failed"
    
    # Run security scan if available
    if command -v trivy &> /dev/null; then
        log "🔒 Running security scan..."
        trivy image charly-platform:latest || warn "Security scan found issues"
    fi
    
    success "Images built successfully"
}

# Deploy application
deploy_application() {
    log "🚀 Deploying CHARLY Platform..."
    
    # Stop existing deployment gracefully
    if docker-compose -f docker-compose.production.yml ps -q &> /dev/null; then
        log "Stopping existing deployment..."
        docker-compose -f docker-compose.production.yml down --timeout 30
    fi
    
    # Start new deployment
    log "Starting new deployment..."
    docker-compose -f docker-compose.production.yml up -d
    
    # Wait for services to be healthy
    log "Waiting for services to start..."
    local max_attempts=60
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if docker-compose -f docker-compose.production.yml ps | grep -q "Up (healthy)"; then
            success "Services are healthy"
            break
        fi
        
        sleep 5
        ((attempt++))
        
        if [[ $attempt -eq $max_attempts ]]; then
            error "Services failed to start within timeout"
        fi
    done
}

# Post-deployment verification
verify_deployment() {
    log "✅ Verifying deployment..."
    
    # Check frontend
    local frontend_url="http://localhost:8080"
    if curl -f -s "$frontend_url" > /dev/null; then
        success "Frontend is accessible"
    else
        error "Frontend verification failed"
    fi
    
    # Check backend API
    local backend_url="http://localhost:8000/health"
    if curl -f -s "$backend_url" > /dev/null; then
        success "Backend API is accessible"
    else
        error "Backend API verification failed"
    fi
    
    # Check database connectivity
    if docker-compose -f docker-compose.production.yml exec -T postgres \
        pg_isready -U charly -d charly_prod > /dev/null; then
        success "Database is accessible"
    else
        error "Database verification failed"
    fi
    
    # Check Redis connectivity
    if docker-compose -f docker-compose.production.yml exec -T redis \
        redis-cli ping > /dev/null; then
        success "Redis is accessible"
    else
        error "Redis verification failed"
    fi
    
    success "All verification checks passed"
}

# Setup monitoring
setup_monitoring() {
    log "📊 Setting up monitoring..."
    
    # Create monitoring directories
    mkdir -p "$PROJECT_ROOT/docker/prometheus"
    mkdir -p "$PROJECT_ROOT/docker/grafana/provisioning"
    
    # Generate Prometheus configuration if not exists
    if [[ ! -f "$PROJECT_ROOT/docker/prometheus/prometheus.yml" ]]; then
        cat > "$PROJECT_ROOT/docker/prometheus/prometheus.yml" <<EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'charly-app'
    static_configs:
      - targets: ['charly-app:8000']
    metrics_path: /metrics
    scrape_interval: 30s
    
  - job_name: 'nginx'
    static_configs:
      - targets: ['charly-app:8080']
    metrics_path: /nginx_status
    scrape_interval: 30s
EOF
    fi
    
    success "Monitoring setup complete"
}

# Cleanup old resources
cleanup() {
    log "🧹 Cleaning up old resources..."
    
    # Remove old images (keep last 2)
    docker images charly-platform --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | \
        tail -n +3 | awk '{print $1}' | xargs -r docker rmi || true
    
    # Remove unused volumes (be careful!)
    docker volume prune -f || true
    
    success "Cleanup complete"
}

# Main deployment function
main() {
    log "🍎 CHARLY PLATFORM - PRODUCTION DEPLOYMENT"
    log "Apple CTO Enterprise Deployment - Phase 3A"
    log "=================================================="
    
    check_requirements
    create_backup
    build_images
    setup_monitoring
    deploy_application
    verify_deployment
    cleanup
    
    success "🎉 CHARLY Platform deployed successfully!"
    log "=================================================="
    log "Frontend URL: https://$DOMAIN"
    log "Backend API: https://$DOMAIN/api"
    log "Grafana Dashboard: https://grafana.$DOMAIN"
    log "Traefik Dashboard: https://traefik.$DOMAIN"
    log "=================================================="
    log "Backup location: $BACKUP_DIR"
    log "=================================================="
}

# Handle script interruption
trap 'error "Deployment interrupted"' INT TERM

# Run main function
main "$@"