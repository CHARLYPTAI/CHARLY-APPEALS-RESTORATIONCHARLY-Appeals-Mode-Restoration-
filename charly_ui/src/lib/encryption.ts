// Apple CTO Security: Client-Side Encryption Implementation
import CryptoJS from 'crypto-js';

// Encryption Configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'AES',
  keySize: 256,
  ivSize: 128,
  iterations: 10000,
  saltSize: 64,
} as const;

// Generate a device-specific encryption key
function generateDeviceKey(): string {
  const deviceInfo = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    // Add some entropy but avoid fingerprinting
    Math.random().toString(36),
  ].join('|');

  return CryptoJS.SHA256(deviceInfo).toString();
}

// Secure storage encryption class
export class SecureStorage {
  private static instance: SecureStorage;
  private encryptionKey: string;

  private constructor() {
    // Use a combination of device key and session entropy
    const deviceKey = generateDeviceKey();
    const sessionKey = sessionStorage.getItem('charly_session_key') || 
                      CryptoJS.lib.WordArray.random(32).toString();
    
    if (!sessionStorage.getItem('charly_session_key')) {
      sessionStorage.setItem('charly_session_key', sessionKey);
    }

    this.encryptionKey = CryptoJS.SHA256(deviceKey + sessionKey).toString();
  }

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  // Encrypt data with salt and IV - simplified reliable approach
  encrypt(data: string): string {
    try {
      const salt = CryptoJS.lib.WordArray.random(64);
      const iv = CryptoJS.lib.WordArray.random(16);
      
      const key = CryptoJS.PBKDF2(this.encryptionKey, salt, {
        keySize: 8,
        iterations: 1000,
      });

      const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      // Store as separate base64 strings separated by ':'
      const saltStr = salt.toString(CryptoJS.enc.Base64);
      const ivStr = iv.toString(CryptoJS.enc.Base64);
      const cipherStr = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
      
      return `${saltStr}:${ivStr}:${cipherStr}`;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt data with salt and IV extraction - simplified reliable approach
  decrypt(encryptedData: string): string {
    try {
      if (!encryptedData || typeof encryptedData !== 'string') {
        throw new Error('Invalid encrypted data format');
      }
      
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data structure');
      }
      
      const [saltStr, ivStr, cipherStr] = parts;
      
      const salt = CryptoJS.enc.Base64.parse(saltStr);
      const iv = CryptoJS.enc.Base64.parse(ivStr);
      const ciphertext = CryptoJS.enc.Base64.parse(cipherStr);

      const key = CryptoJS.PBKDF2(this.encryptionKey, salt, {
        keySize: 8,
        iterations: 1000,
      });

      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext } as CryptoJS.lib.CipherParams,
        key,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        }
      );

      const result = decrypted.toString(CryptoJS.enc.Utf8);
      
      // Check for empty or invalid decryption result
      if (!result) {
        throw new Error('Decryption returned empty result');
      }
      
