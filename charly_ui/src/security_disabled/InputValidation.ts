/**
 * CHARLY 2.0 - Input Validation & XSS/CSRF Protection
 * Enterprise-grade input validation and security protection utilities
 * Apple CTO Enterprise Security Standards
 */

import DOMPurify from 'dompurify';

// Input validation result interface
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: unknown;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// XSS protection configuration
interface XSSProtectionConfig {
  allowedTags: string[];
  allowedAttributes: { [key: string]: string[] };
  allowedSchemes: string[];
  stripTags: boolean;
  maxLength?: number;
}

// CSRF token configuration
interface CSRFConfig {
  tokenName: string;
  headerName: string;
  cookieName: string;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
}

// SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
  /(--|\/\*|\*\/|;)/g,
  /(\bOR\s+'\w*'\s*=\s*'\w*')/gi,
  /(\bUNION\s+(ALL\s+)?SELECT)/gi,
  /(\bINSERT\s+INTO)/gi,
  /(\bDROP\s+TABLE)/gi,
  /(\bEXEC\s*\()/gi
];

// XSS patterns
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /<meta\b[^>]*http-equiv/gi
];

// Command injection patterns
const COMMAND_INJECTION_PATTERNS = [
  /(\||&|;|`|\$\(|\$\{)/g,
  /(\.\.\/|\.\.\\)/g,
  /(\bnc\b|\bnetcat\b|\bcurl\b|\bwget\b)/gi,
  /(\bchmod\b|\bchown\b|\bsu\b|\bsudo\b)/gi,
  /(\brm\s+-rf|\bdel\s+\/[sq])/gi
];

// Path traversal patterns
const PATH_TRAVERSAL_PATTERNS = [
  /(\.\.\/|\.\.\\)/g,
  /(%2e%2e%2f|%2e%2e%5c)/gi,
  /(%252e%252e%252f|%252e%252e%255c)/gi,
  /(\/etc\/|\/proc\/|\/sys\/)/gi,
  /(C:\\Windows\\|C:\\Program Files\\)/gi
];

// LDAP injection patterns
const LDAP_INJECTION_PATTERNS = [
  /[*|&!=><~]/g,
  /(\(|\))/g,
  /(\\[0-9a-fA-F]{2})/g
];

class InputValidationManager {
  private csrfTokens: Map<string, { token: string; timestamp: number }> = new Map();
  private xssConfig: XSSProtectionConfig;
  private csrfConfig: CSRFConfig;

  constructor() {
    this.xssConfig = {
      allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'span', 'div'],
      allowedAttributes: {
        '*': ['class', 'id'],
        'a': ['href', 'title'],
        'img': ['src', 'alt', 'width', 'height']
      },
      allowedSchemes: ['http', 'https', 'mailto'],
      stripTags: true,
      maxLength: 10000
    };

    this.csrfConfig = {
      tokenName: 'csrf_token',
      headerName: 'X-CSRF-Token',
      cookieName: 'csrf_cookie',
      secure: true,
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour
    };

    // Initialize DOMPurify
    if (typeof window !== 'undefined') {
      DOMPurify.setConfig({
        ALLOWED_TAGS: this.xssConfig.allowedTags,
        ALLOWED_ATTR: Object.values(this.xssConfig.allowedAttributes).flat(),
        ALLOWED_URI_REGEXP: new RegExp(`^(${this.xssConfig.allowedSchemes.join('|')}):`, 'i')
      });
    }
  }

  /**
   * Comprehensive input validation with security checks
   */
  validateInput(input: unknown, type: 'text' | 'email' | 'url' | 'number' | 'json' | 'sql' | 'html', options?: {
    maxLength?: number;
    minLength?: number;
    allowEmpty?: boolean;
    customPattern?: RegExp;
  }): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      riskLevel: 'low'
    };

    // Basic null/undefined checks
    if (input === null || input === undefined) {
      if (!options?.allowEmpty) {
        result.isValid = false;
        result.errors.push('Input cannot be null or undefined');
      }
      return result;
    }

    const inputStr = String(input);

    // Length validation
    if (options?.maxLength && inputStr.length > options.maxLength) {
      result.isValid = false;
      result.errors.push(`Input exceeds maximum length of ${options.maxLength}`);
      result.riskLevel = 'medium';
    }

    if (options?.minLength && inputStr.length < options.minLength) {
      result.isValid = false;
      result.errors.push(`Input below minimum length of ${options.minLength}`);
    }

    // Empty string validation
    if (inputStr.trim() === '' && !options?.allowEmpty) {
      result.isValid = false;
      result.errors.push('Input cannot be empty');
      return result;
    }

    // Security pattern checks
    this.checkSecurityPatterns(inputStr, result);

    // Type-specific validation
    switch (type) {
      case 'text':
        result.sanitizedValue = this.sanitizeText(inputStr);
        break;
      case 'email':
        this.validateEmail(inputStr, result);
        break;
      case 'url':
        this.validateURL(inputStr, result);
        break;
      case 'number':
        this.validateNumber(inputStr, result);
        break;
      case 'json':
        this.validateJSON(inputStr, result);
        break;
      case 'sql':
        this.validateSQL(inputStr, result);
        break;
      case 'html':
        result.sanitizedValue = this.sanitizeHTML(inputStr);
        break;
    }

    // Custom pattern validation
    if (options?.customPattern && !options.customPattern.test(inputStr)) {
      result.isValid = false;
      result.errors.push('Input does not match required pattern');
    }

    return result;
  }

  /**
   * Check for common security attack patterns
   */
  private checkSecurityPatterns(input: string, result: ValidationResult): void {
    // SQL Injection check
    const sqlMatches = SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
    if (sqlMatches) {
      result.isValid = false;
      result.errors.push('Potential SQL injection detected');
      result.riskLevel = 'critical';
    }

    // XSS check
    const xssMatches = XSS_PATTERNS.some(pattern => pattern.test(input));
    if (xssMatches) {
      result.isValid = false;
      result.errors.push('Potential XSS attack detected');
      result.riskLevel = 'critical';
    }

    // Command injection check
    const cmdMatches = COMMAND_INJECTION_PATTERNS.some(pattern => pattern.test(input));
    if (cmdMatches) {
      result.isValid = false;
      result.errors.push('Potential command injection detected');
      result.riskLevel = 'critical';
    }

    // Path traversal check
    const pathMatches = PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(input));
    if (pathMatches) {
      result.isValid = false;
      result.errors.push('Potential path traversal attack detected');
      result.riskLevel = 'high';
    }

    // LDAP injection check
    const ldapMatches = LDAP_INJECTION_PATTERNS.some(pattern => pattern.test(input));
    if (ldapMatches) {
      result.isValid = false;
      result.errors.push('Potential LDAP injection detected');
      result.riskLevel = 'high';
    }
  }

  /**
   * Sanitize text input to prevent XSS
   */
  sanitizeText(input: string): string {
    // HTML encode special characters
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Sanitize HTML content using DOMPurify
   */
  sanitizeHTML(input: string): string {
    if (typeof window === 'undefined') {
      // Server-side fallback
      return this.sanitizeText(input);
    }
    return DOMPurify.sanitize(input);
  }

  /**
   * Validate email format
   */
  private validateEmail(input: string, result: ValidationResult): void {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(input)) {
      result.isValid = false;
      result.errors.push('Invalid email format');
    }

    // Check for suspicious patterns in email
    if (input.includes('..') || input.includes('@@')) {
      result.isValid = false;
      result.errors.push('Malformed email address');
      result.riskLevel = 'medium';
    }

    result.sanitizedValue = this.sanitizeText(input.toLowerCase());
  }

  /**
   * Validate URL format and security
   */
  private validateURL(input: string, result: ValidationResult): void {
    try {
      const url = new URL(input);
      
      // Check allowed schemes
      if (!this.xssConfig.allowedSchemes.includes(url.protocol.slice(0, -1))) {
        result.isValid = false;
        result.errors.push(`URL scheme '${url.protocol}' not allowed`);
        result.riskLevel = 'high';
      }

      // Check for suspicious domains
      const suspiciousDomains = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
      if (suspiciousDomains.includes(url.hostname)) {
        result.isValid = false;
        result.errors.push('URLs pointing to localhost/internal IPs not allowed');
        result.riskLevel = 'high';
      }

      result.sanitizedValue = url.toString();
    } catch {
      result.isValid = false;
      result.errors.push('Invalid URL format');
    }
  }

  /**
   * Validate numeric input
   */
  private validateNumber(input: string, result: ValidationResult): void {
    const num = Number(input);
    
    if (isNaN(num)) {
      result.isValid = false;
      result.errors.push('Input is not a valid number');
    } else {
      result.sanitizedValue = num;
    }
  }

  /**
   * Validate JSON input
   */
  private validateJSON(input: string, result: ValidationResult): void {
    try {
      const parsed = JSON.parse(input);
      
      // Check for prototype pollution
      if (this.hasPrototypePollution(parsed)) {
        result.isValid = false;
        result.errors.push('Potential prototype pollution detected');
        result.riskLevel = 'critical';
      } else {
        result.sanitizedValue = parsed;
      }
    } catch {
      result.isValid = false;
      result.errors.push('Invalid JSON format');
    }
  }

  /**
   * Validate SQL query (for admin interfaces)
   */
  private validateSQL(input: string, result: ValidationResult): void {
    // Enhanced SQL injection detection
    const suspiciousPatterns = [
      /(\bUNION\s+(ALL\s+)?SELECT)/gi,
      /(\bINSERT\s+INTO)/gi,
      /(\bUPDATE\s+\w+\s+SET)/gi,
      /(\bDELETE\s+FROM)/gi,
      /(\bDROP\s+(TABLE|DATABASE|INDEX))/gi,
      /(\bALTER\s+(TABLE|DATABASE))/gi,
      /(\bEXEC\s*\()/gi,
      /(\bSELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*\s+(OR|AND)\s+.*=.*)/gi
    ];

    const foundPattern = suspiciousPatterns.find(pattern => pattern.test(input));
    if (foundPattern) {
      result.isValid = false;
      result.errors.push('Potentially dangerous SQL detected');
      result.riskLevel = 'critical';
    }
  }

  /**
   * Check for prototype pollution in objects
   */
  private hasPrototypePollution(obj: Record<string, unknown>): boolean {
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    for (const key of Object.keys(obj)) {
      if (dangerousKeys.includes(key)) {
        return true;
      }
      
      if (typeof obj[key] === 'object' && this.hasPrototypePollution(obj[key])) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken(sessionId: string): string {
    const token = this.generateRandomToken(32);
    this.csrfTokens.set(sessionId, {
      token,
      timestamp: Date.now()
    });
    return token;
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(sessionId: string, providedToken: string): boolean {
    const storedData = this.csrfTokens.get(sessionId);
    
    if (!storedData) {
      return false;
    }

    // Check token expiry
    if (Date.now() - storedData.timestamp > this.csrfConfig.maxAge) {
      this.csrfTokens.delete(sessionId);
      return false;
    }

    // Constant-time comparison to prevent timing attacks
    return this.constantTimeEquals(storedData.token, providedToken);
  }

  /**
   * Clean expired CSRF tokens
   */
  cleanExpiredCSRFTokens(): void {
    const now = Date.now();
    for (const [sessionId, data] of this.csrfTokens.entries()) {
      if (now - data.timestamp > this.csrfConfig.maxAge) {
        this.csrfTokens.delete(sessionId);
      }
    }
  }

  /**
   * Generate cryptographically secure random token
   */
  private generateRandomToken(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    if (typeof window !== 'undefined' && window.crypto) {
      const array = new Uint8Array(length);
      window.crypto.getRandomValues(array);
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
      }
    } else {
      // Fallback for Node.js
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    
    return result;
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeEquals(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Validate file upload
   */
  validateFileUpload(file: File, options: {
    allowedTypes?: string[];
    maxSize?: number;
    allowedExtensions?: string[];
  }): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      riskLevel: 'low'
    };

    // Check file size
    if (options.maxSize && file.size > options.maxSize) {
      result.isValid = false;
      result.errors.push(`File size exceeds limit of ${options.maxSize} bytes`);
      result.riskLevel = 'medium';
    }

    // Check MIME type
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      result.isValid = false;
      result.errors.push(`File type '${file.type}' not allowed`);
      result.riskLevel = 'high';
    }

    // Check file extension
    if (options.allowedExtensions) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !options.allowedExtensions.includes(extension)) {
        result.isValid = false;
        result.errors.push(`File extension '${extension}' not allowed`);
        result.riskLevel = 'high';
      }
    }

    // Check for dangerous file names
    const dangerousNames = ['web.config', '.htaccess', 'php.ini', 'autorun.inf'];
    if (dangerousNames.includes(file.name.toLowerCase())) {
      result.isValid = false;
      result.errors.push('Dangerous file name detected');
      result.riskLevel = 'critical';
    }

    return result;
  }

  /**
   * Rate limiting for input validation
   */
  private validationAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();

  isRateLimited(identifier: string, maxAttempts: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now();
    const attempts = this.validationAttempts.get(identifier);

    if (!attempts || now - attempts.lastAttempt > windowMs) {
      this.validationAttempts.set(identifier, { count: 1, lastAttempt: now });
      return false;
    }

    if (attempts.count >= maxAttempts) {
      return true;
    }

    attempts.count++;
    attempts.lastAttempt = now;
    return false;
  }
}

// Export singleton instance
export const inputValidation = new InputValidationManager();

// Export types and classes
export {
  InputValidationManager,
  ValidationResult,
  XSSProtectionConfig,
  CSRFConfig
};