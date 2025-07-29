/**
 * Bundle Size Analysis Script
 * Analyzes build output to ensure bulk processing features stay under 35KB gzipped
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { gzipSync } from 'zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, '../charly_frontend');
const distDir = path.join(frontendDir, 'dist');

const TARGET_SIZE_KB = 35; // 35KB gzipped limit for bulk features

class BundleSizeAnalyzer {
  constructor() {
    this.results = {
      totalSize: 0,
      gzippedSize: 0,
      bulkFeatureSize: 0,
      bulkFeatureGzipped: 0,
      files: [],
      breakdown: {}
    };
  }

  async analyze() {
    console.log('📦 Analyzing bundle size for bulk processing features');
    console.log(`🎯 Target: ≤${TARGET_SIZE_KB}KB gzipped\n`);

    try {
      // Build the frontend
      await this.buildFrontend();
      
      // Analyze the build output
      await this.analyzeBuildOutput();
      
      // Calculate bulk feature size
      await this.calculateBulkFeatureSize();
      
      // Generate report
      this.generateReport();
      
      return this.results;
      
    } catch (error) {
      console.error('❌ Bundle analysis failed:', error.message);
      throw error;
    }
  }

  async buildFrontend() {
    console.log('🔨 Building frontend...');
    
    try {
      const buildCommand = 'npm run build';
      const output = execSync(buildCommand, { 
        cwd: frontendDir, 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      console.log('✅ Build completed successfully\n');
      
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      throw new Error('Frontend build failed');
    }
  }

  async analyzeBuildOutput() {
    if (!fs.existsSync(distDir)) {
      throw new Error('Build output directory not found');
    }

    const assetsDir = path.join(distDir, 'assets');
    if (!fs.existsSync(assetsDir)) {
      throw new Error('Assets directory not found in build output');
    }

    // Analyze all JavaScript chunks
    const jsFiles = fs.readdirSync(assetsDir)
      .filter(file => file.endsWith('.js'))
      .map(file => {
        const filePath = path.join(assetsDir, file);
        const content = fs.readFileSync(filePath);
        const size = content.length;
        const gzippedSize = gzipSync(content).length;

        return {
          name: file,
          path: filePath,
          size,
          gzippedSize,
          sizeKB: Math.round(size / 1024 * 10) / 10,
          gzippedKB: Math.round(gzippedSize / 1024 * 10) / 10
        };
      });

    this.results.files = jsFiles;
    this.results.totalSize = jsFiles.reduce((sum, file) => sum + file.size, 0);
    this.results.gzippedSize = jsFiles.reduce((sum, file) => sum + file.gzippedSize, 0);
  }

  async calculateBulkFeatureSize() {
    // Identify bulk feature related chunks
    const bulkKeywords = [
      'bulk', 'job', 'sse', 'stream', 'progress', 'timeline', 
      'AdminBulkJobs', 'JobProgressCard', 'JobTimeline', 'JobDocsTable',
      'useBulkJobStream', 'useSSE', 'progressColors'
    ];

    let bulkFeatureSize = 0;
    let bulkFeatureGzipped = 0;

    for (const file of this.results.files) {
      // Check if file contains bulk-related code
      const content = fs.readFileSync(file.path, 'utf8');
      const containsBulkFeatures = bulkKeywords.some(keyword => 
        content.includes(keyword) || file.name.includes(keyword)
      );

      if (containsBulkFeatures) {
        bulkFeatureSize += file.size;
        bulkFeatureGzipped += file.gzippedSize;
        
        this.results.breakdown[file.name] = {
          size: file.sizeKB,
          gzipped: file.gzippedKB,
          isBulkFeature: true
        };
      } else {
        this.results.breakdown[file.name] = {
          size: file.sizeKB,
          gzipped: file.gzippedKB,
          isBulkFeature: false
        };
      }
    }

    this.results.bulkFeatureSize = bulkFeatureSize;
    this.results.bulkFeatureGzipped = bulkFeatureGzipped;
  }

  generateReport() {
    const bulkSizeKB = Math.round(this.results.bulkFeatureGzipped / 1024 * 10) / 10;
    const totalSizeKB = Math.round(this.results.gzippedSize / 1024 * 10) / 10;
    const meetsTarget = bulkSizeKB <= TARGET_SIZE_KB;

    console.log('📊 Bundle Size Analysis Results');
    console.log('=' .repeat(50));
    console.log(`📦 Total Bundle Size: ${totalSizeKB}KB gzipped`);
    console.log(`🎯 Bulk Features Size: ${bulkSizeKB}KB gzipped`);
    console.log(`📏 Target: ${TARGET_SIZE_KB}KB gzipped`);
    console.log('');

    if (meetsTarget) {
      console.log(`✅ PASS: Bulk features (${bulkSizeKB}KB) under target (${TARGET_SIZE_KB}KB)`);
      const remainingBudget = TARGET_SIZE_KB - bulkSizeKB;
      console.log(`💰 Remaining budget: ${remainingBudget.toFixed(1)}KB`);
    } else {
      console.log(`❌ FAIL: Bulk features (${bulkSizeKB}KB) exceed target (${TARGET_SIZE_KB}KB)`);
      const overage = bulkSizeKB - TARGET_SIZE_KB;
      console.log(`💸 Over budget by: ${overage.toFixed(1)}KB`);
    }

    console.log('\n📋 File Breakdown:');
    console.log('-' .repeat(30));

    // Sort files by size (largest first)
    const sortedFiles = this.results.files
      .sort((a, b) => b.gzippedSize - a.gzippedSize);

    for (const file of sortedFiles) {
      const isBulk = this.results.breakdown[file.name].isBulkFeature;
      const marker = isBulk ? '🎯' : '  ';
      console.log(`${marker} ${file.name}: ${file.gzippedKB}KB gzipped`);
    }

    console.log('\n🔍 Bulk Feature Files:');
    console.log('-' .repeat(25));
    
    const bulkFiles = Object.entries(this.results.breakdown)
      .filter(([_, info]) => info.isBulkFeature)
      .sort(([,a], [,b]) => b.gzipped - a.gzipped);

    if (bulkFiles.length === 0) {
      console.log('⚠️  No bulk feature files detected - may need better detection');
    } else {
      for (const [fileName, info] of bulkFiles) {
        console.log(`  📄 ${fileName}: ${info.gzipped}KB gzipped`);
      }
    }

    // Performance recommendations
    console.log('\n💡 Optimization Recommendations:');
    console.log('-' .repeat(35));

    if (bulkSizeKB > TARGET_SIZE_KB * 0.8) {
      console.log('🔄 Consider lazy loading Recharts components');
      console.log('📦 Implement dynamic imports for heavy dependencies');
      console.log('🗜️  Enable additional Vite optimizations');
    }

    if (bulkSizeKB > TARGET_SIZE_KB) {
      console.log('🚨 Immediate action required:');
      console.log('   - Review component imports');
      console.log('   - Split large components');
      console.log('   - Use code splitting');
      console.log('   - Consider lighter alternatives');
    }

    // Core Web Vitals impact estimate
    const estimatedLCPImpact = bulkSizeKB * 0.05; // Rough estimate
    console.log(`\n⚡ Estimated LCP impact: +${estimatedLCPImpact.toFixed(1)}ms`);
    
    if (estimatedLCPImpact > 100) {
      console.log('⚠️  May impact Core Web Vitals LCP target (<2.5s)');
    } else {
      console.log('✅ Should maintain Core Web Vitals compliance');
    }

    return {
      success: meetsTarget,
      bulkSizeKB,
      targetKB: TARGET_SIZE_KB,
      totalSizeKB
    };
  }
}

// Main execution
async function main() {
  try {
    const analyzer = new BundleSizeAnalyzer();
    const results = await analyzer.analyze();
    const report = analyzer.generateReport();
    
    // Exit with appropriate code
    if (report.success) {
      console.log('\n🎉 Bundle size analysis passed!');
      process.exit(0);
    } else {
      console.log('\n💥 Bundle size analysis failed!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { BundleSizeAnalyzer };