// Apple CTO Security: Authentication Layer Implementation
import { jwtDecode } from 'jwt-decode';
import { encryptedTokenManager, MemorySecurity } from './encryption';

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

// Enhanced Token Management with Encryption
class TokenManager {
  setTokens(tokens: AuthToken): void {
    encryptedTokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
  }

  getAccessToken(): string | null {
    return encryptedTokenManager.getAccessToken();
  }

  getRefreshToken(): string | null {
    return encryptedTokenManager.getRefreshToken();
  }

  setUser(user: AuthUser): void {
    encryptedTokenManager.setUser(user);
  }

  getUser(): AuthUser | null {
    const userData = encryptedTokenManager.getUser();
    return userData as AuthUser | null;
  }

  clearTokens(): void {
    encryptedTokenManager.clearTokens();
    
    // Clear sensitive data from memory
    MemorySecurity.clearVariable(this, 'cachedUser');
    MemorySecurity.clearVariable(this, 'cachedToken');
  }

  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<{ exp: number }>(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  // Store sensitive temporary data in encrypted session storage
  setSensitiveSessionData(key: string, value: string): void {
    encryptedTokenManager.setSensitiveData(key, value);
  }

  getSensitiveSessionData(key: string): string | null {
    return encryptedTokenManager.getSensitiveData(key);
  }
}

// Global token manager instance
export const tokenManager = new TokenManager();

// Authentication Service
class AuthService {
  private baseUrl = '/api/auth';

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const authData: AuthResponse = await response.json();
    
    // Store tokens and user data securely
    tokenManager.setTokens(authData.tokens);
    tokenManager.setUser(authData.user);

    return authData;
  }

  async logout(): Promise<void> {
    const refreshToken = tokenManager.getRefreshToken();
    
    if (refreshToken) {
      try {
        await fetch(`${this.baseUrl}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenManager.getAccessToken()}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (logoutError) {
        console.error('Logout request failed:', logoutError);
      }
    }

    tokenManager.clearTokens();
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
    // Development bypass
    if (import.meta.env.MODE === 'development') {
      return true;
    }
    const token = tokenManager.getAccessToken();
    return token !== null && !tokenManager.isTokenExpired(token);
  }

  async ensureValidToken(): Promise<string> {
    // Development bypass
    if (import.meta.env.MODE === 'development') {
      return 'dev-token-12345';
    }
    let token = tokenManager.getAccessToken();
    
    if (!token) {
      throw new Error('No access token available');
    }

    if (tokenManager.isTokenExpired(token)) {
      try {
        const newTokens = await this.refreshToken();
        token = newTokens.accessToken;
      } catch {
        tokenManager.clearTokens();
        throw new Error('Authentication session expired');
      }
    }

    return token;
  }

  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    return user?.permissions.includes(permission) || false;
  }

  hasRole(role: AuthUser['role']): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }
}

// Global auth service instance
export const authService = new AuthService();

// API Request Interceptor with Authentication
export async function authenticatedRequest(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  // Development bypass - use plain fetch
  if (import.meta.env.MODE === 'development') {
    return fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers }
    });
  }
  
  try {
    const token = await authService.ensureValidToken();
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-Token': getCsrfToken(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      tokenManager.clearTokens();
      window.location.href = '/login';
      throw new Error('Authentication required');
    }

    return response;
  } catch (requestError) {
    console.error('Authenticated request failed:', requestError);
    throw requestError;
  }
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