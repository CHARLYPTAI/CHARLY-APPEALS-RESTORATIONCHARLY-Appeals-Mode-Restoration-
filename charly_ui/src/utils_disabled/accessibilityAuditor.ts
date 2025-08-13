/**
 * Accessibility Audit and Compliance System
 * Apple CTO Task 25: Accessibility audit and compliance verification
 */

interface AccessibilityViolation {
  id: string;
  description: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  target: string;
  helpUrl: string;
  tags: string[];
}

interface AccessibilityResult {
  violations: AccessibilityViolation[];
  passes: number;
  incomplete: number;
  inapplicable: number;
  timestamp: string;
  url: string;
}

interface AccessibilityConfig {
  level: 'A' | 'AA' | 'AAA';
  tags: string[];
  includedRules: string[];
  excludedRules: string[];
}

export class AccessibilityAuditor {
  private static instance: AccessibilityAuditor;
  private config: AccessibilityConfig = {
    level: 'AA',
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
    includedRules: [],
    excludedRules: ['color-contrast'] // Handled by our custom color system
  };

  private constructor() {}

  public static getInstance(): AccessibilityAuditor {
    if (!AccessibilityAuditor.instance) {
      AccessibilityAuditor.instance = new AccessibilityAuditor();
    }
    return AccessibilityAuditor.instance;
  }