      return result;
    } catch (error) {
      console.error('Decryption failed:', error);
      // Clear corrupted data instead of throwing
      return '';
    }
  }

  // Secure localStorage operations
  setItem(key: string, value: string, encrypt: boolean = true): void {
    try {
      const finalValue = encrypt ? this.encrypt(value) : value;
      localStorage.setItem(`charly_${key}`, finalValue);
    } catch (error) {
      console.error(`Failed to set encrypted item ${key}:`, error);
      throw error;
    }
  }

  getItem(key: string, decrypt: boolean = true): string | null {
    try {
      const value = localStorage.getItem(`charly_${key}`);
      if (!value) return null;
      
      if (!decrypt) return value;
      
      const decrypted = this.decrypt(value);
      // If decrypt returns empty string (corrupted), treat as null
      if (!decrypted) {
        console.warn(`Corrupted encrypted data for key: ${key}, removing...`);
        localStorage.removeItem(`charly_${key}`);
        return null;
      }
      
      return decrypted;
    } catch (error) {
      console.error(`Failed to get encrypted item ${key}:`, error);
      // If decryption fails, remove the corrupted item
      localStorage.removeItem(`charly_${key}`);
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(`charly_${key}`);
  }

  // Clear all Charly-specific encrypted data
  clear(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('charly_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Session-only secure storage (not persisted)
  private sessionData = new Map<string, string>();

  setSessionItem(key: string, value: string): void {
    this.sessionData.set(key, this.encrypt(value));
  }

  getSessionItem(key: string): string | null {
    const encrypted = this.sessionData.get(key);
    return encrypted ? this.decrypt(encrypted) : null;
  }

  removeSessionItem(key: string): void {
    this.sessionData.delete(key);
  }

  clearSession(): void {
    this.sessionData.clear();
  }
}

// Global secure storage instance
export const secureStorage = SecureStorage.getInstance();

// Enhanced token manager with encryption
export class EncryptedTokenManager {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user_data';

  setTokens(accessToken: string, refreshToken: string): void {
    secureStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    secureStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  getAccessToken(): string | null {
    return secureStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return secureStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setUser(userData: object): void {
    secureStorage.setItem(this.USER_KEY, JSON.stringify(userData));
  }

  getUser(): object | null {
    const userData = secureStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  clearTokens(): void {
    secureStorage.removeItem(this.ACCESS_TOKEN_KEY);
    secureStorage.removeItem(this.REFRESH_TOKEN_KEY);
    secureStorage.removeItem(this.USER_KEY);
  }

  // Sensitive session data (cleared on browser close)
  setSensitiveData(key: string, value: string): void {
    secureStorage.setSessionItem(key, value);
  }

  getSensitiveData(key: string): string | null {
    return secureStorage.getSessionItem(key);
  }
}

// Global encrypted token manager
export const encryptedTokenManager = new EncryptedTokenManager();

// Data integrity verification
export class DataIntegrity {
  static generateHash(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  static verifyHash(data: string, expectedHash: string): boolean {
    return this.generateHash(data) === expectedHash;
  }

  static encryptWithIntegrity(data: string): string {
    const hash = this.generateHash(data);
    const combined = JSON.stringify({ data, hash });
    return secureStorage.encrypt(combined);
  }

  static decryptWithIntegrity(encryptedData: string): string | null {
    try {
      const decrypted = secureStorage.decrypt(encryptedData);
      const { data, hash } = JSON.parse(decrypted);
      
      if (this.verifyHash(data, hash)) {
        return data;
      } else {
        console.error('Data integrity check failed');
        return null;
      }
    } catch (error) {
      console.error('Integrity verification failed:', error);
      return null;
    }
  }
}

// Memory-safe operations
export class MemorySecurity {
  // Clear sensitive variables from memory
  static clearVariable(obj: Record<string, unknown>, key: string): void {
    if (obj && obj[key]) {
      obj[key] = null;
      delete obj[key];
    }
  }

  // Clear sensitive form data
  static clearForm(formElement: HTMLFormElement): void {
    const inputs = formElement.querySelectorAll('input[type="password"], input[type="text"]');
    inputs.forEach((input: Element) => {
      if (input instanceof HTMLInputElement) {
        input.value = '';
        input.setAttribute('autocomplete', 'off');
      }
    });
  }

  // Secure random string generation
  static generateSecureRandom(length: number = 32): string {
    return CryptoJS.lib.WordArray.random(length).toString();
  }
}

// Enhanced cache service with encryption
export class EncryptedCacheService {
  private static readonly CACHE_PREFIX = 'cache_';
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  static set(key: string, data: unknown, ttl: number = this.DEFAULT_TTL): void {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      ttl,
      hash: DataIntegrity.generateHash(JSON.stringify(data)),
    };

    secureStorage.setItem(
      `${this.CACHE_PREFIX}${key}`,
      JSON.stringify(cacheItem)
    );
  }

  static get<T>(key: string): T | null {
    try {
      const cached = secureStorage.getItem(`${this.CACHE_PREFIX}${key}`);
      if (!cached) return null;

      const cacheItem = JSON.parse(cached);
      const now = Date.now();

      // Check expiration
      if (now - cacheItem.timestamp > cacheItem.ttl) {
        this.remove(key);
        return null;
      }

      // Verify data integrity
      if (!DataIntegrity.verifyHash(JSON.stringify(cacheItem.data), cacheItem.hash)) {
        console.error('Cache integrity check failed for key:', key);
        this.remove(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Cache retrieval failed:', error);
      this.remove(key);
      return null;
    }
  }

  static remove(key: string): void {
    secureStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
  }

  static clear(): void {
    // Clear all cache items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`charly_${this.CACHE_PREFIX}`)) {
        localStorage.removeItem(key);
      }
    }
  }
}

// Export main interface
export { CryptoJS };
export default secureStorage;