const SENSITIVE_FIELDS = [
  'password',
  'api_key',
  'apikey',
  'api-key',
  'token',
  'secret',
  'authorization',
  'auth',
  'ssn',
  'social_security_number',
  'email',
  'phone',
  'phone_number',
  'address',
  'street',
  'zip',
  'postal_code',
  'credit_card',
  'card_number',
  'cvv',
  'expiry'
];

export function sanitizeForLogging(obj: unknown): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return obj.length > 200 ? `${obj.substring(0, 200)}...` : obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message.length > 200 ? `${obj.message.substring(0, 200)}...` : obj.message,
      stack: obj.stack ? '[REDACTED]' : undefined
    };
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForLogging(item));
  }

  const sanitized: Record<string, unknown> = {};
  const record = obj as Record<string, unknown>;

  for (const [key, value] of Object.entries(record)) {
    const lowerKey = key.toLowerCase();
    
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeForLogging(value);
    } else if (typeof value === 'string' && value.length > 200) {
      sanitized[key] = `${value.substring(0, 200)}...`;
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}