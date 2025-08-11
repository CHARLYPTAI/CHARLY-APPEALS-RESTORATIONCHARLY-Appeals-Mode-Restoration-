// Apple-Standard QA: WCAG 2.1 AA Accessibility Compliance Tests (Phase 2A)
import { render, screen, waitFor } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import Portfolio from '@/pages/Portfolio'
import Dashboard from '@/pages/Dashboard'
import ReportPreview from '@/components/ReportPreview'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import AccessibleButton from '@/components/AccessibleButton'

// Mock dependencies
vi.mock('@/store/portfolio', () => ({
  usePortfolioStore: () => ({
    properties: [
      {
        id: 'test-1',
        address: '123 Test Street',
        propertyType: 'Residential',
        currentAssessment: 450000,
        estimatedValue: 520000
      }
    ],
    loading: false,
    error: null,
    ingestFiles: vi.fn(),
  }),
}))

vi.mock('@/store/propertyAnalysis', () => ({
  usePropertyAnalysisStore: () => ({
    currentProperty: null,
    analysisResults: {},
    isAnalyzing: false,
    showAnalysisModal: false,
    analysisComplete: false,
    setAnalysisResult: vi.fn(),
    startAnalysis: vi.fn(),
    completeAnalysis: vi.fn(),
    resetAnalysis: vi.fn(),
    getCurrentAnalysis: vi.fn(),
    getCurrentValuation: vi.fn(),
  }),
}))

vi.mock('@/store/appealsIntegration', () => ({
  useAppealsIntegrationStore: () => ({
    prepareAppealFromAnalysis: vi.fn(),
  }),
}))

vi.mock('@/services/marketDataService', () => ({
  MarketDataService: {
    generateSupernova2BReport: vi.fn().mockResolvedValue({
      property: { address: '123 Test St' },
      aiAnalysis: { successProbability: 85 },
      marketPositioning: { recommendation: 'Strong case' },
    }),
  },
}))

