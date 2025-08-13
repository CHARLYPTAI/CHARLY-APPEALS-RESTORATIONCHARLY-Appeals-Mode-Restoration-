/**
 * CHARLY 2.0 - Advanced Authentication Manager
 * Enterprise-grade JWT authentication with refresh token rotation and security monitoring
 */

import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
  jti: string; // JWT ID for revocation
  aud: string; // Audience
  iss: string; // Issuer
  sessionId: string;
}

// RefreshTokenPayload interface - for future refresh token implementation
// Refresh token payload interface for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  tokenFamily: string; // For rotation detection
  iat: number;
  exp: number;
  jti: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: 'Bearer';
}

interface LoginCredentials {
  email: string;
  password: string;
  mfaCode?: string;
  deviceFingerprint?: string;
  rememberDevice?: boolean;
}

interface AuthSession {
  sessionId: string;
  userId: string;
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  riskScore: number;
}

interface SecurityEvent {
  type: 'login' | 'logout' | 'token_refresh' | 'mfa_challenge' | 'suspicious_activity' | 'token_revoked';
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, unknown>;
  riskScore: number;
  timestamp: Date;
}

class AuthenticationManager {
  private readonly TOKEN_STORAGE_KEY = 'charly_auth_tokens';
  private readonly REFRESH_TOKEN_KEY = 'charly_refresh_token';
  private readonly SESSION_KEY = 'charly_session';
  private readonly API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  
  private tokens: AuthTokens | null = null;
  private currentSession: AuthSession | null = null;
  private refreshPromise: Promise<AuthTokens> | null = null;
  private securityEvents: SecurityEvent[] = [];
  private eventListeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();

  constructor() {
    this.initializeAuth();
    this.setupSecurityMonitoring();
    this.setupTokenRefreshScheduler();
  }

  private initializeAuth(): void {
    // Load tokens from secure storage
    this.loadTokensFromStorage();
    
    // Validate existing session
    if (this.tokens) {
      this.validateSession();
    }

    // Setup periodic session validation
    setInterval(() => this.validateSession(), 60000); // Every minute
  }

