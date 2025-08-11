// Apple-Standard QA: AI Analysis Service Integration Tests (Phase 2B)
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest'
import { 
  analyzeSuccessProbability,
  selectSmartComparables,
  enhanceMarketPositioning,
  generateComprehensiveInsights
} from '@/services/aiAnalysisService'
import type { MarketDataRequest } from '@/services/marketDataService'

describe('AI Analysis Service Integration Tests - Phase 2B integration tests', () => {
  const mockPropertyData: MarketDataRequest = {
    address: '123 Test Street',
    county: 'Test County',
    assessedValue: 450000,
    marketValue: 520000,
    propertyType: 'Residential',
    squareFootage: 2500,
    yearBuilt: 2010,
    lotSize: 0.25,
    bedrooms: 4,
    bathrooms: 3,
    comparables: [
      {
        id: 'comp1',
        address: '125 Test Street',
        salePrice: 485000,
        saleDate: '2024-01-15',
        squareFootage: 2400,
        adjustedValue: 495000,
        distanceFromSubject: 0.1,
        marketConditionScore: 8.5,
        comparabilityScore: 9.2
      },
      {
        id: 'comp2', 
        address: '127 Test Street',
        salePrice: 510000,
        saleDate: '2024-02-20',
        squareFootage: 2600,
        adjustedValue: 505000,
        distanceFromSubject: 0.15,
        marketConditionScore: 8.7,
        comparabilityScore: 8.8
      },
      {
        id: 'comp3',
        address: '200 Different Road',
        salePrice: 420000,
        saleDate: '2023-11-10',
        squareFootage: 2200,
        adjustedValue: 440000,
        distanceFromSubject: 1.2,
        marketConditionScore: 6.5,
        comparabilityScore: 6.1
      }
    ]
  }

  beforeAll(() => {
    // Mock console methods to reduce test noise
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Success Probability Analysis', () => {
    it('should generate comprehensive success probability model', async () => {
      const result = await analyzeSuccessProbability(mockPropertyData)

      expect(result).toBeDefined()
      expect(result.overallProbability).toBeGreaterThan(0)
      expect(result.overallProbability).toBeLessThanOrEqual(100)
      
      // Validate model structure
      expect(result).toHaveProperty('baseSuccessRate')
      expect(result).toHaveProperty('marketFactors')
      expect(result).toHaveProperty('propertyFactors')
      expect(result).toHaveProperty('jurisdictionFactors')
      expect(result).toHaveProperty('timingFactors')
      expect(result).toHaveProperty('confidenceInterval')
      expect(result).toHaveProperty('keyRiskFactors')
      expect(result).toHaveProperty('strengthIndicators')

      // Validate market factors
      expect(result.marketFactors).toHaveProperty('priceVariance')
      expect(result.marketFactors).toHaveProperty('marketCondition')
      expect(result.marketFactors).toHaveProperty('comparabilityStrength')
      expect(result.marketFactors).toHaveProperty('dataQuality')

      // Validate confidence interval
      expect(result.confidenceInterval).toHaveLength(2)
      expect(result.confidenceInterval[0]).toBeLessThan(result.confidenceInterval[1])
    })

    it('should handle edge cases in success probability calculation', async () => {
      const edgeCaseData = {
        ...mockPropertyData,
        assessedValue: 1000000,
        marketValue: 800000, // Over-assessed property
        comparables: []
      }

      const result = await analyzeSuccessProbability(edgeCaseData)

      expect(result).toBeDefined()
      expect(result.overallProbability).toBeGreaterThan(0)
      expect(result.keyRiskFactors.length).toBeGreaterThan(0)
    })

    it('should provide meaningful risk factors and strengths', async () => {
      const result = await analyzeSuccessProbability(mockPropertyData)

      expect(Array.isArray(result.keyRiskFactors)).toBe(true)
      expect(Array.isArray(result.strengthIndicators)).toBe(true)
      
      // At least one of these should be populated for a realistic analysis
      expect(result.keyRiskFactors.length + result.strengthIndicators.length).toBeGreaterThan(0)
    })
  })

  describe('Smart Comparable Selection', () => {
    it('should intelligently select and rank comparables', async () => {
      const result = await selectSmartComparables(mockPropertyData)

      expect(result).toBeDefined()
      expect(result).toHaveProperty('selectedComparables')
      expect(result).toHaveProperty('rejectedComparables')
      expect(result).toHaveProperty('selectionStrategy')
      expect(result).toHaveProperty('weightingApproach')

      // Should select best comparables and reject weak ones
      expect(result.selectedComparables.length).toBeGreaterThan(0)
      expect(result.rejectedComparables.length).toBeGreaterThan(0)

      // Validate comparable structure
      result.selectedComparables.forEach(comp => {
        expect(comp).toHaveProperty('id')
        expect(comp).toHaveProperty('address')
        expect(comp).toHaveProperty('weight')
        expect(comp).toHaveProperty('relevanceScore')
        expect(comp).toHaveProperty('strengthRating')
        expect(comp).toHaveProperty('adjustmentReliability')
        expect(comp).toHaveProperty('persuasionValue')
        expect(comp).toHaveProperty('reasoning')

        expect(comp.weight).toBeGreaterThan(0)
        expect(comp.weight).toBeLessThanOrEqual(1)
        expect(comp.relevanceScore).toBeGreaterThan(0)
        expect(comp.relevanceScore).toBeLessThanOrEqual(100)
        expect(['Excellent', 'Good', 'Fair', 'Weak']).toContain(comp.strengthRating)
      })
    })

    it('should handle cases with limited comparables', async () => {
      const limitedData = {
        ...mockPropertyData,
        comparables: [mockPropertyData.comparables[0]] // Only one comparable
      }

      const result = await selectSmartComparables(limitedData)

      expect(result).toBeDefined()
      expect(result.selectedComparables.length).toBeGreaterThan(0)
      expect(result.selectionStrategy).toContain('limited')
    })

    it('should provide strategic reasoning for selections', async () => {
      const result = await selectSmartComparables(mockPropertyData)

      expect(result.weightingApproach).toBeDefined()
      expect(typeof result.weightingApproach).toBe('string')
      expect(result.weightingApproach.length).toBeGreaterThan(10)

      result.selectedComparables.forEach(comp => {
        expect(Array.isArray(comp.reasoning)).toBe(true)
        expect(comp.reasoning.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Market Positioning Enhancement', () => {
    it('should generate strategic market positioning', async () => {
      const result = await enhanceMarketPositioning(mockPropertyData)

      expect(result).toBeDefined()
      expect(result).toHaveProperty('strategicApproach')
      expect(result).toHaveProperty('recommendation')
      expect(result).toHaveProperty('keyArguments')
      expect(result).toHaveProperty('potentialChallenges')
      expect(result).toHaveProperty('strengthsToEmphasize')
      expect(result).toHaveProperty('negotiationStrategy')

      // Validate strategic content
      expect(typeof result.strategicApproach).toBe('string')
      expect(result.strategicApproach.length).toBeGreaterThan(20)
      expect(Array.isArray(result.keyArguments)).toBe(true)
      expect(result.keyArguments.length).toBeGreaterThan(0)
    })

    it('should adapt strategy based on assessment ratio', async () => {
      const overAssessedData = {
        ...mockPropertyData,
        assessedValue: 600000,
        marketValue: 520000
      }

      const underAssessedData = {
        ...mockPropertyData,
        assessedValue: 400000,
        marketValue: 520000
      }

      const overResult = await enhanceMarketPositioning(overAssessedData)
      const underResult = await enhanceMarketPositioning(underAssessedData)

      expect(overResult.recommendation).not.toBe(underResult.recommendation)
      expect(overResult.strategicApproach).not.toBe(underResult.strategicApproach)
    })
  })

  describe('Comprehensive Insights Generation', () => {
    it('should generate holistic analysis combining all AI components', async () => {
      const result = await generateComprehensiveInsights(mockPropertyData)

      expect(result).toBeDefined()
      expect(result).toHaveProperty('executiveSummary')
      expect(result).toHaveProperty('appealStrength')
      expect(result).toHaveProperty('timelineRecommendation')
      expect(result).toHaveProperty('resourceRequirements')
      expect(result).toHaveProperty('alternativeStrategies')
      expect(result).toHaveProperty('riskMitigation')

      // Validate comprehensive analysis structure
      expect(typeof result.executiveSummary).toBe('string')
      expect(result.executiveSummary.length).toBeGreaterThan(50)
      
      expect(['Very Strong', 'Strong', 'Moderate', 'Weak', 'Very Weak']).toContain(result.appealStrength)
      
      expect(result.timelineRecommendation).toHaveProperty('urgency')
      expect(result.timelineRecommendation).toHaveProperty('optimalTiming')
      expect(result.timelineRecommendation).toHaveProperty('deadlineConsiderations')
    })

    it('should provide actionable recommendations', async () => {
      const result = await generateComprehensiveInsights(mockPropertyData)

      expect(Array.isArray(result.alternativeStrategies)).toBe(true)
      expect(result.alternativeStrategies.length).toBeGreaterThan(0)
      
      expect(Array.isArray(result.riskMitigation)).toBe(true)
      expect(result.riskMitigation.length).toBeGreaterThan(0)

      expect(result.resourceRequirements).toHaveProperty('estimatedHours')
      expect(result.resourceRequirements).toHaveProperty('expertiseNeeded')
      expect(result.resourceRequirements).toHaveProperty('documentationRequired')
    })
  })

  describe('Integration Error Handling', () => {
    it('should handle malformed property data gracefully', async () => {
      const malformedData = {
        address: '',
        county: null,
        assessedValue: -1,
        marketValue: 'invalid',
        comparables: null
      } as unknown as MarketDataRequest

      // These should not throw but return meaningful error responses
      await expect(async () => {
        await analyzeSuccessProbability(malformedData)
      }).not.toThrow()

      await expect(async () => {
        await selectSmartComparables(malformedData)
      }).not.toThrow()

      await expect(async () => {
        await enhanceMarketPositioning(malformedData)
      }).not.toThrow()
    })

    it('should handle missing comparables data', async () => {
      const noComparablesData = {
        ...mockPropertyData,
        comparables: []
      }

      const successResult = await analyzeSuccessProbability(noComparablesData)
      const comparableResult = await selectSmartComparables(noComparablesData)
      const positioningResult = await enhanceMarketPositioning(noComparablesData)

      expect(successResult).toBeDefined()
      expect(comparableResult).toBeDefined()
      expect(positioningResult).toBeDefined()

      // Should indicate data limitations
      expect(successResult.keyRiskFactors).toContain(expect.stringMatching(/comparable|data/i))
    })
  })

  describe('Performance and Reliability', () => {
    it('should complete analysis within reasonable time', async () => {
      const startTime = Date.now()
      
      await Promise.all([
        analyzeSuccessProbability(mockPropertyData),
        selectSmartComparables(mockPropertyData),
        enhanceMarketPositioning(mockPropertyData),
        generateComprehensiveInsights(mockPropertyData)
      ])

      const endTime = Date.now()
      const duration = endTime - startTime

      // All AI analysis should complete within 5 seconds
      expect(duration).toBeLessThan(5000)
    })

    it('should provide consistent results for identical inputs', async () => {
      const result1 = await analyzeSuccessProbability(mockPropertyData)
      const result2 = await analyzeSuccessProbability(mockPropertyData)

      // Core probability should be consistent (within reasonable variance)
      expect(Math.abs(result1.overallProbability - result2.overallProbability)).toBeLessThan(5)
      
      expect(result1.marketFactors.priceVariance).toBe(result2.marketFactors.priceVariance)
      expect(result1.propertyFactors.assessmentRatio).toBe(result2.propertyFactors.assessmentRatio)
    })
  })
})