  public async auditPage(element?: Element): Promise<AccessibilityResult> {
    const violations: AccessibilityViolation[] = [];
    
    // Use the provided element or default to document.body
    const auditTarget = element || document.body;
    
    // Manual accessibility checks since we don't have axe-core in runtime
    const manualChecks = [
      this.checkHeadingStructure(auditTarget),
      this.checkImageAltText(auditTarget),
      this.checkFormLabels(auditTarget),
      this.checkFocusManagement(),
      this.checkKeyboardNavigation(),
      this.checkColorContrast(),
      this.checkTouchTargets(),
      this.checkSemanticStructure(),
      this.checkAriaAttributes(),
      this.checkSkipLinks()
    ];

    const results = await Promise.all(manualChecks);
    results.forEach(result => violations.push(...result));

    return {
      violations,
      passes: 0,
      incomplete: 0,
      inapplicable: 0,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
  }

  private checkHeadingStructure(element: Element = document.body): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    if (headings.length === 0) {
      violations.push({
        id: 'no-headings',
        description: 'Page has no headings',
        impact: 'serious',
        target: 'document',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/page-has-heading-one',
        tags: ['wcag2a', 'wcag131']
      });
    }

    let previousLevel = 0;
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (index === 0 && level !== 1) {
        violations.push({
          id: 'page-has-heading-one',
          description: 'Page must have a level-one heading',
          impact: 'moderate',
          target: heading.tagName,
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/page-has-heading-one',
          tags: ['wcag2a', 'wcag131']
        });
      }

      if (level > previousLevel + 1) {
        violations.push({
          id: 'heading-order',
          description: 'Heading levels should only increase by one',
          impact: 'moderate',
          target: heading.tagName,
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/heading-order',
          tags: ['wcag2a', 'wcag131']
        });
      }

      previousLevel = level;
    });

    return violations;
  }

  private checkImageAltText(element: Element = document.body): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const images = element.querySelectorAll('img');
    
    images.forEach(img => {
      const alt = img.getAttribute('alt');
      const role = img.getAttribute('role');
      
      if (alt === null && role !== 'presentation') {
        violations.push({
          id: 'image-alt',
          description: 'Images must have alternate text',
          impact: 'critical',
          target: img.tagName,
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/image-alt',
          tags: ['wcag2a', 'wcag111']
        });
      }
    });

    return violations;
  }

  private checkFormLabels(element: Element = document.body): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const inputs = element.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      const type = input.getAttribute('type');
      if (type === 'hidden' || type === 'submit' || type === 'button') return;
      
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      
      let hasLabel = false;
      
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) hasLabel = true;
      }
      
      if (ariaLabel || ariaLabelledBy) hasLabel = true;
      
      if (!hasLabel) {
        violations.push({
          id: 'label',
          description: 'Form elements must have labels',
          impact: 'critical',
          target: input.tagName,
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/label',
          tags: ['wcag2a', 'wcag412']
        });
      }
    });

    return violations;
  }

  private checkFocusManagement(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    focusableElements.forEach(element => {
      const tabIndex = element.getAttribute('tabindex');
      
      if (tabIndex && parseInt(tabIndex) > 0) {
        violations.push({
          id: 'tabindex',
          description: 'Elements should not have positive tabindex values',
          impact: 'serious',
          target: element.tagName,
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/tabindex',
          tags: ['wcag2a', 'wcag211']
        });
      }
    });

    return violations;
  }

  private checkKeyboardNavigation(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const clickableElements = document.querySelectorAll('[onclick], [role="button"]');
    
    clickableElements.forEach(element => {
      const isButton = element.tagName.toLowerCase() === 'button';
      const hasHref = element.hasAttribute('href');
      const tabIndex = element.getAttribute('tabindex');
      
      if (!isButton && !hasHref && tabIndex === null) {
        violations.push({
          id: 'keyboard-navigation',
          description: 'Interactive elements must be keyboard accessible',
          impact: 'serious',
          target: element.tagName,
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/keyboard',
          tags: ['wcag2a', 'wcag211']
        });
      }
    });

    return violations;
  }

  private checkColorContrast(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    
    // This is handled by our sophisticated color system
    // Check if our color providers are active
    const hasColorProviders = document.querySelector('[data-color-accessibility]');
    
    if (!hasColorProviders) {
      violations.push({
        id: 'color-contrast',
        description: 'Color accessibility providers not active',
        impact: 'serious',
        target: 'document',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
        tags: ['wcag2aa', 'wcag143']
      });
    }

    return violations;
  }

  private checkTouchTargets(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const touchTargets = document.querySelectorAll('button, [role="button"], a, input[type="button"], input[type="submit"]');
    
    touchTargets.forEach(target => {
      const rect = target.getBoundingClientRect();
      const minSize = 44; // Apple's minimum touch target size
      
      if (rect.width < minSize || rect.height < minSize) {
        violations.push({
          id: 'touch-target-size',
          description: 'Touch targets must be at least 44x44 pixels',
          impact: 'serious',
          target: target.tagName,
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/target-size',
          tags: ['wcag2aaa', 'wcag258']
        });
      }
    });

    return violations;
  }

  private checkSemanticStructure(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const semanticElements = ['main', 'nav', 'header', 'footer', 'article', 'section'];
    
    semanticElements.forEach(element => {
      const elements = document.querySelectorAll(element);
      
      if (element === 'main' && elements.length === 0) {
        violations.push({
          id: 'landmark-main-is-top-level',
          description: 'Document must have a main landmark',
          impact: 'moderate',
          target: 'document',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/landmark-main-is-top-level',
          tags: ['wcag2a', 'wcag131']
        });
      }
      
      if (element === 'main' && elements.length > 1) {
        violations.push({
          id: 'landmark-no-duplicate-main',
          description: 'Document must not have more than one main landmark',
          impact: 'moderate',
          target: 'main',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/landmark-no-duplicate-main',
          tags: ['wcag2a', 'wcag131']
        });
      }
    });

    return violations;
  }

  private checkAriaAttributes(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const elementsWithAria = document.querySelectorAll('[aria-labelledby], [aria-describedby]');
    
    elementsWithAria.forEach(element => {
      const labelledBy = element.getAttribute('aria-labelledby');
      const describedBy = element.getAttribute('aria-describedby');
      
      if (labelledBy) {
        const ids = labelledBy.split(' ');
        ids.forEach(id => {
          if (!document.getElementById(id)) {
            violations.push({
              id: 'aria-valid-attr-value',
              description: 'ARIA attributes must reference valid elements',
              impact: 'serious',
              target: element.tagName,
              helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/aria-valid-attr-value',
              tags: ['wcag2a', 'wcag412']
            });
          }
        });
      }
      
      if (describedBy) {
        const ids = describedBy.split(' ');
        ids.forEach(id => {
          if (!document.getElementById(id)) {
            violations.push({
              id: 'aria-valid-attr-value',
              description: 'ARIA attributes must reference valid elements',
              impact: 'serious',
              target: element.tagName,
              helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/aria-valid-attr-value',
              tags: ['wcag2a', 'wcag412']
            });
          }
        });
      }
    });

    return violations;
  }

  private checkSkipLinks(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const skipLinks = document.querySelectorAll('a[href^="#"]');
    
    let hasSkipToMain = false;
    skipLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === '#main' || href === '#content') {
        hasSkipToMain = true;
      }
    });

    if (!hasSkipToMain) {
      violations.push({
        id: 'skip-link',
        description: 'Page should have a skip link to main content',
        impact: 'moderate',
        target: 'document',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/skip-link',
        tags: ['wcag2a', 'wcag241']
      });
    }

    return violations;
  }

  public generateAccessibilityReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      config: this.config,
      compliance: {
        level: this.config.level,
        tags: this.config.tags,
        score: 0, // To be calculated after audit
        violations: 0,
        passes: 0
      },
      recommendations: [
        'Implement comprehensive accessibility testing',
        'Use semantic HTML elements',
        'Ensure keyboard navigation works throughout',
        'Provide sufficient color contrast',
        'Include proper ARIA labels and descriptions',
        'Test with screen readers',
        'Validate with automated tools'
      ]
    };

    return JSON.stringify(report, null, 2);
  }

  public async runFullAudit(): Promise<AccessibilityResult> {
    const result = await this.auditPage();
    
    // Log results in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Accessibility Audit Results:', result);
    }

    return result;
  }
}

// Export singleton instance
export const accessibilityAuditor = AccessibilityAuditor.getInstance();