  private setupSecurityMonitoring(): void {
    // Monitor for suspicious activities
    this.addEventListener('securityEvent', (event: SecurityEvent) => {
      if (event.riskScore > 80) {
        this.handleHighRiskActivity(event);
      }
    });

    // Monitor page visibility for session management
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.recordActivity('page_hidden');
      } else {
        this.recordActivity('page_visible');
        this.validateSession();
      }
    });

    // Monitor for token theft attempts
    window.addEventListener('storage', (e) => {
      if (e.key === this.TOKEN_STORAGE_KEY && e.newValue !== JSON.stringify(this.tokens)) {
        this.handlePotentialTokenTheft();
      }
    });
  }

  private setupTokenRefreshScheduler(): void {
    setInterval(() => {
      if (this.tokens && this.shouldRefreshToken()) {
        this.refreshTokens();
      }
    }, 30000); // Check every 30 seconds
  }

  // Authentication Methods
  public async login(credentials: LoginCredentials): Promise<{ success: boolean; requiresMFA?: boolean; session?: AuthSession }> {
    try {
      const deviceFingerprint = await this.generateDeviceFingerprint();
      const loginData = {
        ...credentials,
        deviceFingerprint,
        clientInfo: this.getClientInfo()
      };

      const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Version': '2.0.0',
          'X-Client-Platform': 'web'
        },
        body: JSON.stringify(loginData)
      });

      const result = await response.json();

      if (response.ok) {
        if (result.requiresMFA) {
          this.recordSecurityEvent({
            type: 'mfa_challenge',
            userId: result.userId,
            ipAddress: await this.getClientIP(),
            userAgent: navigator.userAgent,
            details: { reason: 'mfa_required' },
            riskScore: 30,
            timestamp: new Date()
          });
          
          return { success: false, requiresMFA: true };
        }

        // Store tokens and session
        await this.handleSuccessfulLogin(result);
        
        return { success: true, session: this.currentSession };
      } else {
        this.recordSecurityEvent({
          type: 'login',
          ipAddress: await this.getClientIP(),
          userAgent: navigator.userAgent,
          details: { error: result.error, email: credentials.email },
          riskScore: 60,
          timestamp: new Date()
        });
        
        throw new Error(result.error || 'Login failed');
      }
    } catch {
      console.error('[Auth] Login error:', error);
      throw error;
    }
  }

  public async logout(allDevices: boolean = false): Promise<void> {
    try {
      if (this.tokens) {
        const response = await fetch(`${this.API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.tokens.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            allDevices,
            sessionId: this.currentSession?.sessionId 
          })
        });

        if (!response.ok) {
          console.warn('[Auth] Logout request failed, proceeding with local cleanup');
        }
      }

      this.recordSecurityEvent({
        type: 'logout',
        userId: this.getCurrentUserId(),
        sessionId: this.currentSession?.sessionId,
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        details: { allDevices },
        riskScore: 0,
        timestamp: new Date()
      });

      this.clearAuthData();
      this.emit('logout');
      
    } catch {
      console.error('[Auth] Logout error:', error);
      // Always clear local data even if server logout fails
      this.clearAuthData();
    }
  }

  // Token Management
  public async refreshTokens(): Promise<AuthTokens> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const newTokens = await this.refreshPromise;
      this.refreshPromise = null;
      return newTokens;
    } catch {
      this.refreshPromise = null;
      throw error;
    }
  }

  private async performTokenRefresh(): Promise<AuthTokens> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.tokens?.refreshToken}`
        },
        body: JSON.stringify({
          sessionId: this.currentSession?.sessionId,
          deviceFingerprint: await this.generateDeviceFingerprint()
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Refresh token expired or invalid
          this.handleTokenExpiration();
          throw new Error('Refresh token expired');
        }
        throw new Error('Token refresh failed');
      }

      const result = await response.json();
      const newTokens: AuthTokens = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresAt,
        tokenType: 'Bearer'
      };

      this.tokens = newTokens;
      this.saveTokensToStorage();

      this.recordSecurityEvent({
        type: 'token_refresh',
        userId: this.getCurrentUserId(),
        sessionId: this.currentSession?.sessionId,
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        details: { success: true },
        riskScore: 0,
        timestamp: new Date()
      });

      this.emit('tokensRefreshed', newTokens);
      return newTokens;

    } catch {
      console.error('[Auth] Token refresh failed:', error);
      
      this.recordSecurityEvent({
        type: 'token_refresh',
        userId: this.getCurrentUserId(),
        sessionId: this.currentSession?.sessionId,
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        details: { error: error.message },
        riskScore: 70,
        timestamp: new Date()
      });

      throw error;
    }
  }

  // Token Validation and Utilities
  public isAuthenticated(): boolean {
    return this.tokens !== null && this.isTokenValid(this.tokens.accessToken);
  }

  public getAccessToken(): string | null {
    if (!this.tokens || !this.isTokenValid(this.tokens.accessToken)) {
      return null;
    }
    return this.tokens.accessToken;
  }

  public getCurrentUser(): TokenPayload | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      return jwtDecode<TokenPayload>(token);
    } catch {
      console.error('[Auth] Failed to decode token:', error);
      return null;
    }
  }

  public getCurrentUserId(): string | null {
    const user = this.getCurrentUser();
    return user?.sub || null;
  }

  public hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.roles?.includes(role) || false;
  }

  public hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    return user?.permissions?.includes(permission) || false;
  }

  public hasAnyPermission(permissions: string[]): boolean {
    const user = this.getCurrentUser();
    if (!user?.permissions) return false;
    return permissions.some(permission => user.permissions.includes(permission));
  }

  // Security Utilities
  private isTokenValid(token: string): boolean {
    if (!token) return false;

    try {
      const payload = jwtDecode<TokenPayload>(token);
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check expiration with 30 second buffer
      if (payload.exp <= currentTime + 30) {
        return false;
      }

      // Validate token structure
      if (!payload.sub || !payload.email || !payload.jti) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  private shouldRefreshToken(): boolean {
    if (!this.tokens) return false;

    const payload = jwtDecode<TokenPayload>(this.tokens.accessToken);
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Refresh when 5 minutes remaining
    return payload.exp <= currentTime + 300;
  }

  private async validateSession(): Promise<void> {
    if (!this.currentSession || !this.tokens) return;

    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/validate-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.tokens.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: this.currentSession.sessionId
        })
      });

      if (!response.ok) {
        this.handleSessionInvalid();
      }
    } catch {
      console.warn('[Auth] Session validation failed:', error);
    }
  }

  // Storage Management
  private loadTokensFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.TOKEN_STORAGE_KEY);
      if (stored) {
        this.tokens = JSON.parse(stored);
      }

      const session = localStorage.getItem(this.SESSION_KEY);
      if (session) {
        this.currentSession = JSON.parse(session);
      }
    } catch {
      console.error('[Auth] Failed to load tokens from storage:', error);
      this.clearAuthData();
    }
  }

  private saveTokensToStorage(): void {
    try {
      if (this.tokens) {
        localStorage.setItem(this.TOKEN_STORAGE_KEY, JSON.stringify(this.tokens));
      }
      if (this.currentSession) {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentSession));
      }
    } catch {
      console.error('[Auth] Failed to save tokens to storage:', error);
    }
  }

  private clearAuthData(): void {
    this.tokens = null;
    this.currentSession = null;
    localStorage.removeItem(this.TOKEN_STORAGE_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.SESSION_KEY);
  }

  // Security Event Handlers
  private async handleSuccessfulLogin(loginResult: Record<string, unknown>): Promise<void> {
    this.tokens = {
      accessToken: loginResult.accessToken,
      refreshToken: loginResult.refreshToken,
      expiresAt: loginResult.expiresAt,
      tokenType: 'Bearer'
    };

    this.currentSession = {
      sessionId: loginResult.sessionId,
      userId: loginResult.userId,
      deviceFingerprint: loginResult.deviceFingerprint,
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
      riskScore: loginResult.riskScore || 0
    };

    this.saveTokensToStorage();

    this.recordSecurityEvent({
      type: 'login',
      userId: loginResult.userId,
      sessionId: loginResult.sessionId,
      ipAddress: this.currentSession.ipAddress,
      userAgent: navigator.userAgent,
      details: { success: true, riskScore: loginResult.riskScore },
      riskScore: loginResult.riskScore || 0,
      timestamp: new Date()
    });

    this.emit('login', this.currentSession);
  }

  private handleTokenExpiration(): void {
    this.recordSecurityEvent({
      type: 'token_revoked',
      userId: this.getCurrentUserId(),
      sessionId: this.currentSession?.sessionId,
      ipAddress: 'unknown',
      userAgent: navigator.userAgent,
      details: { reason: 'token_expired' },
      riskScore: 30,
      timestamp: new Date()
    });

    this.clearAuthData();
    this.emit('tokenExpired');
  }

  private handleSessionInvalid(): void {
    this.recordSecurityEvent({
      type: 'suspicious_activity',
      userId: this.getCurrentUserId(),
      sessionId: this.currentSession?.sessionId,
      ipAddress: 'unknown',
      userAgent: navigator.userAgent,
      details: { reason: 'session_invalid' },
      riskScore: 80,
      timestamp: new Date()
    });

    this.clearAuthData();
    this.emit('sessionInvalid');
  }

  private handleHighRiskActivity(event: SecurityEvent): void {
    console.warn('[Auth] High risk activity detected:', event);
    
    // Implement automated responses based on risk score
    if (event.riskScore >= 90) {
      this.logout(true); // Force logout from all devices
    } else if (event.riskScore >= 80) {
      this.emit('requireReauth');
    }
  }

  private handlePotentialTokenTheft(): void {
    this.recordSecurityEvent({
      type: 'suspicious_activity',
      userId: this.getCurrentUserId(),
      sessionId: this.currentSession?.sessionId,
      ipAddress: 'unknown',
      userAgent: navigator.userAgent,
      details: { reason: 'potential_token_theft' },
      riskScore: 95,
      timestamp: new Date()
    });

    this.logout(true);
  }

  // Utility Methods
  private async generateDeviceFingerprint(): Promise<string> {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.platform,
      navigator.hardwareConcurrency || 'unknown'
    ];

    const fingerprint = components.join('|');
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private getClientInfo(): Record<string, unknown> {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      hardwareConcurrency: navigator.hardwareConcurrency
    };
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  private recordActivity(): void {
    if (this.currentSession) {
      this.currentSession.lastActivity = new Date();
      this.saveTokensToStorage();
    }
  }

  private recordSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);
    
    // Keep only last 100 events in memory
    if (this.securityEvents.length > 100) {
      this.securityEvents = this.securityEvents.slice(-100);
    }

    this.emit('securityEvent', event);
  }

  // Event System
  private addEventListener(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  private removeEventListener(event: string, callback: (...args: unknown[]) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch {
          console.error('[Auth] Event listener error:', error);
        }
      });
    }
  }

  // Public Event Methods
  public onLogin(callback: (session: AuthSession) => void): () => void {
    this.addEventListener('login', callback);
    return () => this.removeEventListener('login', callback);
  }

  public onLogout(callback: () => void): () => void {
    this.addEventListener('logout', callback);
    return () => this.removeEventListener('logout', callback);
  }

  public onTokenExpired(callback: () => void): () => void {
    this.addEventListener('tokenExpired', callback);
    return () => this.removeEventListener('tokenExpired', callback);
  }

  public onSessionInvalid(callback: () => void): () => void {
    this.addEventListener('sessionInvalid', callback);
    return () => this.removeEventListener('sessionInvalid', callback);
  }

  public onRequireReauth(callback: () => void): () => void {
    this.addEventListener('requireReauth', callback);
    return () => this.removeEventListener('requireReauth', callback);
  }

  public onSecurityEvent(callback: (event: SecurityEvent) => void): () => void {
    this.addEventListener('securityEvent', callback);
    return () => this.removeEventListener('securityEvent', callback);
  }

  // Admin Methods
  public getSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents];
  }

  public getCurrentSession(): AuthSession | null {
    return this.currentSession;
  }

  public async revokeToken(tokenId: string): Promise<void> {
    try {
      await fetch(`${this.API_BASE_URL}/auth/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.tokens?.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tokenId })
      });
    } catch {
      console.error('[Auth] Token revocation failed:', error);
      throw error;
    }
  }
}

// Singleton instance
export { AuthenticationManager };
export const authManager = new AuthenticationManager();
export default authManager;