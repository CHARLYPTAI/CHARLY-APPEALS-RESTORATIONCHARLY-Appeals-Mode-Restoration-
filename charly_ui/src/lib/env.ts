// Environment variable utilities with type safety

interface EnvironmentConfig {
  apiUrl: string;
  environment: 'development' | 'production' | 'staging';
  enableDebugMode: boolean;
  enableAnalytics: boolean;
  maxFileSizeMB: number;
  uploadTimeoutMs: number;
  aiAnalysisEnabled: boolean;
  aiAnalysisTimeoutMs: number;
  enableEnhancedReports: boolean;
  marketDataCacheTtlMs: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  mockDataEnabled: boolean;
}

// Helper function to safely parse boolean environment variables
const parseBoolean = (value: string | undefined, defaultValue: boolean = false): boolean => {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

// Helper function to safely parse number environment variables
const parseNumber = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Get environment configuration with type safety and defaults
export const getEnvironmentConfig = (): EnvironmentConfig => {
  return {
    apiUrl: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001',
    environment: (import.meta.env.VITE_ENVIRONMENT as 'development' | 'production' | 'staging') || 'development',
    enableDebugMode: parseBoolean(import.meta.env.VITE_ENABLE_DEBUG_MODE, true),
    enableAnalytics: parseBoolean(import.meta.env.VITE_ENABLE_ANALYTICS, false),
    maxFileSizeMB: parseNumber(import.meta.env.VITE_MAX_FILE_SIZE_MB, 10),
    uploadTimeoutMs: parseNumber(import.meta.env.VITE_UPLOAD_TIMEOUT_MS, 30000),
    aiAnalysisEnabled: parseBoolean(import.meta.env.VITE_AI_ANALYSIS_ENABLED, true),
    aiAnalysisTimeoutMs: parseNumber(import.meta.env.VITE_AI_ANALYSIS_TIMEOUT_MS, 15000),
    enableEnhancedReports: parseBoolean(import.meta.env.VITE_ENABLE_ENHANCED_REPORTS, true),
    marketDataCacheTtlMs: parseNumber(import.meta.env.VITE_MARKET_DATA_CACHE_TTL_MS, 300000),
    logLevel: (import.meta.env.VITE_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    mockDataEnabled: parseBoolean(import.meta.env.VITE_MOCK_DATA_ENABLED, false)
  };
};

// Export singleton instance
export const env = getEnvironmentConfig();

// Utility functions for common environment checks
export const isDevelopment = () => env.environment === 'development';
export const isProduction = () => env.environment === 'production';
export const isStaging = () => env.environment === 'staging';

// API URL builder with fallback
export const getApiUrl = (endpoint: string = ''): string => {
  const baseUrl = env.apiUrl.endsWith('/') ? env.apiUrl.slice(0, -1) : env.apiUrl;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};