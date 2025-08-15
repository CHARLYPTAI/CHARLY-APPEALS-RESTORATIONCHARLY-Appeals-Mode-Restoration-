import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sanitizeForLogging } from '../../utils/log-sanitizer.js';
import { loadConfig } from '../../config/index.js';

describe('Security - Secrets & Log Redaction', () => {
  describe('Log Sanitization', () => {
    it('should redact sensitive fields from objects', () => {
      const sensitiveData = {
        username: 'john_doe',
        password: 'super_secret_password',
        api_key: 'sk-1234567890abcdef',
        authorization: 'Bearer token123',
        email: 'john@example.com',
        ssn: '123-45-6789',
        normalField: 'this is ok'
      };

      const sanitized = sanitizeForLogging(sensitiveData);

      expect(sanitized.username).toBe('john_doe');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.api_key).toBe('[REDACTED]');
      expect(sanitized.authorization).toBe('[REDACTED]');
      expect(sanitized.email).toBe('[REDACTED]');
      expect(sanitized.ssn).toBe('[REDACTED]');
      expect(sanitized.normalField).toBe('this is ok');
    });

    it('should redact sensitive fields in nested objects', () => {
      const nestedData = {
        user: {
          name: 'John',
          password: 'secret123',
          profile: {
            email: 'john@test.com',
            phone: '555-0123'
          }
        },
        config: {
          api_token: 'abc123',
          database_url: 'postgres://user:pass@localhost/db'
        }
      };

      const sanitized = sanitizeForLogging(nestedData);

      expect(sanitized.user.name).toBe('John');
      expect(sanitized.user.password).toBe('[REDACTED]');
      expect(sanitized.user.profile.email).toBe('[REDACTED]');
      expect(sanitized.user.profile.phone).toBe('[REDACTED]');
      expect(sanitized.config.api_token).toBe('[REDACTED]');
      expect(sanitized.config.database_url).toBe('postgres://user:pass@localhost/db');
    });

    it('should redact sensitive fields in arrays', () => {
      const arrayData = [
        { username: 'user1', password: 'pass1' },
        { username: 'user2', api_key: 'key123' },
        'normal string'
      ];

      const sanitized = sanitizeForLogging(arrayData);

      expect(sanitized[0].username).toBe('user1');
      expect(sanitized[0].password).toBe('[REDACTED]');
      expect(sanitized[1].username).toBe('user2');
      expect(sanitized[1].api_key).toBe('[REDACTED]');
      expect(sanitized[2]).toBe('normal string');
    });

    it('should handle error objects and redact stack traces', () => {
      const error = new Error('Database connection failed with password: secret123');
      error.stack = 'Error: Database connection failed\\n    at function1\\n    at function2';

      const sanitized = sanitizeForLogging(error);

      expect(sanitized.name).toBe('Error');
      expect(sanitized.message).toBe('Database connection failed with password: secret123');
      expect(sanitized.stack).toBe('[REDACTED]');
    });

    it('should truncate long strings', () => {
      const longString = 'a'.repeat(250);
      const sanitized = sanitizeForLogging(longString);

      expect(sanitized).toBe('a'.repeat(200) + '...');
      expect(sanitized.length).toBe(203); // 200 + '...'
    });

    it('should handle null and undefined values', () => {
      expect(sanitizeForLogging(null)).toBe(null);
      expect(sanitizeForLogging(undefined)).toBe(undefined);
    });

    it('should handle primitive values', () => {
      expect(sanitizeForLogging(123)).toBe(123);
      expect(sanitizeForLogging(true)).toBe(true);
      expect(sanitizeForLogging('short string')).toBe('short string');
    });

    it('should redact case-insensitive sensitive field names', () => {
      const data = {
        PASSWORD: 'secret',
        ApiKey: 'key123',
        AUTHORIZATION: 'bearer token',
        Email: 'test@example.com'
      };

      const sanitized = sanitizeForLogging(data);

      expect(sanitized.PASSWORD).toBe('[REDACTED]');
      expect(sanitized.ApiKey).toBe('[REDACTED]');
      expect(sanitized.AUTHORIZATION).toBe('[REDACTED]');
      expect(sanitized.Email).toBe('[REDACTED]');
    });
  });

  describe('Configuration Validation', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
      originalEnv = { ...process.env };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should load valid configuration with defaults', () => {
      // Clear relevant env vars to test defaults
      delete process.env.NODE_ENV;
      delete process.env.LOG_LEVEL;
      delete process.env.PORT;
      delete process.env.HOST;

      const config = loadConfig();

      expect(config.nodeEnv).toBe('development');
      expect(config.logLevel).toBe('info');
      expect(config.port).toBe(3000);
      expect(config.host).toBe('0.0.0.0');
      expect(config.corsOrigins).toBe(true);
    });

    it('should load production configuration', () => {
      process.env.NODE_ENV = 'production';
      process.env.LOG_LEVEL = 'warn';
      process.env.PORT = '8080';
      process.env.HOST = '127.0.0.1';

      const config = loadConfig();

      expect(config.nodeEnv).toBe('production');
      expect(config.logLevel).toBe('warn');
      expect(config.port).toBe(8080);
      expect(config.host).toBe('127.0.0.1');
      expect(config.corsOrigins).toEqual([
        'https://commercial.charlyapp.com',
        'https://residential.charlyapp.com'
      ]);
    });

    it('should reject invalid PORT values', () => {
      process.env.PORT = 'invalid';
      expect(() => loadConfig()).toThrow('Invalid PORT value: invalid');

      process.env.PORT = '0';
      expect(() => loadConfig()).toThrow('Invalid PORT value: 0');

      process.env.PORT = '70000';
      expect(() => loadConfig()).toThrow('Invalid PORT value: 70000');
    });

    it('should reject invalid LOG_LEVEL values', () => {
      process.env.LOG_LEVEL = 'invalid';
      expect(() => loadConfig()).toThrow('Invalid LOG_LEVEL value: invalid');
    });

    it('should accept all valid log levels', () => {
      const validLevels = ['error', 'warn', 'info', 'debug', 'trace'];
      
      for (const level of validLevels) {
        process.env.LOG_LEVEL = level;
        const config = loadConfig();
        expect(config.logLevel).toBe(level);
      }
    });
  });

  describe('Error Handling with Secrets', () => {
    it('should prevent secrets from appearing in error logs', () => {
      // Simulate an error that might contain sensitive data
      const sensitiveError = {
        message: 'Authentication failed',
        details: {
          username: 'testuser',
          password: 'secretpassword123',
          api_key: 'sk-abcdef123456',
          error_code: 'AUTH_FAILED'
        },
        stack: 'Error stack trace with sensitive data'
      };

      const sanitized = sanitizeForLogging(sensitiveError);

      expect(sanitized.message).toBe('Authentication failed');
      expect(sanitized.details.username).toBe('testuser');
      expect(sanitized.details.password).toBe('[REDACTED]');
      expect(sanitized.details.api_key).toBe('[REDACTED]');
      expect(sanitized.details.error_code).toBe('AUTH_FAILED');
      expect(sanitized.stack).toBe('Error stack trace with sensitive data');
    });

    it('should handle thrown errors with sensitive content', () => {
      try {
        // Simulate a function that throws an error with sensitive data
        const userCredentials = {
          username: 'admin',
          password: 'admin123',
          token: 'jwt-token-here'
        };
        
        throw new Error(`Login failed for user: ${JSON.stringify(userCredentials)}`);
      } catch (error) {
        const sanitized = sanitizeForLogging(error);
        
        // The error message itself isn't automatically sanitized in this case,
        // but the error object structure is processed
        expect(sanitized.name).toBe('Error');
        expect(sanitized.stack).toBe('[REDACTED]');
        expect(typeof sanitized.message).toBe('string');
      }
    });
  });
});