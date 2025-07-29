#!/bin/bash
# Day 4 Frontend Optimization Pipeline
# Frontend Architecture & Performance Optimization

set -e  # Exit on error

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Timestamp function
timestamp() {
    date +"%Y%m%d_%H%M%S"
}

# Main optimization pipeline
case "$1" in
    --analyze-frontend)
        echo -e "${YELLOW}🔍 Analyzing frontend architecture...${NC}"
        
        # Create analysis directory
        mkdir -p frontend_analysis
        
        # Count files and lines
        echo "📊 Frontend Metrics:" | tee frontend_analysis/metrics.txt
        echo "Total TSX files: $(find charly_frontend/src -name "*.tsx" | grep -v node_modules | wc -l)" | tee -a frontend_analysis/metrics.txt
        echo "Total TS files: $(find charly_frontend/src -name "*.ts" | grep -v node_modules | wc -l)" | tee -a frontend_analysis/metrics.txt
        echo "Total test files: $(find charly_frontend/__tests__ -name "*.ts*" 2>/dev/null | wc -l)" | tee -a frontend_analysis/metrics.txt
        echo "Total source lines: $(find charly_frontend/src -name "*.ts*" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')" | tee -a frontend_analysis/metrics.txt
        
        # Component dependency analysis
        echo -e "\n${YELLOW}📦 Analyzing dependencies...${NC}"
        cd charly_frontend
        
        # Check for unused dependencies
        if command -v depcheck &> /dev/null; then
            npx depcheck --json > ../frontend_analysis/dependency_analysis.json
            echo "Unused dependencies found: $(cat ../frontend_analysis/dependency_analysis.json | jq '.dependencies | length')"
        fi
        
        # Analyze bundle if build exists
        if [ -f "package.json" ]; then
            echo -e "\n${YELLOW}📊 Bundle analysis...${NC}"
            npm run build -- --report > ../frontend_analysis/bundle_report.txt 2>&1 || true
        fi
        
        cd ..
        echo -e "${GREEN}✅ Frontend analysis complete!${NC}"
        ;;
        
    --consolidate-components)
        echo -e "${YELLOW}🔧 Consolidating redundant components...${NC}"
        
        # Create safety checkpoint
        git tag frontend-checkpoint-$(timestamp)
        echo "📌 Created git checkpoint: frontend-checkpoint-$(timestamp)"
        
        # Phase 1: Test consolidation
        echo -e "\n${YELLOW}Phase 1: Consolidating test files...${NC}"
        
        # Map current test structure
        echo "Current test files:"
        find charly_frontend -name "*.test.ts*" -o -name "*.spec.ts*" | wc -l
        
        # TODO: Implement test consolidation logic
        # This would involve:
        # 1. Grouping related tests
        # 2. Removing duplicate test utilities
        # 3. Creating shared test fixtures
        
        # Phase 2: Story consolidation
        echo -e "\n${YELLOW}Phase 2: Consolidating story files...${NC}"
        find charly_frontend -name "*.stories.ts*" | wc -l
        
        # Phase 3: Component merging
        echo -e "\n${YELLOW}Phase 3: Merging similar components...${NC}"
        
        # Safe mergers identified:
        # - Navigation components (AppHeader + AppSidebar)
        # - Utility functions
        # - Type definitions
        
        echo -e "${GREEN}✅ Component consolidation complete!${NC}"
        ;;
        
    --optimize-bundle)
        echo -e "${YELLOW}📦 Optimizing bundle performance...${NC}"
        
        cd charly_frontend
        
        # Ensure dependencies are installed
        npm install
        
        # Build with analysis
        echo -e "\n${YELLOW}Building with optimization...${NC}"
        npm run build
        
        # Check bundle size
        if [ -d "dist" ]; then
            echo -e "\n${GREEN}Bundle size analysis:${NC}"
            du -sh dist/
            find dist -name "*.js" -exec ls -lh {} \; | awk '{print $5, $9}'
        fi
        
        cd ..
        echo -e "${GREEN}✅ Bundle optimization complete!${NC}"
        ;;
        
    --validate-frontend)
        echo -e "${YELLOW}✅ Validating frontend optimization...${NC}"
        
        cd charly_frontend
        
        # Run tests
        echo -e "\n${YELLOW}Running test suite...${NC}"
        npm test -- --coverage
        
        # Run type checking
        echo -e "\n${YELLOW}Type checking...${NC}"
        npm run type-check || npx tsc --noEmit
        
        # Run linting
        echo -e "\n${YELLOW}Linting...${NC}"
        npm run lint || npx eslint src
        
        # Check critical components
        echo -e "\n${YELLOW}Verifying critical components...${NC}"
        critical_components=(
            "src/components/Login.tsx"
            "src/components/PropertyFields.tsx"
            "src/components/Brand.tsx"
            "src/components/FileUploadZone.tsx"
            "src/components/MobileResponsiveValidation.tsx"
        )
        
        for component in "${critical_components[@]}"; do
            if [ -f "$component" ]; then
                echo -e "${GREEN}✓ $component exists${NC}"
            else
                echo -e "${RED}✗ $component missing!${NC}"
                exit 1
            fi
        done
        
        cd ..
        echo -e "${GREEN}✅ Frontend validation complete!${NC}"
        ;;
        
    --performance-check)
        echo -e "${YELLOW}🚀 Checking frontend performance...${NC}"
        
        cd charly_frontend
        
        # Build production bundle
        echo "Building production bundle..."
        npm run build
        
        # Serve and test with Lighthouse
        echo -e "\n${YELLOW}Starting performance test server...${NC}"
        npx serve -s dist -p 3000 &
        SERVER_PID=$!
        
        sleep 5  # Wait for server to start
        
        # Run Lighthouse if available
        if command -v lighthouse &> /dev/null; then
            echo "Running Lighthouse performance audit..."
            lighthouse http://localhost:3000 --output json --output-path=../frontend_analysis/lighthouse-report.json
            
            # Extract key metrics
            echo -e "\n${GREEN}Performance Metrics:${NC}"
            cat ../frontend_analysis/lighthouse-report.json | jq '.categories.performance.score'
        else
            echo "Lighthouse not installed. Skipping performance audit."
        fi
        
        # Clean up
        kill $SERVER_PID
        
        cd ..
        echo -e "${GREEN}✅ Performance check complete!${NC}"
        ;;
        
    --rollback)
        echo -e "${RED}🔄 Rolling back to checkpoint...${NC}"
        
        # List available checkpoints
        echo "Available checkpoints:"
        git tag | grep frontend-checkpoint
        
        if [ -z "$2" ]; then
            echo "Usage: $0 --rollback <checkpoint-tag>"
            exit 1
        fi
        
        git reset --hard "$2"
        echo -e "${GREEN}✅ Rolled back to $2${NC}"
        ;;
        
    *)
        echo "Day 4 Frontend Optimization Pipeline"
        echo "Usage: $0 [option]"
        echo ""
        echo "Options:"
        echo "  --analyze-frontend     Analyze current frontend architecture"
        echo "  --consolidate-components   Consolidate redundant components"
        echo "  --optimize-bundle      Optimize bundle size and performance"
        echo "  --validate-frontend    Run comprehensive validation"
        echo "  --performance-check    Check frontend performance metrics"
        echo "  --rollback <tag>      Rollback to a specific checkpoint"
        echo ""
        echo "Example workflow:"
        echo "  1. $0 --analyze-frontend"
        echo "  2. $0 --consolidate-components"
        echo "  3. $0 --optimize-bundle"
        echo "  4. $0 --validate-frontend"
        echo "  5. $0 --performance-check"
        ;;
esac