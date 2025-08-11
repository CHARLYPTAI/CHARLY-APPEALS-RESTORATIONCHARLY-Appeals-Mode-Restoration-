/**
 * CHARLY 2.0 - API Security Manager
 * Enterprise-grade API security with rate limiting, DDoS protection, and request validation
 */

interface RateLimitRule {
  id: string;
  name: string;
  endpoint: string;
  method: string[];
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: SecurityRequest) => string;
  onLimitReached?: (request: SecurityRequest) => void;
  exemptRoles?: string[];
  burstAllowance?: number; // Additional requests allowed in burst
}

interface SecurityRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  fingerprint: string;
}

interface RateLimitState {
  requests: number;
  windowStart: number;
  lastRequest: number;
  burstUsed: number;
  blocked: boolean;
  blockedUntil?: number;
}

interface SecurityThreat {
  type: 'rate_limit_exceeded' | 'suspicious_pattern' | 'malicious_payload' | 'brute_force' | 'injection_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  details: Record<string, unknown>;
  timestamp: Date;
  blocked: boolean;
}

interface APISecurityConfig {
  globalRateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  bruteForceProtection: {
    windowMs: number;
    maxAttempts: number;
    blockDurationMs: number;
  };
  ddosProtection: {
    enabled: boolean;
    threshold: number;
    windowMs: number;
  };
  requestValidation: {
    maxBodySize: number;
    requireContentType: boolean;
    allowedContentTypes: string[];
  };
  csrfProtection: {
    enabled: boolean;
    cookieName: string;
    headerName: string;
  };
  corsSettings: {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
    credentials: boolean;
  };
}

class APISecurityManager {
  private rateLimitRules: Map<string, RateLimitRule> = new Map();
  private rateLimitStates: Map<string, RateLimitState> = new Map();
  private threatLog: SecurityThreat[] = [];
  private blockedIPs: Map<string, number> = new Map(); // IP -> unblock timestamp
  private bruteForceAttempts: Map<string, { attempts: number; lastAttempt: number }> = new Map();
  private config: APISecurityConfig;
  private eventListeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();

