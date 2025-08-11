// Apple-Standard QA: End-to-End Testing for Complete Supernova 2B Report Generation
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import Portfolio from '@/pages/Portfolio'
import ReportPreview from '@/components/ReportPreview'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { createMockReportData, createMinimalMockReportData } from '@/test/testUtils'
import { usePortfolioStore } from '@/store/portfolio'

// Mock all required services
vi.mock('@/services/marketDataService', () => ({
  generateSupernova2BReport: vi.fn().mockResolvedValue(createMockReportData())
}))

vi.mock('@/services/aiAnalysisService', () => ({
  analyzeSuccessProbability: vi.fn().mockResolvedValue({
    overallProbability: 85,
    marketFactors: { priceVariance: 12.5 },
    propertyFactors: { assessmentRatio: 86.5 },
    keyRiskFactors: ['Limited comparables'],
    strengthIndicators: ['Strong market position']
  }),
  generateComprehensiveInsights: vi.fn().mockResolvedValue({
    executiveSummary: 'Strong case for appeal based on market analysis',
    appealStrength: 'Strong',
    timelineRecommendation: {
      urgency: 'Moderate',
      optimalTiming: 'Within 30 days'
    }
  })
}))

vi.mock('@/store/portfolio', () => ({
  usePortfolioStore: vi.fn()
}))

vi.mock('@/services/pdfExportService', () => ({
  generatePDFReport: vi.fn().mockResolvedValue({
    success: true,
    data: 'mock-pdf-data',
    filename: 'supernova-report.pdf',
    size: 1024000
  }),
  generateExcelReport: vi.fn().mockResolvedValue({
    success: true,
    data: 'mock-excel-data',
    filename: 'supernova-report.xlsx',
    size: 512000
  })
}))

