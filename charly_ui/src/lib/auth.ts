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
  private baseUrl = 'http://127.0.0.1:8001/api/auth';

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('Auth: Starting login request to:', `${this.baseUrl}/login`);
    console.log('Auth: Login credentials:', { email: credentials.email, password: '[REDACTED]' });
    
    let response: Response;
    
    try {
      response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(credentials),
      });

      console.log('Auth: Response received:', response.status, response.statusText);
    } catch (fetchError) {
      console.error('Auth: Network/fetch error during login:', fetchError);
      throw new Error(`Network error: ${fetchError.message}`);
    }

    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}`;
      try {
        const error = await response.json();
        errorDetail = error.detail || error.message || errorDetail;
      } catch (parseError) {
        console.error('Auth: Could not parse error response:', parseError);
      }
      console.error('Auth: Login failed with response:', response.status, errorDetail);
      throw new Error(errorDetail);
    }

    const apiResponse = await response.json();
    console.log('Auth: Login API response received:', Object.keys(apiResponse));
    
    // Validate API response structure
    if (!apiResponse.access_token || !apiResponse.user) {
      console.error('Auth: Invalid API response structure:', apiResponse);
      throw new Error('Invalid login response from server');
    }
    
    // Transform API response to expected format
    const authData: AuthResponse = {
      user: {
        id: apiResponse.user.id || 'unknown',
        email: apiResponse.user.email || 'unknown@example.com',
        name: apiResponse.user.email || 'Unknown User', // Use email as name if no name field
        role: apiResponse.user.role || 'user',
        permissions: apiResponse.user.permissions || [],
        organization: apiResponse.user.firm_name || 'Unknown Organization'
      },
      tokens: {
        accessToken: apiResponse.access_token,
        refreshToken: apiResponse.refresh_token || '',
        expiresAt: Date.now() + ((apiResponse.expires_in || 3600) * 1000),
        tokenType: 'Bearer' as const
      }
    };
    
    // Store tokens and user data securely
    tokenManager.setTokens(authData.tokens);
    tokenManager.setUser(authData.user);
    
    console.log('Auth: Login successful, tokens stored');
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
    const token = tokenManager.getAccessToken();
    const isAuth = token !== null && !tokenManager.isTokenExpired(token);
    console.log(`Auth: isAuthenticated check - token present: ${!!token}, expired: ${token ? tokenManager.isTokenExpired(token) : 'N/A'}, result: ${isAuth}`);
    return isAuth;
  }

  async ensureValidToken(): Promise<string> {
    let token = tokenManager.getAccessToken();
    console.log(`Auth: Current token available: ${!!token}`);
    
    if (!token) {
      console.log('Auth: No token available, throwing error');
      throw new Error('No access token available');
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
  try {
    // Always try to get a valid token first
    const token = await authService.ensureValidToken();
    console.log(`Auth: Making authenticated request to ${url} with token present: ${!!token}`);
    
    // Convert relative URLs to absolute backend URLs
    const fullUrl = url.startsWith('/api') ? `http://127.0.0.1:8001${url}` : url;
    console.log(`Auth: Full URL: ${fullUrl}`);
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-Token': getCsrfToken(),
      ...options.headers,
    };

    const response = await fetch(fullUrl, {
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