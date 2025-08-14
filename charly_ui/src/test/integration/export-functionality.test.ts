// Apple-Standard QA: PDF/Excel/Word Export Functionality Tests (Phase 2C)
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest'
import { 
  generatePDFReport,
  generateExcelReport,
  generateWordReport,
  exportToMultipleFormats
} from '@/services/pdfExportService'

// Mock dependencies
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    text: vi.fn(),
    addPage: vi.fn(),
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    rect: vi.fn(),
    line: vi.fn(),
    addImage: vi.fn(),
    save: vi.fn(),
    output: vi.fn().mockReturnValue('mock-pdf-data'),
    internal: {
      pageSize: { getWidth: () => 210, getHeight: () => 297 }
    }
  }))
}))

vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    toDataURL: () => 'data:image/png;base64,mockcanvasdata'
  })
}))

vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn().mockReturnValue({}),
    aoa_to_sheet: vi.fn().mockReturnValue({}),
    book_append_sheet: vi.fn(),
    json_to_sheet: vi.fn().mockReturnValue({})
  },
  write: vi.fn().mockReturnValue('mock-excel-data'),
  writeFile: vi.fn()
}))

vi.mock('file-saver', () => ({
  saveAs: vi.fn()
}))

describe('Export Functionality Tests - Phase 2C integration tests', () => {
  const mockReportData = {
    property: {
      address: '123 Test Street',
      county: 'Test County',
      assessedValue: 450000,
      marketValue: 520000,
      propertyType: 'Residential',
      squareFootage: 2500,
      yearBuilt: 2010,
      lotSize: 0.25,
      bedrooms: 4,
      bathrooms: 3
    },
    aiAnalysis: {
      successProbability: 85,
      keyStrengths: [
        'Market value significantly exceeds assessed value',
        'Strong comparable sales support lower valuation',
        'Property improvements not reflected in assessment'
      ],
      riskFactors: [
        'Limited recent comparable sales',
        'Assessment increase within normal range'
      ],
      marketFactors: {
        priceVariance: 12.5,
        marketCondition: 8.2,
        comparabilityStrength: 9.1,
        dataQuality: 8.8
      },
      propertyFactors: {
        assessmentRatio: 86.5,
        ageAndCondition: 7.5,
        uniquenessScore: 6.2,
        improvementAccuracy: 8.9
      }
    },
    marketPositioning: {
      recommendation: 'Proceed with formal appeal',
      strategicApproach: 'Focus on market analysis and comparable sales methodology',
      keyArguments: [
        'Assessment exceeds market value by 13.5%',
        'Comparable properties support 15% reduction',
        'Market conditions favor taxpayer position'
      ],
      potentialChallenges: [
        'Assessor may argue recent improvements',
        'Limited number of truly comparable sales'
      ]
    },
    iaaoCompliance: {
      overallScore: 92,
      standardsAnalysis: [
        { standard: 'Standard 1: Equity', score: 95, status: 'Excellent' },
        { standard: 'Standard 2: Market Value', score: 88, status: 'Good' },
        { standard: 'Standard 6: Personal Property', score: 94, status: 'Excellent' }
      ]
    },
    charts: {
      successProbability: 'data:image/png;base64,mockchartdata',
      marketFactors: 'data:image/png;base64,mockchartdata',
      financialImpact: 'data:image/png;base64,mockchartdata'
    }
  }

  beforeAll(() => {
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('PDF Export Functionality', () => {
    it('should generate PDF report successfully', async () => {
      const result = await generatePDFReport(mockReportData)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.filename).toMatch(/\.pdf$/)
      expect(result.size).toBeGreaterThan(0)
    })

    it('should include all required sections in PDF', async () => {
      const result = await generatePDFReport(mockReportData)

      expect(result.success).toBe(true)
      expect(result.sections).toContain('executive-summary')
      expect(result.sections).toContain('property-details')
      expect(result.sections).toContain('ai-analysis')
      expect(result.sections).toContain('market-positioning')
      expect(result.sections).toContain('iaao-compliance')
      expect(result.sections).toContain('charts-visualizations')
    })

    it('should handle PDF generation errors gracefully', async () => {
      // Simulate PDF generation error
      const mockError = new Error('PDF generation failed')
      vi.mocked(jsPDF).mockImplementation(() => {
        throw mockError
      })

      const result = await generatePDFReport(mockReportData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('PDF generation failed')
    })

    it('should maintain proper page layout and formatting', async () => {
      const result = await generatePDFReport(mockReportData)

      expect(result.success).toBe(true)
      expect(result.pageCount).toBeGreaterThan(0)
      expect(result.pageCount).toBeLessThan(20) // Reasonable page limit
    })

    it('should include embedded charts in PDF', async () => {
      const result = await generatePDFReport(mockReportData)

      expect(result.success).toBe(true)
      expect(result.hasCharts).toBe(true)
      expect(result.chartCount).toBeGreaterThan(0)
    })
  })

  describe('Excel Export Functionality', () => {
    it('should generate Excel report successfully', async () => {
      const result = await generateExcelReport(mockReportData)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.filename).toMatch(/\.xlsx$/)
      expect(result.size).toBeGreaterThan(0)
    })

    it('should include multiple worksheets', async () => {
      const result = await generateExcelReport(mockReportData)

      expect(result.success).toBe(true)
      expect(result.worksheets).toContain('Summary')
      expect(result.worksheets).toContain('Property Details')
      expect(result.worksheets).toContain('AI Analysis')
      expect(result.worksheets).toContain('Market Data')
      expect(result.worksheets).toContain('IAAO Compliance')
    })

    it('should format data correctly for Excel', async () => {
      const result = await generateExcelReport(mockReportData)

      expect(result.success).toBe(true)
      expect(result.dataRows).toBeGreaterThan(0)
      expect(result.hasFormulas).toBe(true)
      expect(result.hasFormatting).toBe(true)
    })

    it('should handle Excel generation errors gracefully', async () => {
      // Simulate Excel generation error
      vi.mocked(XLSX.write).mockImplementation(() => {
        throw new Error('Excel generation failed')
      })

      const result = await generateExcelReport(mockReportData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Excel generation failed')
    })
  })

  describe('Word Export Functionality', () => {
    it('should generate Word document successfully', async () => {
      const result = await generateWordReport(mockReportData)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.filename).toMatch(/\.docx$/)
      expect(result.size).toBeGreaterThan(0)
    })

    it('should include proper document structure', async () => {
      const result = await generateWordReport(mockReportData)

      expect(result.success).toBe(true)
      expect(result.sections).toContain('title-page')
      expect(result.sections).toContain('executive-summary')
      expect(result.sections).toContain('detailed-analysis')
      expect(result.sections).toContain('recommendations')
      expect(result.sections).toContain('appendices')
    })

    it('should maintain professional formatting', async () => {
      const result = await generateWordReport(mockReportData)

      expect(result.success).toBe(true)
      expect(result.hasHeaders).toBe(true)
      expect(result.hasFooters).toBe(true)
      expect(result.hasTables).toBe(true)
      expect(result.pageCount).toBeGreaterThan(0)
    })

    it('should handle Word generation errors gracefully', async () => {
      const result = await generateWordReport({})

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Multi-Format Export', () => {
    it('should export to all formats simultaneously', async () => {
      const result = await exportToMultipleFormats(mockReportData, ['pdf', 'excel', 'word'])

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.exports).toHaveProperty('pdf')
      expect(result.exports).toHaveProperty('excel')
      expect(result.exports).toHaveProperty('word')
      
      expect(result.exports.pdf.success).toBe(true)
      expect(result.exports.excel.success).toBe(true)
      expect(result.exports.word.success).toBe(true)
    })

    it('should handle partial failures in multi-format export', async () => {
      // Mock one format to fail
      vi.mocked(XLSX.write).mockImplementation(() => {
        throw new Error('Excel generation failed')
      })

      const result = await exportToMultipleFormats(mockReportData, ['pdf', 'excel', 'word'])

      expect(result.success).toBe(false)
      expect(result.exports.pdf.success).toBe(true)
      expect(result.exports.excel.success).toBe(false)
      expect(result.exports.word.success).toBe(true)
      expect(result.partialSuccess).toBe(true)
    })

    it('should provide download bundle for successful exports', async () => {
      const result = await exportToMultipleFormats(mockReportData, ['pdf', 'excel', 'word'])

      expect(result.success).toBe(true)
      expect(result.bundle).toBeDefined()
      expect(result.bundle.filename).toMatch(/\.zip$/)
      expect(result.bundle.size).toBeGreaterThan(0)
    })
  })

  describe('Export Performance and Reliability', () => {
    it('should complete export within reasonable time', async () => {
      const startTime = Date.now()
      
      await Promise.all([
        generatePDFReport(mockReportData),
        generateExcelReport(mockReportData),
        generateWordReport(mockReportData)
      ])

      const endTime = Date.now()
      const duration = endTime - startTime

      // All exports should complete within 10 seconds
      expect(duration).toBeLessThan(10000)
    })

    it('should handle large datasets efficiently', async () => {
      const largeReportData = {
        ...mockReportData,
        aiAnalysis: {
          ...mockReportData.aiAnalysis,
          keyStrengths: Array(50).fill('Large dataset strength'),
          riskFactors: Array(30).fill('Large dataset risk factor')
        }
      }

      const result = await generatePDFReport(largeReportData)

      expect(result.success).toBe(true)
      expect(result.size).toBeLessThan(10 * 1024 * 1024) // Less than 10MB
    })

    it('should maintain consistent output format', async () => {
      const result1 = await generatePDFReport(mockReportData)
      const result2 = await generatePDFReport(mockReportData)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result1.pageCount).toBe(result2.pageCount)
      expect(result1.sections.length).toBe(result2.sections.length)
    })
  })

  describe('Security and Data Integrity', () => {
    it('should sanitize input data for export', async () => {
      const maliciousData = {
        ...mockReportData,
        property: {
          ...mockReportData.property,
          address: '<script>alert("xss")</script>123 Test St'
        }
      }

      const result = await generatePDFReport(maliciousData)

      expect(result.success).toBe(true)
      expect(result.sanitized).toBe(true)
      expect(result.securityWarnings).toBeDefined()
    })

    it('should not expose sensitive data in exports', async () => {
      const sensitiveData = {
        ...mockReportData,
        internal: {
          apiKey: 'secret-key',
          userId: 'internal-user-id'
        }
      }

      const result = await generatePDFReport(sensitiveData)

      expect(result.success).toBe(true)
      expect(result.data).not.toContain('secret-key')
      expect(result.data).not.toContain('internal-user-id')
    })

    it('should validate file size limits', async () => {
      const result = await generatePDFReport(mockReportData)

      expect(result.success).toBe(true)
      expect(result.size).toBeLessThan(50 * 1024 * 1024) // Less than 50MB
      expect(result.withinSizeLimits).toBe(true)
    })
  })

  describe('Error Recovery and Fallbacks', () => {
    it('should provide fallback when chart generation fails', async () => {
      const dataWithBadCharts = {
        ...mockReportData,
        charts: {
          successProbability: null,
          marketFactors: 'invalid-data',
          financialImpact: undefined
        }
      }

      const result = await generatePDFReport(dataWithBadCharts)

      expect(result.success).toBe(true)
      expect(result.warnings).toContain('Chart generation failed, using fallback')
    })

    it('should handle missing required data gracefully', async () => {
      const incompleteData = {
        property: {
          address: '123 Test St'
          // Missing other required fields
        }
      }

      const result = await generatePDFReport(incompleteData)

      expect(result.success).toBe(true)
      expect(result.warnings).toBeDefined()
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })
})