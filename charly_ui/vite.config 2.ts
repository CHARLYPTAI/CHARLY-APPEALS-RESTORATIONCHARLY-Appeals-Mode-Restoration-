import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',  // Use relative paths for static hosting
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Apple-standard bundle optimization
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries - Phase 2D optimization
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react'],
          'vendor-charts': ['recharts'],
          'vendor-pdf': ['jspdf', 'html2canvas'],
          'vendor-excel': ['xlsx', 'file-saver'],
          'vendor-state': ['zustand'],
          
          // Application chunks - Strategic splitting
          'reports': [
            './src/components/ReportPreview.tsx',
            './src/components/LazyReportPreview.tsx',
            './src/services/pdfExportService.ts'
          ],
          'charts-components': [
            './src/components/charts/SuccessProbabilityChart.tsx',
            './src/components/charts/MarketFactorsChart.tsx',
            './src/components/charts/FinancialImpactChart.tsx'
          ],
          'ai-services': [
            './src/services/marketDataService.ts',
            './src/services/aiAnalysisService.ts',
            './src/services/iaaoComplianceService.ts',
            './src/services/cacheService.ts'
          ],
          'portfolio': ['./src/pages/Portfolio.tsx'],
          'dashboard': ['./src/pages/Dashboard.tsx'],
          'valuation': ['./src/components/ValuationTabs.tsx']
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Apple standard: 1MB max chunks
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    // Temporarily disable proxy to allow frontend-only testing
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:8000',
    //     changeOrigin: true,
    //   },
    // },
  },
})