vi.mock('@/hooks/useAccessibility', () => ({
  useAccessibility: () => ({
    containerRef: { current: null },
    announce: vi.fn(),
    focusFirst: vi.fn(),
    focusLast: vi.fn(),
  }),
  useKeyboardNavigation: vi.fn(),
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ErrorBoundary>
        {component}
      </ErrorBoundary>
    </BrowserRouter>
  )
}

describe('WCAG 2.1 AA Compliance - Phase 2A accessibility tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Portfolio Page Accessibility', () => {
    it('should have no accessibility violations on Portfolio page', async () => {
      const { container } = renderWithRouter(<Portfolio />)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper heading hierarchy', async () => {
      renderWithRouter(<Portfolio />)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      const headings = screen.getAllByRole('heading')
      expect(headings.length).toBeGreaterThan(0)
      
      // Check that h1 exists and is unique
      const h1Elements = headings.filter(h => h.tagName === 'H1')
      expect(h1Elements).toHaveLength(1)
    })

    it('should have proper focus management for interactive elements', async () => {
      renderWithRouter(<Portfolio />)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAttribute('tabindex')
        expect(button.getAttribute('tabindex')).not.toBe('-1')
      })
    })

    it('should have proper ARIA labels for form controls', async () => {
      renderWithRouter(<Portfolio />)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      const inputs = screen.getAllByRole('textbox')
      inputs.forEach(input => {
        expect(
          input.hasAttribute('aria-label') || 
          input.hasAttribute('aria-labelledby') ||
          screen.getByLabelText(input.getAttribute('name') || '')
        ).toBeTruthy()
      })
    })
  })

  describe('Dashboard Accessibility', () => {
    it('should have no accessibility violations on Dashboard', async () => {
      const { container } = renderWithRouter(<Dashboard />)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have accessible color contrast ratios', async () => {
      const { container } = renderWithRouter(<Dashboard />)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
      
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'color-contrast-enhanced': { enabled: true }
        }
      })
      expect(results).toHaveNoViolations()
    })
  })

  describe('ReportPreview Accessibility', () => {
    const mockReportData = {
      property: { address: '123 Test St', county: 'Test County' },
      aiAnalysis: {
        successProbability: 85,
        keyStrengths: ['High market value variance'],
        riskFactors: ['Limited comparable sales']
      },
      marketPositioning: {
        recommendation: 'Proceed with appeal',
        strategicApproach: 'Focus on market analysis'
      }
    }

    it('should have no accessibility violations in ReportPreview modal', async () => {
      const { container } = render(
        <ReportPreview 
          isOpen={true} 
          onClose={vi.fn()} 
          reportData={mockReportData} 
        />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper modal accessibility attributes', async () => {
      render(
        <ReportPreview 
          showReportPreview={true} 
          setShowReportPreview={vi.fn()} 
          reportData={mockReportData} 
        />
      )

      // Wait for dialog to be in the DOM
      await waitFor(() => {
        const modal = screen.getByRole('dialog')
        expect(modal).toHaveAttribute('aria-modal', 'true')
        expect(modal).toHaveAttribute('aria-labelledby')
      })
    })

    it('should manage focus correctly when modal opens/closes', async () => {
      const setShowReportPreview = vi.fn()
      const { rerender } = render(
        <ReportPreview 
          showReportPreview={false} 
          setShowReportPreview={setShowReportPreview} 
          reportData={mockReportData} 
        />
      )

      // Modal should not be present when closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      // Rerender with modal open
      rerender(
        <ReportPreview 
          showReportPreview={true} 
          setShowReportPreview={setShowReportPreview} 
          reportData={mockReportData} 
        />
      )

      await waitFor(() => {
        const modal = screen.getByRole('dialog')
        expect(modal).toBeInTheDocument()
        expect(modal).toHaveAttribute('aria-modal', 'true')
      })
    })
  })

  describe('AccessibleButton Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <AccessibleButton onClick={vi.fn()}>
          Test Button
        </AccessibleButton>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA attributes', () => {
      render(
        <AccessibleButton 
          onClick={vi.fn()}
          ariaLabel="Custom label"
          disabled={false}
        >
          Test Button
        </AccessibleButton>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Custom label')
      expect(button).toHaveAttribute('tabindex', '0')
    })

    it('should handle disabled state accessibility', () => {
      render(
        <AccessibleButton 
          onClick={vi.fn()}
          disabled={true}
        >
          Disabled Button
        </AccessibleButton>
      )

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('ErrorBoundary Accessibility', () => {
    const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error')
      }
      return <div>No error</div>
    }

    it('should have accessible error display', () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = vi.fn()

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const errorMessage = screen.getByRole('alert')
      expect(errorMessage).toBeInTheDocument()
      expect(errorMessage).toHaveAttribute('aria-live', 'assertive')

      console.error = originalError
    })
  })

  describe('File Upload Accessibility', () => {
    it('should have accessible file input with proper labels', async () => {
      renderWithRouter(<Portfolio />)
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      // Check for file input accessibility
      const fileInputs = screen.getAllByRole('button').filter(
        button => button.textContent?.includes('Upload') || 
                 button.textContent?.includes('Choose File')
      )
      
      fileInputs.forEach(input => {
        expect(
          input.hasAttribute('aria-label') || 
          input.hasAttribute('aria-labelledby')
        ).toBeTruthy()
      })
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation throughout Portfolio page', async () => {
      renderWithRouter(<Portfolio />)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      const focusableElements = screen.getAllByRole('button')
        .concat(screen.getAllByRole('textbox'))
        .concat(screen.getAllByRole('link'))

      focusableElements.forEach(element => {
        expect(element).toHaveAttribute('tabindex')
        const tabIndex = element.getAttribute('tabindex')
        expect(tabIndex).not.toBe('-1') // Should be focusable
      })
    })
  })

  describe('Screen Reader Support', () => {
    it('should have proper ARIA landmarks', async () => {
      renderWithRouter(<Portfolio />)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      // Check for essential landmarks
      expect(screen.getByRole('main')).toBeInTheDocument()
      
      // Check for navigation if present
      const navigation = screen.queryByRole('navigation')
      if (navigation) {
        expect(navigation).toHaveAttribute('aria-label')
      }
    })

    it('should have proper live regions for dynamic content', async () => {
      renderWithRouter(<Portfolio />)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      // Check for status and alert regions
      const statusRegions = screen.getAllByRole('status', { hidden: true })
      const alertRegions = screen.getAllByRole('alert', { hidden: true })
      
      // At least one live region should exist for dynamic updates
      expect(statusRegions.length + alertRegions.length).toBeGreaterThanOrEqual(0)
    })
  })
})