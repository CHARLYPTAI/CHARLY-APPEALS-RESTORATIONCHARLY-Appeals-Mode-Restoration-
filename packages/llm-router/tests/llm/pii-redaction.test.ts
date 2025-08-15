import { describe, it, expect } from 'vitest'
import { PIIRedactor } from '../../src/pii-redaction.js'

describe('PIIRedactor', () => {
  describe('when enabled', () => {
    it('should redact SSN patterns', () => {
      const redactor = new PIIRedactor({
        enabled: true,
        patterns: ['ssn']
      })

      expect(redactor.redact('My SSN is 123-45-6789')).toBe('My SSN is [SSN-REDACTED]')
      expect(redactor.redact('SSN: 123456789')).toBe('SSN: [SSN-REDACTED]')
      expect(redactor.redact('Social: 123-45-6789')).toBe('Social: [SSN-REDACTED]')
    })

    it('should redact email addresses', () => {
      const redactor = new PIIRedactor({
        enabled: true,
        patterns: ['email']
      })

      expect(redactor.redact('Contact john.doe@example.com')).toBe('Contact [EMAIL-REDACTED]')
      expect(redactor.redact('Email: user+tag@domain.co.uk')).toBe('Email: [EMAIL-REDACTED]')
      expect(redactor.redact('Send to test_user@sub.domain.org')).toBe('Send to [EMAIL-REDACTED]')
    })

    it('should redact phone numbers', () => {
      const redactor = new PIIRedactor({
        enabled: true,
        patterns: ['phone']
      })

      expect(redactor.redact('Call me at 555-123-4567')).toBe('Call me at [PHONE-REDACTED]')
      expect(redactor.redact('Phone: (555) 123-4567')).toBe('Phone: [PHONE-REDACTED]')
      expect(redactor.redact('Number: +1-555-123-4567')).toBe('Number: [PHONE-REDACTED]')
      expect(redactor.redact('Mobile: 5551234567')).toBe('Mobile: [PHONE-REDACTED]')
    })

    it('should redact credit card numbers', () => {
      const redactor = new PIIRedactor({
        enabled: true,
        patterns: ['credit_card']
      })

      expect(redactor.redact('Visa: 4111111111111111')).toBe('Visa: [CC-REDACTED]')
      expect(redactor.redact('MC: 5555555555554444')).toBe('MC: [CC-REDACTED]')
      expect(redactor.redact('Amex: 378282246310005')).toBe('Amex: [CC-REDACTED]')
    })

    it('should redact EIN numbers', () => {
      const redactor = new PIIRedactor({
        enabled: true,
        patterns: ['ein']
      })

      expect(redactor.redact('EIN: 12-3456789')).toBe('EIN: [EIN-REDACTED]')
      expect(redactor.redact('Tax ID: 123456789')).toBe('Tax ID: [EIN-REDACTED]')
    })

    it('should redact addresses', () => {
      const redactor = new PIIRedactor({
        enabled: true,
        patterns: ['address']
      })

      expect(redactor.redact('Address: 123 Main Street')).toBe('Address: [ADDRESS-REDACTED]')
      expect(redactor.redact('Located at 456 Oak Ave')).toBe('Located at [ADDRESS-REDACTED]')
      expect(redactor.redact('Office: 789 Business Blvd')).toBe('Office: [ADDRESS-REDACTED]')
    })

    it('should redact IP addresses', () => {
      const redactor = new PIIRedactor({
        enabled: true,
        patterns: ['ip_address']
      })

      expect(redactor.redact('Server IP: 192.168.1.1')).toBe('Server IP: [IP-REDACTED]')
      expect(redactor.redact('Connect to 10.0.0.1')).toBe('Connect to [IP-REDACTED]')
      expect(redactor.redact('Public IP 203.0.113.45')).toBe('Public IP [IP-REDACTED]')
    })

    it('should handle multiple patterns', () => {
      const redactor = new PIIRedactor({
        enabled: true,
        patterns: ['email', 'phone', 'ssn']
      })

      const text = 'Contact John at john@example.com or 555-123-4567. His SSN is 123-45-6789.'
      const expected = 'Contact John at [EMAIL-REDACTED] or [PHONE-REDACTED]. His SSN is [SSN-REDACTED].'
      
      expect(redactor.redact(text)).toBe(expected)
    })

    it('should handle custom rules', () => {
      const redactor = new PIIRedactor({
        enabled: true,
        patterns: [],
        customRules: [{
          name: 'Custom ID',
          pattern: /ID-\d{6}/g,
          replacement: '[CUSTOM-ID-REDACTED]'
        }]
      })

      expect(redactor.redact('Employee ID-123456')).toBe('Employee [CUSTOM-ID-REDACTED]')
    })

    it('should preserve text when no patterns match', () => {
      const redactor = new PIIRedactor({
        enabled: true,
        patterns: ['email']
      })

      const text = 'This is just normal text with no PII'
      expect(redactor.redact(text)).toBe(text)
    })
  })

  describe('when disabled', () => {
    it('should return original text unchanged', () => {
      const redactor = new PIIRedactor({
        enabled: false,
        patterns: ['email', 'phone', 'ssn']
      })

      const text = 'Email: john@example.com, Phone: 555-123-4567, SSN: 123-45-6789'
      expect(redactor.redact(text)).toBe(text)
    })
  })

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      const redactor = new PIIRedactor({
        enabled: true,
        patterns: ['email']
      })

      expect(redactor.redact('')).toBe('')
    })

    it('should handle text with only PII', () => {
      const redactor = new PIIRedactor({
        enabled: true,
        patterns: ['email']
      })

      expect(redactor.redact('john@example.com')).toBe('[EMAIL-REDACTED]')
    })

    it('should handle multiple instances of same PII type', () => {
      const redactor = new PIIRedactor({
        enabled: true,
        patterns: ['email']
      })

      const text = 'Emails: john@example.com and jane@example.com'
      const expected = 'Emails: [EMAIL-REDACTED] and [EMAIL-REDACTED]'
      
      expect(redactor.redact(text)).toBe(expected)
    })
  })
})