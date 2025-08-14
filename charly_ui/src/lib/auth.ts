// Apple CTO Security: Authentication Layer Implementation
import { jwtDecode } from 'jwt-decode';

// Authentication Types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'analyst';
  permissions: string[];
  organization?: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: 'Bearer';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthToken;
}

// Simplified Token Management (no encryption for now to avoid errors)
class TokenManager {
  setTokens(tokens: AuthToken): void {
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('refresh_token', tokens.refreshToken);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  setUser(user: AuthUser): void {
    localStorage.setItem('user_data', JSON.stringify(user));
  }

  getUser(): AuthUser | null {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
  }

  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<{ exp: number }>(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  // Store sensitive temporary data in session storage  
  setSensitiveSessionData(key: string, value: string): void {
    sessionStorage.setItem(`charly_${key}`, value);
  }

  getSensitiveSessionData(key: string): string | null {
    return sessionStorage.getItem(`charly_${key}`);
  }
}

// Global token manager instance
export const tokenManager = new TokenManager();

// Authentication Service
class AuthService {
  private baseUrl = '/api/auth'; // CSP-safe: same-origin relative URL

  async login(credentials: LoginCredentials): Promise<boolean> {
    console.log('🔐 Auth: Starting login request to:', `${this.baseUrl}/login`);
    console.log('🔐 Auth: Credentials:', { email: credentials.email, password: '***' });
    
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('🔐 Auth: Response status:', response.status);
      console.log('🔐 Auth: Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔐 Auth: Error response body:', errorText);
        try {
          const error = JSON.parse(errorText);
          console.error('🔐 Auth: Login failed:', error.detail);
        } catch {
          console.error('🔐 Auth: Non-JSON error response');
        }
        return false;
      }

      const data = await response.json();
      console.log('🔐 Auth: Login successful, response keys:', Object.keys(data));
      console.log('🔐 Auth: User data:', data.user);
      
      // Store tokens directly in localStorage (simple approach)
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token || '');
      localStorage.setItem('user_data', JSON.stringify(data.user));
      
      console.log('🔐 Auth: Tokens stored in localStorage');
      return true;
    } catch (error) {
      console.error('🔐 Auth: Login error (catch):', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    console.log('🔐 Auth: Logged out successfully');
  }

  async refreshToken(): Promise<AuthToken> {
    const refreshToken = tokenManager.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseUrl}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      tokenManager.clearTokens();
      throw new Error('Token refresh failed');
    }

    const tokens: AuthToken = await response.json();
    tokenManager.setTokens(tokens);
    
    return tokens;
  }

  getCurrentUser(): AuthUser | null {
    return tokenManager.getUser();
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    return !!token;
  }

  async ensureValidToken(): Promise<string> {
    let token = tokenManager.getAccessToken();
    console.log(`Auth: Current token available: ${!!token}`);
    
    if (!token) {
      console.info('Auth: No token — staying logged-out (no auto-login)');
      await this.ensureAutoLoginOrRefresh();
      token = tokenManager.getAccessToken();
      
      if (!token) {
        throw new Error('No access token available');
      }
    }

    if (tokenManager.isTokenExpired(token)) {
      console.log('Auth: Token expired, attempting refresh');
      try {
        const newTokens = await this.refreshToken();
        token = newTokens.accessToken;
        console.log('Auth: Token refreshed successfully');
      } catch (error) {
        console.error('Auth: Token refresh failed:', error);
        tokenManager.clearTokens();
        throw new Error('Authentication session expired');
      }
    }

    return token;
  }

  async ensureAutoLoginOrRefresh(): Promise<void> {
    const refreshToken = tokenManager.getRefreshToken();
    const accessToken = tokenManager.getAccessToken();
    
    // If no tokens exist, don't attempt recovery - treat as clean logged-out state
    if (!refreshToken && !accessToken) {
      console.log('Auth: No tokens present, treating as logged-out');
      return;
    }
    
    if (refreshToken) {
      console.log('Auth: Attempting token refresh');
      try {
        await this.refreshToken();
        return;
      } catch (error) {
        console.info('Auth: Refresh failed — staying logged-out');
        tokenManager.clearTokens();
        // After clearing tokens, treat as logged-out without error
        console.info('Auth: Cleared expired tokens, now logged-out');
        return;
      }
    }
    
    // No auto-login - clean logged-out state
    console.log('Auth: Clean logged-out state');
  }

  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    return user?.permissions.includes(permission) || false;
  }

  hasRole(role: AuthUser['role']): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  // R3 requirement: ensureReady function
  async ensureReady(): Promise<void> {
    const token = tokenManager.getAccessToken();
    
    if (!token || tokenManager.isTokenExpired(token)) {
      console.log('Auth: ensureReady - no valid token, attempting recovery');
      await this.ensureAutoLoginOrRefresh();
      
      const newToken = tokenManager.getAccessToken();
      if (!newToken) {
        console.info('Auth: ensureReady - no valid token after refresh, staying silent for logged-out state');
        return; // Silent return instead of noisy throw
      }
      console.log('Auth: ensureReady - token secured successfully');
    } else {
      console.log('Auth: ensureReady - valid token already available');
    }
  }
}

// Global auth service instance
export const authService = new AuthService();

// R3 requirement: Debug guard for raw fetch usage
if (import.meta.env.MODE === 'development') {
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const isApiCall = url.includes('/api/') && !url.includes('/api/auth/login') && !url.includes('/api/auth/refresh');
    
    if (isApiCall) {
      console.warn(`[AUTH GUARD] Raw fetch detected for API endpoint: ${url}. Consider using authenticatedRequest instead.`);
    }
    
    return originalFetch.call(this, input, init);
  };
}

// API Request Interceptor with Authentication
export async function authenticatedRequest(
  url: string,
  options: RequestInit = {},
  authRequired: boolean = true
): Promise<Response> {
  // Public/no-auth path
  if (!authRequired) {
    return fetch(url, options);
  }

  // Get token from localStorage
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No authentication token');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}

// CSRF Token Management
function getCsrfToken(): string {
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  return token || '';
}

// Session Management
export function setupSessionMonitoring(): void {
  // Check authentication status periodically
  setInterval(() => {
    if (!authService.isAuthenticated()) {
      authService.logout();
      window.location.href = '/login';
    }
  }, 60000); // Check every minute

  // Handle page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (!authService.isAuthenticated()) {
        authService.logout();
        window.location.href = '/login';
      }
    }
  });
}

// Role-based access control decorator
export function requirePermission(permission: string) {
  return function(target: unknown, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = function(...args: unknown[]) {
      if (!authService.hasPermission(permission)) {
        throw new Error(`Permission required: ${permission}`);
      }
      return method.apply(this, args);
    };
  };
}

// Export authentication status for React components
export function useAuth() {
  return {
    user: authService.getCurrentUser(),
    isAuthenticated: authService.isAuthenticated(),
    hasPermission: authService.hasPermission.bind(authService),
    hasRole: authService.hasRole.bind(authService),
    login: authService.login.bind(authService),
    logout: authService.logout.bind(authService),
  };
}