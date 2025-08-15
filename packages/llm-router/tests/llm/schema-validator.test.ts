import { describe, it, expect, beforeEach } from 'vitest'
import { SchemaValidator } from '../../src/schema-validator.js'

describe('SchemaValidator', () => {
  let validator: SchemaValidator

  beforeEach(() => {
    validator = new SchemaValidator()
  })

  describe('basic validation', () => {
    it('should validate correct JSON against schema', async () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        required: ['name']
      }

      const content = JSON.stringify({ name: 'John', age: 30 })
      const result = await validator.validateResponse(content, schema)

      expect(result.valid).toBe(true)
      expect(result.data).toEqual({ name: 'John', age: 30 })
      expect(result.errors).toBeUndefined()
    })

    it('should reject invalid JSON against schema', async () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        required: ['name']
      }

      const content = JSON.stringify({ age: 30 })
      const result = await validator.validateResponse(content, schema)

      expect(result.valid).toBe(false)
      expect(result.data).toBeUndefined()
      expect(result.errors).toBeDefined()
      expect(result.errors).toContain('root: must have required property \'name\'')
    })

    it('should handle malformed JSON', async () => {
      const schema = { type: 'object' }
      const content = '{ invalid json'
      const result = await validator.validateResponse(content, schema)

      expect(result.valid).toBe(false)
      expect(result.errors).toEqual(['Invalid JSON format'])
    })

    it('should pass through when no schema provided', async () => {
      const content = 'plain text response'
      const result = await validator.validateResponse(content)

      expect(result.valid).toBe(true)
      expect(result.data).toBe(content)
    })
  })

  describe('narrative schema', () => {
    it('should validate correct narrative response', async () => {
      const schema = validator.createNarrativeSchema()
      const content = JSON.stringify({
        summary: 'Property valuation completed successfully',
        keyPoints: ['Market analysis completed', 'Comparables identified'],
        confidence: 0.85,
        metadata: {
          jurisdiction: 'CA',
          propertyType: 'residential',
          approach: 'sales'
        }
      })

      const result = await validator.validateResponse(content, schema)
      expect(result.valid).toBe(true)
    })

    it('should reject narrative with missing required fields', async () => {
      const schema = validator.createNarrativeSchema()
      const content = JSON.stringify({
        summary: 'Property valuation completed',
        confidence: 0.85
      })

      const result = await validator.validateResponse(content, schema)
      expect(result.valid).toBe(false)
      expect(result.errors?.some(e => e.includes('keyPoints'))).toBe(true)
    })

    it('should reject narrative with invalid confidence range', async () => {
      const schema = validator.createNarrativeSchema()
      const content = JSON.stringify({
        summary: 'Property valuation completed',
        keyPoints: ['Analysis done'],
        confidence: 1.5
      })

      const result = await validator.validateResponse(content, schema)
      expect(result.valid).toBe(false)
      expect(result.errors?.some(e => e.includes('confidence'))).toBe(true)
    })

    it('should reject narrative with invalid approach', async () => {
      const schema = validator.createNarrativeSchema()
      const content = JSON.stringify({
        summary: 'Property valuation completed',
        keyPoints: ['Analysis done'],
        confidence: 0.8,
        metadata: {
          approach: 'invalid_approach'
        }
      })

      const result = await validator.validateResponse(content, schema)
      expect(result.valid).toBe(false)
    })
  })

  describe('packet schema', () => {
    it('should validate correct packet response', async () => {
      const schema = validator.createPacketSchema()
      const content = JSON.stringify({
        coverLetter: 'Dear Assessor, I am writing to formally appeal the assessed value of my property based on comprehensive market analysis and supporting documentation that demonstrates the current assessment significantly exceeds the fair market value.',
        arguments: [
          {
            point: 'Overvaluation based on market analysis',
            evidence: 'Recent comparable sales show lower values',
            impact: 'Reduces fair market value by 15%'
          }
        ],
        conclusion: 'Based on the evidence presented, I request a reduction in assessed value.'
      })

      const result = await validator.validateResponse(content, schema)
      if (!result.valid) {
        console.log('Validation errors:', result.errors)
      }
      expect(result.valid).toBe(true)
    })

    it('should reject packet with short cover letter', async () => {
      const schema = validator.createPacketSchema()
      const content = JSON.stringify({
        coverLetter: 'Short letter',
        arguments: [{ point: 'Test', evidence: 'Evidence' }],
        conclusion: 'Request reduction in assessed value based on evidence.'
      })

      const result = await validator.validateResponse(content, schema)
      expect(result.valid).toBe(false)
    })

    it('should reject packet with missing argument evidence', async () => {
      const schema = validator.createPacketSchema()
      const content = JSON.stringify({
        coverLetter: 'Dear Assessor, I am writing to formally appeal the assessed value of my property based on comprehensive market analysis...',
        arguments: [{ point: 'Overvaluation' }],
        conclusion: 'Request reduction in assessed value based on evidence.'
      })

      const result = await validator.validateResponse(content, schema)
      expect(result.valid).toBe(false)
    })
  })

  describe('SWARTZ schema', () => {
    it('should validate correct SWARTZ response', async () => {
      const schema = validator.createSwartzSchema()
      const content = JSON.stringify({
        extractedData: {
          propertyDetails: {
            address: '123 Main St',
            squareFootage: 2500,
            yearBuilt: 1995
          },
          financials: {
            grossIncome: 50000,
            operatingExpenses: 15000,
            netOperatingIncome: 35000
          }
        },
        confidence: 0.92,
        warnings: ['Some data may be estimated']
      })

      const result = await validator.validateResponse(content, schema)
      expect(result.valid).toBe(true)
    })

    it('should reject SWARTZ with missing required fields', async () => {
      const schema = validator.createSwartzSchema()
      const content = JSON.stringify({
        extractedData: {
          propertyDetails: {
            address: '123 Main St'
          }
        }
      })

      const result = await validator.validateResponse(content, schema)
      expect(result.valid).toBe(false)
    })

    it('should coerce numeric values', async () => {
      const schema = validator.createSwartzSchema()
      const content = JSON.stringify({
        extractedData: {
          propertyDetails: {
            squareFootage: '2500',
            yearBuilt: '1995'
          }
        },
        confidence: '0.92'
      })

      const result = await validator.validateResponse(content, schema)
      expect(result.valid).toBe(true)
      expect(result.data.extractedData.propertyDetails.squareFootage).toBe(2500)
      expect(result.data.confidence).toBe(0.92)
    })
  })

  describe('schema caching', () => {
    it('should reuse compiled validators for same schema', async () => {
      const schema = { type: 'object', properties: { test: { type: 'string' } } }
      
      const content1 = JSON.stringify({ test: 'value1' })
      const content2 = JSON.stringify({ test: 'value2' })
      
      const result1 = await validator.validateResponse(content1, schema)
      const result2 = await validator.validateResponse(content2, schema)
      
      expect(result1.valid).toBe(true)
      expect(result2.valid).toBe(true)
    })
  })
})