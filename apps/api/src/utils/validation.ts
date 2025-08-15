interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  errors?: string[];
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isValidUUID(value: unknown): value is string {
  if (!isString(value)) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export function validateRequiredString(value: unknown, fieldName: string): ValidationResult<string> {
  if (!isString(value)) {
    return {
      valid: false,
      errors: [`${fieldName} must be a non-empty string`]
    };
  }
  return {
    valid: true,
    data: value
  };
}

export function validateUUID(value: unknown, fieldName: string): ValidationResult<string> {
  if (!isValidUUID(value)) {
    return {
      valid: false,
      errors: [`${fieldName} must be a valid UUID`]
    };
  }
  return {
    valid: true,
    data: value
  };
}

