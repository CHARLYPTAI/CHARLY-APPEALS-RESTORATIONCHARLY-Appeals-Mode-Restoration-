import { createAjvInstance } from './ajv-setup.js';
import type { ValidateFunction } from 'ajv';
import type { CommercialPropertyCore } from '../types/commercial.js';
import type { RentRollMetadata } from '../types/rent-roll.js';
import type { IncomeStatementMetadata } from '../types/income-statement.js';

import commercialPropertySchema from '../schemas/commercial-property.json' assert { type: 'json' };
import rentRollSchema from '../schemas/rent-roll.json' assert { type: 'json' };
import incomeStatementSchema from '../schemas/income-statement.json' assert { type: 'json' };

const ajv = createAjvInstance();

export const validateCommercialProperty: ValidateFunction<CommercialPropertyCore> = 
  ajv.compile(commercialPropertySchema);

export const validateRentRoll: ValidateFunction<RentRollMetadata> = 
  ajv.compile(rentRollSchema);

export const validateIncomeStatement: ValidateFunction<IncomeStatementMetadata> = 
  ajv.compile(incomeStatementSchema);

export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  errors?: string[];
}

export function validateCommercialPropertySafe(data: unknown): ValidationResult<CommercialPropertyCore> {
  const valid = validateCommercialProperty(data);
  
  if (valid) {
    return { valid: true, data: data as CommercialPropertyCore };
  }
  
  const errors = validateCommercialProperty.errors?.map(error => 
    `${error.instancePath || 'root'}: ${error.message}`
  ) || ['Unknown validation error'];
  
  return { valid: false, errors };
}

export function validateRentRollSafe(data: unknown): ValidationResult<RentRollMetadata> {
  const valid = validateRentRoll(data);
  
  if (valid) {
    return { valid: true, data: data as RentRollMetadata };
  }
  
  const errors = validateRentRoll.errors?.map(error => 
    `${error.instancePath || 'root'}: ${error.message}`
  ) || ['Unknown validation error'];
  
  return { valid: false, errors };
}

export function validateIncomeStatementSafe(data: unknown): ValidationResult<IncomeStatementMetadata> {
  const valid = validateIncomeStatement(data);
  
  if (valid) {
    return { valid: true, data: data as IncomeStatementMetadata };
  }
  
  const errors = validateIncomeStatement.errors?.map(error => 
    `${error.instancePath || 'root'}: ${error.message}`
  ) || ['Unknown validation error'];
  
  return { valid: false, errors };
}