  constructor() {
    this.config = {
      globalRateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 1000
      },
      bruteForceProtection: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxAttempts: 5,
        blockDurationMs: 60 * 60 * 1000 // 1 hour
      },
      ddosProtection: {
        enabled: true,
        threshold: 100, // requests per second
        windowMs: 1000
      },
      requestValidation: {
        maxBodySize: 10 * 1024 * 1024, // 10MB
        requireContentType: true,
        allowedContentTypes: [
          'application/json',
          'application/x-www-form-urlencoded',
          'multipart/form-data',
          'text/plain'
        ]
      },
      csrfProtection: {
        enabled: true,
        cookieName: 'charly-csrf-token',
        headerName: 'X-CSRF-Token'
      },
      corsSettings: {
        allowedOrigins: ['http://localhost:3000', 'http://localhost:5173'],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
        credentials: true
      }
    };

    this.initializeDefaultRules();
    this.setupCleanupTasks();
  }

  private initializeDefaultRules(): void {
    // Authentication endpoints - strict limits
    this.addRateLimitRule({
      id: 'auth_login',
      name: 'Login Rate Limit',
      endpoint: '/auth/login',
      method: ['POST'],
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      keyGenerator: (req) => `login:${req.ipAddress}`,
      onLimitReached: (req) => this.handleBruteForceAttempt(req)
    });

    this.addRateLimitRule({
      id: 'auth_mfa',
      name: 'MFA Verification Limit',
      endpoint: '/auth/mfa/verify',
      method: ['POST'],
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 10,
      keyGenerator: (req) => `mfa:${req.ipAddress}:${req.userId || 'anonymous'}`
    });

    // Password reset - prevent abuse
    this.addRateLimitRule({
      id: 'password_reset',
      name: 'Password Reset Limit',
      endpoint: '/auth/password/reset',
      method: ['POST'],
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
      keyGenerator: (req) => `reset:${req.ipAddress}`
    });

    // API endpoints - generous but protected
    this.addRateLimitRule({
      id: 'api_general',
      name: 'General API Limit',
      endpoint: '/api/*',
      method: ['GET', 'POST', 'PUT', 'DELETE'],
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
      exemptRoles: ['admin', 'super_admin'],
      burstAllowance: 20
    });

    // Upload endpoints - strict size and rate limits
    this.addRateLimitRule({
      id: 'file_upload',
      name: 'File Upload Limit',
      endpoint: '/api/upload',
      method: ['POST'],
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10,
      keyGenerator: (req) => `upload:${req.userId || req.ipAddress}`
    });

    // Export endpoints - prevent abuse
    this.addRateLimitRule({
      id: 'data_export',
      name: 'Data Export Limit',
      endpoint: '/api/export',
      method: ['GET', 'POST'],
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
      keyGenerator: (req) => `export:${req.userId || req.ipAddress}`
    });
  }

  // Main Security Middleware
  public async validateRequest(request: SecurityRequest): Promise<{
    allowed: boolean;
    reason?: string;
    retryAfter?: number;
    threat?: SecurityThreat;
  }> {
    try {
      // 1. Check if IP is blocked
      const ipBlockCheck = this.checkIPBlock(request.ipAddress);
      if (!ipBlockCheck.allowed) {
        return ipBlockCheck;
      }

      // 2. Validate request format and content
      const validationResult = this.validateRequestFormat(request);
      if (!validationResult.allowed) {
        return validationResult;
      }

      // 3. Check for malicious patterns
      const maliciousCheck = this.detectMaliciousPatterns(request);
      if (!maliciousCheck.allowed) {
        return maliciousCheck;
      }

      // 4. Apply rate limiting
      const rateLimitResult = this.checkRateLimit(request);
      if (!rateLimitResult.allowed) {
        return rateLimitResult;
      }

      // 5. DDoS protection
      const ddosCheck = this.checkDDoSProtection(request);
      if (!ddosCheck.allowed) {
        return ddosCheck;
      }

      // 6. CSRF protection for state-changing requests
      if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
        const csrfCheck = this.validateCSRFToken(request);
        if (!csrfCheck.allowed) {
          return csrfCheck;
        }
      }

      return { allowed: true };

    } catch (error) {
      console.error('[Security] Request validation failed:', error);
      return {
        allowed: false,
        reason: 'Security validation error'
      };
    }
  }

  // Rate Limiting
  private checkRateLimit(request: SecurityRequest): {
    allowed: boolean;
    reason?: string;
    retryAfter?: number;
  } {
    const applicableRules = this.getApplicableRules(request);
    
    for (const rule of applicableRules) {
      const key = rule.keyGenerator ? rule.keyGenerator(request) : this.getDefaultKey(request, rule);
      const state = this.getRateLimitState(key);
      const now = Date.now();

      // Reset window if needed
      if (now - state.windowStart >= rule.windowMs) {
        state.requests = 0;
        state.windowStart = now;
        state.burstUsed = 0;
      }

      // Check if limit exceeded
      const maxAllowed = rule.maxRequests + (rule.burstAllowance || 0);
      if (state.requests >= maxAllowed) {
        const retryAfter = Math.ceil((state.windowStart + rule.windowMs - now) / 1000);
        
        this.recordThreat({
          type: 'rate_limit_exceeded',
          severity: 'medium',
          source: request.ipAddress,
          details: {
            rule: rule.name,
            requests: state.requests,
            limit: rule.maxRequests,
            endpoint: request.url
          },
          timestamp: new Date(),
          blocked: true
        });

        if (rule.onLimitReached) {
          rule.onLimitReached(request);
        }

        return {
          allowed: false,
          reason: `Rate limit exceeded for ${rule.name}`,
          retryAfter
        };
      }

      // Increment counter
      state.requests++;
      state.lastRequest = now;

      // Track burst usage
      if (state.requests > rule.maxRequests) {
        state.burstUsed++;
      }

      this.rateLimitStates.set(key, state);
    }

    return { allowed: true };
  }

  private getApplicableRules(request: SecurityRequest): RateLimitRule[] {
    const rules: RateLimitRule[] = [];
    
    for (const rule of this.rateLimitRules.values()) {
      if (this.isRuleApplicable(rule, request)) {
        rules.push(rule);
      }
    }
    
    return rules.sort((a, b) => a.maxRequests - b.maxRequests); // Most restrictive first
  }

  private isRuleApplicable(rule: RateLimitRule, request: SecurityRequest): boolean {
    // Check method
    if (!rule.method.includes(request.method)) {
      return false;
    }

    // Check endpoint pattern
    if (rule.endpoint.includes('*')) {
      const pattern = rule.endpoint.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(request.url);
    } else {
      return request.url === rule.endpoint || request.url.startsWith(rule.endpoint);
    }
  }

  private getRateLimitState(key: string): RateLimitState {
    if (!this.rateLimitStates.has(key)) {
      this.rateLimitStates.set(key, {
        requests: 0,
        windowStart: Date.now(),
        lastRequest: 0,
        burstUsed: 0,
        blocked: false
      });
    }
    return this.rateLimitStates.get(key)!;
  }

  private getDefaultKey(request: SecurityRequest, rule: RateLimitRule): string {
    return `${rule.id}:${request.userId || request.ipAddress}`;
  }

  // Brute Force Protection
  private handleBruteForceAttempt(request: SecurityRequest): void {
    const key = `brute_force:${request.ipAddress}`;
    const now = Date.now();
    
    if (!this.bruteForceAttempts.has(key)) {
      this.bruteForceAttempts.set(key, { attempts: 0, lastAttempt: now });
    }
    
    const attempts = this.bruteForceAttempts.get(key)!;
    
    // Reset if window expired
    if (now - attempts.lastAttempt > this.config.bruteForceProtection.windowMs) {
      attempts.attempts = 0;
    }
    
    attempts.attempts++;
    attempts.lastAttempt = now;
    
    if (attempts.attempts >= this.config.bruteForceProtection.maxAttempts) {
      const blockUntil = now + this.config.bruteForceProtection.blockDurationMs;
      this.blockedIPs.set(request.ipAddress, blockUntil);
      
      this.recordThreat({
        type: 'brute_force',
        severity: 'high',
        source: request.ipAddress,
        details: {
          attempts: attempts.attempts,
          endpoint: request.url,
          userAgent: request.userAgent
        },
        timestamp: new Date(),
        blocked: true
      });
      
      this.emit('ipBlocked', { ip: request.ipAddress, reason: 'brute_force', until: blockUntil });
    }
  }

  // IP Blocking
  private checkIPBlock(ipAddress: string): {
    allowed: boolean;
    reason?: string;
    retryAfter?: number;
  } {
    const blockUntil = this.blockedIPs.get(ipAddress);
    if (blockUntil && Date.now() < blockUntil) {
      const retryAfter = Math.ceil((blockUntil - Date.now()) / 1000);
      return {
        allowed: false,
        reason: 'IP address blocked due to suspicious activity',
        retryAfter
      };
    }
    
    // Clean up expired blocks
    if (blockUntil && Date.now() >= blockUntil) {
      this.blockedIPs.delete(ipAddress);
    }
    
    return { allowed: true };
  }

  // Request Validation
  private validateRequestFormat(request: SecurityRequest): {
    allowed: boolean;
    reason?: string;
    threat?: SecurityThreat;
  } {
    // Check content type for requests with body
    if (request.body && this.config.requestValidation.requireContentType) {
      const contentType = request.headers['content-type'] || request.headers['Content-Type'];
      if (!contentType) {
        return {
          allowed: false,
          reason: 'Missing Content-Type header'
        };
      }
      
      const isAllowed = this.config.requestValidation.allowedContentTypes.some(
        allowed => contentType.startsWith(allowed)
      );
      
      if (!isAllowed) {
        this.recordThreat({
          type: 'malicious_payload',
          severity: 'medium',
          source: request.ipAddress,
          details: {
            contentType,
            url: request.url,
            reason: 'invalid_content_type'
          },
          timestamp: new Date(),
          blocked: true
        });
        
        return {
          allowed: false,
          reason: 'Invalid Content-Type'
        };
      }
    }

    // Check body size
    if (request.body) {
      const bodySize = JSON.stringify(request.body).length;
      if (bodySize > this.config.requestValidation.maxBodySize) {
        return {
          allowed: false,
          reason: 'Request body too large'
        };
      }
    }

    return { allowed: true };
  }

  // Malicious Pattern Detection
  private detectMaliciousPatterns(request: SecurityRequest): {
    allowed: boolean;
    reason?: string;
    threat?: SecurityThreat;
  } {
    const suspiciousPatterns = [
      // SQL Injection patterns
      /(\bSELECT\b|\bUNION\b|\bINSERT\b|\bDELETE\b|\bUPDATE\b|\bDROP\b)/i,
      /(\bOR\s+1=1\b|\bAND\s+1=1\b)/i,
      
      // XSS patterns
      /<script[^>]*>.*?<\/script>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      
      // Path traversal
      /\.\.\//,
      /\.\.\\\\/,
      
      // Command injection
      /(\bexec\b|\beval\b|\bsystem\b|\bshell_exec\b)/i,
      /[;&|`$]/,
      
      // NoSQL injection
      /\$where/i,
      /\$ne/i,
      /\$regex/i
    ];

    const checkContent = (content: string): boolean => {
      return suspiciousPatterns.some(pattern => pattern.test(content));
    };

    // Check URL
    if (checkContent(request.url)) {
      this.recordThreat({
        type: 'injection_attempt',
        severity: 'high',
        source: request.ipAddress,
        details: {
          url: request.url,
          type: 'url_injection'
        },
        timestamp: new Date(),
        blocked: true
      });
      
      return {
        allowed: false,
        reason: 'Malicious pattern detected in URL'
      };
    }

    // Check headers
    for (const [key, value] of Object.entries(request.headers)) {
      if (checkContent(value)) {
        this.recordThreat({
          type: 'injection_attempt',
          severity: 'high',
          source: request.ipAddress,
          details: {
            header: key,
            value: value,
            type: 'header_injection'
          },
          timestamp: new Date(),
          blocked: true
        });
        
        return {
          allowed: false,
          reason: 'Malicious pattern detected in headers'
        };
      }
    }

    // Check body
    if (request.body) {
      const bodyString = typeof request.body === 'string' ? 
        request.body : JSON.stringify(request.body);
      
      if (checkContent(bodyString)) {
        this.recordThreat({
          type: 'injection_attempt',
          severity: 'high',
          source: request.ipAddress,
          details: {
            bodySize: bodyString.length,
            type: 'body_injection'
          },
          timestamp: new Date(),
          blocked: true
        });
        
        return {
          allowed: false,
          reason: 'Malicious pattern detected in request body'
        };
      }
    }

    return { allowed: true };
  }

  // DDoS Protection
  private checkDDoSProtection(request: SecurityRequest): {
    allowed: boolean;
    reason?: string;
  } {
    if (!this.config.ddosProtection.enabled) {
      return { allowed: true };
    }

    // DDoS protection key for this IP
    const now = Date.now();
    const windowStart = now - this.config.ddosProtection.windowMs;
    
    // Count recent requests from this IP
    const recentRequests = this.getRecentRequestCount(request.ipAddress, windowStart);
    
    if (recentRequests >= this.config.ddosProtection.threshold) {
      this.recordThreat({
        type: 'suspicious_pattern',
        severity: 'critical',
        source: request.ipAddress,
        details: {
          requestCount: recentRequests,
          threshold: this.config.ddosProtection.threshold,
          timeWindow: this.config.ddosProtection.windowMs
        },
        timestamp: new Date(),
        blocked: true
      });
      
      // Block IP temporarily
      const blockUntil = now + (15 * 60 * 1000); // 15 minutes
      this.blockedIPs.set(request.ipAddress, blockUntil);
      
      return {
        allowed: false,
        reason: 'DDoS protection triggered'
      };
    }

    return { allowed: true };
  }

  private getRecentRequestCount(ipAddress: string, since: number): number {
    // This would typically query a database or cache
    // For now, we'll estimate based on rate limit states
    let count = 0;
    
    for (const [key, state] of this.rateLimitStates.entries()) {
      if (key.includes(ipAddress) && state.lastRequest >= since) {
        count += state.requests;
      }
    }
    
    return count;
  }

  // CSRF Protection
  private validateCSRFToken(request: SecurityRequest): {
    allowed: boolean;
    reason?: string;
  } {
    if (!this.config.csrfProtection.enabled) {
      return { allowed: true };
    }

    const token = request.headers[this.config.csrfProtection.headerName.toLowerCase()];
    const cookie = this.extractCSRFCookie(request.headers.cookie || '');
    
    if (!token) {
      return {
        allowed: false,
        reason: 'Missing CSRF token'
      };
    }
    
    if (!cookie) {
      return {
        allowed: false,
        reason: 'Missing CSRF cookie'
      };
    }
    
    if (token !== cookie) {
      this.recordThreat({
        type: 'malicious_payload',
        severity: 'high',
        source: request.ipAddress,
        details: {
          reason: 'csrf_token_mismatch',
          url: request.url
        },
        timestamp: new Date(),
        blocked: true
      });
      
      return {
        allowed: false,
        reason: 'CSRF token mismatch'
      };
    }

    return { allowed: true };
  }

  private extractCSRFCookie(cookieHeader: string): string | null {
    const cookies = cookieHeader.split(';');
    const csrfCookie = cookies.find(cookie => 
      cookie.trim().startsWith(`${this.config.csrfProtection.cookieName}=`)
    );
    
    return csrfCookie ? csrfCookie.split('=')[1] : null;
  }

  // Configuration Management
  public addRateLimitRule(rule: RateLimitRule): void {
    this.rateLimitRules.set(rule.id, rule);
  }

  public removeRateLimitRule(ruleId: string): void {
    this.rateLimitRules.delete(ruleId);
  }

  public updateConfig(newConfig: Partial<APISecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public blockIP(ipAddress: string, durationMs: number): void {
    const blockUntil = Date.now() + durationMs;
    this.blockedIPs.set(ipAddress, blockUntil);
    this.emit('ipBlocked', { ip: ipAddress, reason: 'manual', until: blockUntil });
  }

  public unblockIP(ipAddress: string): void {
    this.blockedIPs.delete(ipAddress);
    this.emit('ipUnblocked', { ip: ipAddress });
  }

  // Monitoring and Analytics
  private recordThreat(threat: SecurityThreat): void {
    this.threatLog.push(threat);
    
    // Keep only last 10000 threats
    if (this.threatLog.length > 10000) {
      this.threatLog = this.threatLog.slice(-10000);
    }
    
    this.emit('threatDetected', threat);
  }

  public getSecurityStats(): {
    totalThreats: number;
    threatsByType: Record<string, number>;
    threatsBySeverity: Record<string, number>;
    blockedIPs: number;
    activeRules: number;
  } {
    const threatsByType: Record<string, number> = {};
    const threatsBySeverity: Record<string, number> = {};
    
    this.threatLog.forEach(threat => {
      threatsByType[threat.type] = (threatsByType[threat.type] || 0) + 1;
      threatsBySeverity[threat.severity] = (threatsBySeverity[threat.severity] || 0) + 1;
    });
    
    return {
      totalThreats: this.threatLog.length,
      threatsByType,
      threatsBySeverity,
      blockedIPs: this.blockedIPs.size,
      activeRules: this.rateLimitRules.size
    };
  }

  public getRecentThreats(hours: number = 24): SecurityThreat[] {
    const since = new Date(Date.now() - (hours * 60 * 60 * 1000));
    return this.threatLog.filter(threat => threat.timestamp >= since);
  }

  public getBlockedIPs(): Array<{ ip: string; until: Date }> {
    const result: Array<{ ip: string; until: Date }> = [];
    
    for (const [ip, blockUntil] of this.blockedIPs.entries()) {
      if (blockUntil > Date.now()) {
        result.push({ ip, until: new Date(blockUntil) });
      }
    }
    
    return result;
  }

  public getRateLimitStats(): Array<{
    rule: string;
    key: string;
    requests: number;
    limit: number;
    windowStart: Date;
    blocked: boolean;
  }> {
    const stats: Array<{
      rule: string;
      key: string;
      requests: number;
      limit: number;
      windowStart: Date;
      blocked: boolean;
    }> = [];
    
    for (const [key, state] of this.rateLimitStates.entries()) {
      const ruleId = key.split(':')[0];
      const rule = this.rateLimitRules.get(ruleId);
      
      if (rule) {
        stats.push({
          rule: rule.name,
          key,
          requests: state.requests,
          limit: rule.maxRequests,
          windowStart: new Date(state.windowStart),
          blocked: state.blocked
        });
      }
    }
    
    return stats;
  }

  // Cleanup Tasks
  private setupCleanupTasks(): void {
    // Clean up expired rate limit states every 5 minutes
    setInterval(() => {
      this.cleanupRateLimitStates();
    }, 5 * 60 * 1000);
    
    // Clean up expired IP blocks every minute
    setInterval(() => {
      this.cleanupExpiredBlocks();
    }, 60 * 1000);
    
    // Clean up old threat logs every hour
    setInterval(() => {
      this.cleanupOldThreats();
    }, 60 * 60 * 1000);
  }

  private cleanupRateLimitStates(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, state] of this.rateLimitStates.entries()) {
      // Remove states older than 1 hour
      if (now - state.lastRequest > 60 * 60 * 1000) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.rateLimitStates.delete(key));
  }

  private cleanupExpiredBlocks(): void {
    const now = Date.now();
    const expiredIPs: string[] = [];
    
    for (const [ip, blockUntil] of this.blockedIPs.entries()) {
      if (now >= blockUntil) {
        expiredIPs.push(ip);
      }
    }
    
    expiredIPs.forEach(ip => {
      this.blockedIPs.delete(ip);
      this.emit('ipUnblocked', { ip });
    });
  }

  private cleanupOldThreats(): void {
    const cutoff = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)); // 7 days
    this.threatLog = this.threatLog.filter(threat => threat.timestamp >= cutoff);
  }

  // Event System
  private emit(event: string, data?: unknown): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('[Security] Event listener error:', error);
      }
    });
  }

  public onThreatDetected(callback: (threat: SecurityThreat) => void): () => void {
    if (!this.eventListeners.has('threatDetected')) {
      this.eventListeners.set('threatDetected', []);
    }
    this.eventListeners.get('threatDetected')!.push(callback);
    
    return () => {
      const listeners = this.eventListeners.get('threatDetected');
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) listeners.splice(index, 1);
      }
    };
  }

  public onIPBlocked(callback: (data: { ip: string; reason: string; until: number }) => void): () => void {
    if (!this.eventListeners.has('ipBlocked')) {
      this.eventListeners.set('ipBlocked', []);
    }
    this.eventListeners.get('ipBlocked')!.push(callback);
    
    return () => {
      const listeners = this.eventListeners.get('ipBlocked');
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) listeners.splice(index, 1);
      }
    };
  }
}

// Singleton instance
export { APISecurityManager };
export const apiSecurityManager = new APISecurityManager();
export default apiSecurityManager;