vi.mock('@/store/portfolio', () => ({
  usePortfolioStore: () => ({
    properties: [
      {
        id: 'test-1',
        address: '123 Test Street',
        county: 'Test County',
        assessedValue: 450000,
        marketValue: 520000,
        propertyType: 'Residential'
      }
    ],
    selectedProperty: {
      id: 'test-1',
      address: '123 Test Street',
      county: 'Test County',
      assessedValue: 450000,
      marketValue: 520000,
      propertyType: 'Residential'
    },
    isLoading: false,
    error: null,
    generateReport: vi.fn(),
    setSelectedProperty: vi.fn(),
    uploadFile: vi.fn().mockResolvedValue({ success: true })
  }),
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ErrorBoundary>
        {component}
      </ErrorBoundary>
    </BrowserRouter>
  )
}

describe('Supernova 2B Report Generation E2E Tests - e2e tests', () => {
  const user = userEvent.setup()

  beforeAll(() => {
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Report Generation Workflow', () => {
    it('should complete full Supernova 2B report generation from Portfolio page', async () => {
      renderWithProviders(<Portfolio />)

      // Wait for Portfolio page to load
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      // Find and click the Generate Supernova Report button
      const generateButton = await screen.findByRole('button', { 
        name: /generate supernova report/i 
      })
      expect(generateButton).toBeInTheDocument()

      // Click the generate button
      await user.click(generateButton)

      // Wait for report generation to complete
      await waitFor(() => {
        expect(screen.getByText(/generating report/i)).toBeInTheDocument()
      })

      // Verify that the report generation service was called
      const { generateSupernova2BReport } = await import('@/services/marketDataService')
      expect(generateSupernova2BReport).toHaveBeenCalledWith(
        expect.objectContaining({
          address: '123 Test Street',
          county: 'Test County'
        })
      )

      // Wait for ReportPreview modal to appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      }, { timeout: 10000 })

      // Verify modal content
      const modal = screen.getByRole('dialog')
      expect(within(modal).getByText(/supernova 2b analysis/i)).toBeInTheDocument()
    })

    it('should display comprehensive AI analysis results', async () => {
      const mockReportData = createMinimalMockReportData()

      render(
        <ReportPreview 
          showReportPreview={true} 
          setShowReportPreview={vi.fn()} 
          reportData={mockReportData} 
        />
      )

      // Verify AI analysis sections are displayed
      expect(screen.getByText(/success probability/i)).toBeInTheDocument()
      expect(screen.getByText(/75/)).toBeInTheDocument()
      expect(screen.getByText(/basic market analysis/i)).toBeInTheDocument()
      expect(screen.getByText(/consider appeal/i)).toBeInTheDocument()
    })

    it('should generate and display interactive charts', async () => {
      const mockReportData = createMockReportData()

      render(
        <ReportPreview 
          showReportPreview={true} 
          setShowReportPreview={vi.fn()} 
          reportData={mockReportData} 
        />
      )

      // Look for chart containers (charts are lazily loaded)
      await waitFor(() => {
        const chartContainers = screen.getAllByTestId(/chart|graph/i)
        expect(chartContainers.length).toBeGreaterThan(0)
      })
    })

    it('should validate IAAO compliance scoring', async () => {
      const mockReportData = createMockReportData()

      render(
        <ReportPreview 
          showReportPreview={true} 
          setShowReportPreview={vi.fn()} 
          reportData={mockReportData} 
        />
      )

      // Verify IAAO compliance section
      expect(screen.getByText(/iaao compliance/i)).toBeInTheDocument()
      expect(screen.getByText(/92/)).toBeInTheDocument()
      expect(screen.getByText(/standard 1.*equity/i)).toBeInTheDocument()
      expect(screen.getByText(/excellent/i)).toBeInTheDocument()
    })
  })

  describe('Export Functionality Integration', () => {
    it('should export report to PDF successfully', async () => {
      const mockReportData = createMinimalMockReportData()

      render(
        <ReportPreview 
          showReportPreview={true} 
          setShowReportPreview={vi.fn()} 
          reportData={mockReportData} 
        />
      )

      // Find and click PDF export button
      const pdfButton = await screen.findByRole('button', { 
        name: /export.*pdf/i 
      })
      expect(pdfButton).toBeInTheDocument()

      await user.click(pdfButton)

      // Verify PDF generation service was called
      const { generatePDFReport } = await import('@/services/pdfExportService')
      await waitFor(() => {
        expect(generatePDFReport).toHaveBeenCalledWith(mockReportData)
      })
    })

    it('should export report to Excel successfully', async () => {
      const mockReportData = createMinimalMockReportData()

      render(
        <ReportPreview 
          showReportPreview={true} 
          setShowReportPreview={vi.fn()} 
          reportData={mockReportData} 
        />
      )

      // Find and click Excel export button
      const excelButton = await screen.findByRole('button', { 
        name: /export.*excel/i 
      })
      expect(excelButton).toBeInTheDocument()

      await user.click(excelButton)

      // Verify Excel generation service was called
      const { generateExcelReport } = await import('@/services/pdfExportService')
      await waitFor(() => {
        expect(generateExcelReport).toHaveBeenCalledWith(mockReportData)
      })
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle report generation failures gracefully', async () => {
      // Mock service to throw error
      const { generateSupernova2BReport } = await import('@/services/marketDataService')
      vi.mocked(generateSupernova2BReport).mockRejectedValueOnce(
        new Error('API service unavailable')
      )

      renderWithProviders(<Portfolio />)

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      const generateButton = await screen.findByRole('button', { 
        name: /generate supernova report/i 
      })

      await user.click(generateButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/error.*generating.*report/i)).toBeInTheDocument()
      })

      // Should not show the report modal
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should handle missing property data gracefully', async () => {
      // Mock store with no selected property
      vi.mocked(usePortfolioStore).mockReturnValue({
        properties: [],
        selectedProperty: null,
        isLoading: false,
        error: null,
        generateReport: vi.fn(),
        setSelectedProperty: vi.fn()
      })

      renderWithProviders(<Portfolio />)

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      const generateButton = screen.queryByRole('button', { 
        name: /generate supernova report/i 
      })

      // Button should be disabled or show warning
      if (generateButton) {
        expect(generateButton).toBeDisabled()
      } else {
        expect(screen.getByText(/select.*property.*first/i)).toBeInTheDocument()
      }
    })

    it('should handle network failures with retry mechanism', async () => {
      let callCount = 0
      const { generateSupernova2BReport } = await import('@/services/marketDataService')
      vi.mocked(generateSupernova2BReport).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve(createMinimalMockReportData())
      })

      renderWithProviders(<Portfolio />)

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      const generateButton = await screen.findByRole('button', { 
        name: /generate supernova report/i 
      })

      await user.click(generateButton)

      // Should show retry option
      await waitFor(() => {
        expect(screen.getByText(/retry/i)).toBeInTheDocument()
      })

      // Click retry
      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      // Should eventually succeed
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })
  })

  describe('Performance and User Experience', () => {
    it('should show loading states during report generation', async () => {
      // Mock delayed response
      const { generateSupernova2BReport } = await import('@/services/marketDataService')
      vi.mocked(generateSupernova2BReport).mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve(createMinimalMockReportData()), 1000)
        )
      )

      renderWithProviders(<Portfolio />)

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      const generateButton = await screen.findByRole('button', { 
        name: /generate supernova report/i 
      })

      await user.click(generateButton)

      // Should show loading indicator
      expect(screen.getByText(/generating.*report/i)).toBeInTheDocument()
      
      // Should show progress indicator or spinner
      const loadingIndicator = screen.getByRole('progressbar') || 
                             screen.getByTestId('loading-spinner')
      expect(loadingIndicator).toBeInTheDocument()
    })

    it('should complete report generation within performance targets', async () => {
      const startTime = Date.now()

      renderWithProviders(<Portfolio />)

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      const generateButton = await screen.findByRole('button', { 
        name: /generate supernova report/i 
      })

      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000)
    })

    it('should handle concurrent report generations', async () => {
      renderWithProviders(<Portfolio />)

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      const generateButton = await screen.findByRole('button', { 
        name: /generate supernova report/i 
      })

      // Click multiple times rapidly
      await user.click(generateButton)
      await user.click(generateButton)
      await user.click(generateButton)

      // Should only trigger one generation
      const { generateSupernova2BReport } = await import('@/services/marketDataService')
      await waitFor(() => {
        expect(generateSupernova2BReport).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Accessibility and Usability', () => {
    it('should maintain focus management during report generation', async () => {
      renderWithProviders(<Portfolio />)

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      const generateButton = await screen.findByRole('button', { 
        name: /generate supernova report/i 
      })

      // Focus should be on the button
      generateButton.focus()
      expect(document.activeElement).toBe(generateButton)

      await user.click(generateButton)

      // After clicking, focus should move appropriately
      // (either to loading indicator or modal when it opens)
      await waitFor(() => {
        const activeElement = document.activeElement
        expect(activeElement).not.toBe(generateButton) // Focus should have moved
      })
    })

    it('should provide screen reader announcements', async () => {
      renderWithProviders(<Portfolio />)

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      const generateButton = await screen.findByRole('button', { 
        name: /generate supernova report/i 
      })

      await user.click(generateButton)

      // Should have live region announcements
      await waitFor(() => {
        const liveRegion = screen.getByRole('status') || screen.getByRole('alert')
        expect(liveRegion).toBeInTheDocument()
      })
    })

    it('should support keyboard navigation throughout the workflow', async () => {
      renderWithProviders(<Portfolio />)

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      // Tab to generate button
      await user.tab()
      
      // Press Enter to activate
      await user.keyboard('{Enter}')

      // Should trigger report generation
      const { generateSupernova2BReport } = await import('@/services/marketDataService')
      await waitFor(() => {
        expect(generateSupernova2BReport).toHaveBeenCalled()
      })
    })
  })
})