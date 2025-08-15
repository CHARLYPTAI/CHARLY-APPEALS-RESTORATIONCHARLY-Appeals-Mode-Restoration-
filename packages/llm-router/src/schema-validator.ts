import Ajv from 'ajv'
import type { JSONSchemaType, ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'

export class SchemaValidator {
  private ajv: Ajv
  private validators = new Map<string, ValidateFunction>()
  
  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      removeAdditional: 'all',
      useDefaults: true,
      coerceTypes: true
    })
    
    addFormats(this.ajv)
  }

  async validateResponse(content: string, schema?: object): Promise<{
    valid: boolean
    data?: any
    errors?: string[]
  }> {
    if (!schema) {
      return { valid: true, data: content }
    }

    try {
      const parsedContent = JSON.parse(content)
      const schemaKey = JSON.stringify(schema)
      
      let validator = this.validators.get(schemaKey)
      if (!validator) {
        validator = this.ajv.compile(schema)
        this.validators.set(schemaKey, validator)
      }

      const valid = validator(parsedContent)
      
      if (valid) {
        return { valid: true, data: parsedContent }
      } else {
        const errors = validator.errors?.map(err => 
          `${err.instancePath || 'root'}: ${err.message}`
        ) || ['Unknown validation error']
        
        return { valid: false, errors }
      }
    } catch (parseError) {
      return {
        valid: false,
        errors: ['Invalid JSON format']
      }
    }
  }

  createNarrativeSchema(): object {
    return {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          minLength: 10,
          maxLength: 500
        },
        keyPoints: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 10
        },
        confidence: {
          type: 'number',
          minimum: 0,
          maximum: 1
        },
        metadata: {
          type: 'object',
          properties: {
            jurisdiction: { type: 'string' },
            propertyType: { type: 'string' },
            approach: { type: 'string', enum: ['income', 'sales', 'cost'] }
          }
        }
      },
      required: ['summary', 'keyPoints', 'confidence'],
      additionalProperties: false
    }
  }

  createPacketSchema(): object {
    return {
      type: 'object',
      properties: {
        coverLetter: {
          type: 'string',
          minLength: 100,
          maxLength: 2000
        },
        arguments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              point: { type: 'string' },
              evidence: { type: 'string' },
              impact: { type: 'string' }
            },
            required: ['point', 'evidence']
          },
          minItems: 1,
          maxItems: 5
        },
        conclusion: {
          type: 'string',
          minLength: 50,
          maxLength: 500
        }
      },
      required: ['coverLetter', 'arguments', 'conclusion'],
      additionalProperties: false
    }
  }

  createSwartzSchema(): object {
    return {
      type: 'object',
      properties: {
        extractedData: {
          type: 'object',
          properties: {
            propertyDetails: {
              type: 'object',
              properties: {
                address: { type: 'string' },
                squareFootage: { type: 'number' },
                yearBuilt: { type: 'number' }
              }
            },
            financials: {
              type: 'object',
              properties: {
                grossIncome: { type: 'number' },
                operatingExpenses: { type: 'number' },
                netOperatingIncome: { type: 'number' }
              }
            }
          }
        },
        confidence: {
          type: 'number',
          minimum: 0,
          maximum: 1
        },
        warnings: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['extractedData', 'confidence'],
      additionalProperties: false
    }
  }
}