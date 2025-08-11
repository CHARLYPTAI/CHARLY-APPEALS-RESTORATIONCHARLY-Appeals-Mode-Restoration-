import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Production optimizations
      jsxRuntime: 'automatic',
      babel: {
        plugins: [
          // Remove PropTypes in production
          ['babel-plugin-transform-remove-console', { exclude: ['error', 'warn'] }],
        ],
      },
    }),
    // Bundle analyzer for optimization insights
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  base: './',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Production environment variables
    __DEV__: false,
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    // Apple CTO Production Build Standards
    target: ['es2020', 'chrome80', 'firefox78', 'safari14'],
    minify: 'terser',
    cssMinify: true,
    reportCompressedSize: true,
    sourcemap: false, // Disable sourcemaps for production
    
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    
    rollupOptions: {
      output: {
        // Apple CTO Enterprise Bundle Strategy
        manualChunks: {
          // Core React ecosystem
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          
          // UI Framework - only installed packages
          'vendor-ui': [
            'lucide-react',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-progress',
            '@radix-ui/react-separator',
            '@radix-ui/react-switch',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
          ],
          
          // Data Visualization
          'vendor-charts': ['recharts'],
          
          // Document Generation
          'vendor-pdf': ['jspdf', 'html2canvas'],
          
          // Spreadsheet Processing
          'vendor-excel': ['exceljs', 'file-saver'],
          
          // State Management
          'vendor-state': ['zustand'],
          
          // Utilities
          'vendor-utils': ['clsx', 'class-variance-authority', 'tailwind-merge', 'tailwind-variants'],
          
          // Crypto utilities
          'vendor-crypto': ['crypto-js', 'jwt-decode'],
          
          // Application Modules - Phase 2 Decomposed Components
          'portfolio': [
            './src/pages/Portfolio.tsx',
            './src/components/portfolio/PropertyAnalysisModal.tsx',
            './src/components/portfolio/AddPropertyModal.tsx',
            './src/components/portfolio/PropertyCard.tsx',
            './src/components/portfolio/AnalyticsView.tsx',
            './src/components/portfolio/ComparisonView.tsx',
            './src/components/portfolio/PortfolioSummary.tsx',
            './src/components/portfolio/BulkActionsModal.tsx',
            './src/components/portfolio/PropertyFilters.tsx',
            './src/components/portfolio/PropertyList.tsx',
          ],
          
          'dashboard': [
            './src/pages/Dashboard.tsx',
            './src/components/BusinessIntelligenceDashboard.tsx',
            './src/components/charts/AIBriefingDashboard.tsx',
          ],
          
          'reports': [
            './src/pages/Reports.tsx',
            './src/components/ReportPreview.tsx',
            './src/components/LazyReportPreview.tsx',
            './src/components/AdvancedReporting.tsx',
            './src/services/pdfExportService.ts',
          ],
          
          'appeals': [
            './src/pages/Appeals.tsx',
            './src/components/AutomatedFiling.tsx',
            './src/components/TaxAttorneyWorkflow.tsx',
          ],
          
          'valuation': [
            './src/components/ValuationTabs.tsx',
            './src/components/valuation/IncomeApproach.tsx',
            './src/components/valuation/SalesComparisonApproach.tsx',
            './src/components/valuation/CostApproach.tsx',
            './src/components/valuation/Reconciliation.tsx',
          ],
          
          'charts-components': [
            './src/components/charts/SuccessProbabilityChart.tsx',
            './src/components/charts/MarketFactorsChart.tsx',
            './src/components/charts/FinancialImpactChart.tsx',
            './src/components/charts/FinancialMetricsChart.tsx',
            './src/components/charts/OptimizedChartWrapper.tsx',
          ],
          
          'ai-services': [
            './src/services/marketDataService.ts',
            './src/services/aiAnalysisService.ts',
            './src/services/iaaoComplianceService.ts',
            './src/services/cacheService.ts',
            './src/services/jurisdictionService.ts',
            './src/services/propertyTypeService.ts',
          ],
        },
        
        // File naming strategy for cache optimization
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId && facadeModuleId.includes('node_modules')) {
            return 'vendor/[name].[hash].js'
          }
          return 'assets/[name].[hash].js'
        },
        assetFileNames: (assetInfo) => {
          const fileName = assetInfo.names?.[0] || assetInfo.name || 'asset'
          const info = fileName.split('.')
          const ext = info[info.length - 1]
          if (/\.(css)$/.test(fileName)) {
            return 'assets/css/[name].[hash].[ext]'
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(fileName)) {
            return 'assets/images/[name].[hash].[ext]'
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(fileName)) {
            return 'assets/fonts/[name].[hash].[ext]'
          }
          return `assets/${ext}/[name].[hash].[ext]`
        },
        entryFileNames: 'assets/[name].[hash].js',
      },
      
      // External dependencies (if using CDN)
      external: [],
    },
    
    // Performance budgets - Apple CTO Standards
    chunkSizeWarningLimit: 1000, // 1MB max per chunk
    assetsInlineLimit: 4096, // 4KB inline limit
    
    // CSS optimization
    cssCodeSplit: true,
  },
  
  // Production server configuration
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  
  // Production preview server
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
  },
  
  // Optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'lucide-react',
      'recharts',
    ],
    exclude: [
      // Exclude large dependencies that should be loaded dynamically
    ],
  },
  
  // Environment variables
  envPrefix: 'VITE_',
})