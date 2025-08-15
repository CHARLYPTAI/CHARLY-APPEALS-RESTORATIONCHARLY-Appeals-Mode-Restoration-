export interface PIIRedactionConfig {
  enabled: boolean
  patterns: string[]
  customRules?: RedactionRule[]
}

export interface RedactionRule {
  name: string
  pattern: RegExp
  replacement: string
}

export class PIIRedactor {
  private rules: RedactionRule[]
  
  constructor(private config: PIIRedactionConfig) {
    this.rules = this.buildRules()
  }

  redact(text: string): string {
    if (!this.config.enabled) {
      return text
    }

    let redactedText = text
    
    for (const rule of this.rules) {
      redactedText = redactedText.replace(rule.pattern, rule.replacement)
    }
    
    return redactedText
  }

  private buildRules(): RedactionRule[] {
    const rules: RedactionRule[] = []
    
    if (this.config.patterns.includes('ssn')) {
      rules.push({
        name: 'SSN',
        pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g,
        replacement: '[SSN-REDACTED]'
      })
    }
    
    if (this.config.patterns.includes('email')) {
      rules.push({
        name: 'Email',
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        replacement: '[EMAIL-REDACTED]'
      })
    }
    
    if (this.config.patterns.includes('phone')) {
      rules.push({
        name: 'Phone',
        pattern: /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
        replacement: '[PHONE-REDACTED]'
      })
    }
    
    if (this.config.patterns.includes('credit_card')) {
      rules.push({
        name: 'Credit Card',
        pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
        replacement: '[CC-REDACTED]'
      })
    }
    
    if (this.config.patterns.includes('ein')) {
      rules.push({
        name: 'EIN',
        pattern: /\b\d{2}-?\d{7}\b/g,
        replacement: '[EIN-REDACTED]'
      })
    }
    
    if (this.config.patterns.includes('address')) {
      rules.push({
        name: 'Address',
        pattern: /\b\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)\b/gi,
        replacement: '[ADDRESS-REDACTED]'
      })
    }
    
    if (this.config.patterns.includes('ip_address')) {
      rules.push({
        name: 'IP Address',
        pattern: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
        replacement: '[IP-REDACTED]'
      })
    }
    
    if (this.config.customRules) {
      rules.push(...this.config.customRules)
    }
    
    return rules
  }
}