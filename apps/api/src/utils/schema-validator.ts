import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  value?: any;
}

class SchemaValidator {
  private ajv: Ajv;
  private validators: Map<string, ValidateFunction> = new Map();
  
  constructor() {
    this.ajv = new Ajv({ 
      allErrors: true,
      verbose: true,
      strict: true,
      removeAdditional: false
    });
    
    addFormats(this.ajv);
    this.loadSchemas();
  }
  
  private loadSchemas() {
    try {
      // Load rule template schema
      const ruleTemplateSchemaPath = join(__dirname, '../schemas/rule-template.schema.json');
      const ruleTemplateSchema = JSON.parse(readFileSync(ruleTemplateSchemaPath, 'utf8'));
      
      const ruleTemplateValidator = this.ajv.compile(ruleTemplateSchema);
      this.validators.set('rule-template', ruleTemplateValidator);
      
      console.log('Loaded schema validators:', Array.from(this.validators.keys()));
    } catch (error) {
      console.error('Failed to load schemas:', error);
      throw new Error('Schema validation setup failed');
    }
  }
  
  validateRuleTemplate(data: any): ValidationResult {
    return this.validate('rule-template', data);
  }
  
  private validate(schemaName: string, data: any): ValidationResult {
    const validator = this.validators.get(schemaName);
    
    if (!validator) {
      throw new Error(`Schema validator not found: ${schemaName}`);
    }
    
    const valid = validator(data);
    
    if (valid) {
      return { valid: true };
    }
    
    const errors: ValidationError[] = (validator.errors || []).map(error => ({
      path: error.instancePath || error.schemaPath || 'root',
      message: error.message || 'Validation error',
      value: error.data
    }));
    
    return {
      valid: false,
      errors
    };
  }
  
  // Helper to create validation middleware for Fastify
  createValidationMiddleware(schemaName: string) {
    return (data: any) => {
      const result = this.validate(schemaName, data);
      
      if (!result.valid) {
        const errorMessages = result.errors?.map(err => `${err.path}: ${err.message}`).join(', ');
        throw new Error(`Schema validation failed: ${errorMessages}`);
      }
      
      return data;
    };
  }
  
  // Validate and sanitize rule template data
  validateAndSanitizeRuleTemplate(data: any): any {
    const result = this.validateRuleTemplate(data);
    
    if (!result.valid) {
      const errorMessages = result.errors?.map(err => `${err.path}: ${err.message}`).join(', ');
      throw new Error(`Rule template validation failed: ${errorMessages}`);
    }
    
    // Return sanitized data (AJV may have removed additional properties)
    return data;
  }
  
  // Get human-readable validation errors
  formatValidationErrors(errors: ValidationError[]): string[] {
    return errors.map(error => {
      const path = error.path === '' ? 'root' : error.path.replace(/^\//, '').replace(/\//g, '.');
      return `Field '${path}': ${error.message}`;
    });
  }
}

// Singleton instance
export const schemaValidator = new SchemaValidator();

// Convenience functions
export function validateRuleTemplate(data: any): ValidationResult {
  return schemaValidator.validateRuleTemplate(data);
}

export function validateAndSanitizeRuleTemplate(data: any): any {
  return schemaValidator.validateAndSanitizeRuleTemplate(data);
}

export function formatValidationErrors(errors: ValidationError[]): string[] {
  return schemaValidator.formatValidationErrors(errors);
}