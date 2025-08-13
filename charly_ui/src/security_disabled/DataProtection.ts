/**
 * CHARLY 2.0 - Data Protection and Encryption Manager
 * Enterprise-grade data encryption, hashing, and protection utilities
 */

interface EncryptionConfig {
  algorithm: 'AES-GCM' | 'AES-CBC' | 'AES-CTR';
  keyLength: 128 | 192 | 256;
  ivLength: number;
  tagLength?: number;
}

interface EncryptedData {
  data: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  tag?: string; // Base64 encoded authentication tag (for GCM)
  algorithm: string;
  keyId: string;
}

interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  categories: string[];
  retentionPeriod: number; // days
  encryptionRequired: boolean;
  accessRestrictions: string[];
  complianceRequirements: string[];
}

class DataProtectionManager {
  private encryptionKeys: Map<string, CryptoKey> = new Map();
  private dataClassifications: Map<string, DataClassification> = new Map();
  private saltCache: Map<string, Uint8Array> = new Map();
  private defaultConfig: EncryptionConfig = {
    algorithm: 'AES-GCM',
    keyLength: 256,
    ivLength: 12,
    tagLength: 16
  };

  constructor() {
    this.initializeDataClassifications();
  }

  // Data Classification
  private initializeDataClassifications(): void {
    const classifications: Array<[string, DataClassification]> = [
      ['user_credentials', {
        level: 'restricted',
        categories: ['authentication', 'personal'],
        retentionPeriod: 2555, // 7 years
        encryptionRequired: true,
        accessRestrictions: ['admin', 'security'],
        complianceRequirements: ['SOC2', 'GDPR']
      }],
      ['financial_data', {
        level: 'confidential',
        categories: ['financial', 'business'],
        retentionPeriod: 2555, // 7 years
        encryptionRequired: true,
        accessRestrictions: ['admin', 'finance'],
        complianceRequirements: ['SOC2', 'PCI_DSS']
      }],
      ['property_data', {
        level: 'confidential',
        categories: ['business', 'property'],
        retentionPeriod: 2555, // 7 years
        encryptionRequired: true,
        accessRestrictions: ['user', 'admin'],
        complianceRequirements: ['SOC2']
      }],
      ['user_profile', {
        level: 'internal',
        categories: ['personal', 'profile'],
        retentionPeriod: 1095, // 3 years
        encryptionRequired: true,
        accessRestrictions: ['user', 'admin'],
        complianceRequirements: ['GDPR']
      }],
      ['audit_logs', {
        level: 'internal',
        categories: ['security', 'audit'],
        retentionPeriod: 2555, // 7 years
        encryptionRequired: true,
        accessRestrictions: ['admin', 'security'],
        complianceRequirements: ['SOC2']
      }],
      ['session_data', {
        level: 'internal',
        categories: ['session', 'temporary'],
        retentionPeriod: 30, // 30 days
        encryptionRequired: true,
        accessRestrictions: ['system'],
        complianceRequirements: []
      }]
    ];

    classifications.forEach(([key, classification]) => {
      this.dataClassifications.set(key, classification);
    });
  }

  // Key Management
  public async generateEncryptionKey(keyId: string, config?: Partial<EncryptionConfig>): Promise<string> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    const key = await crypto.subtle.generateKey(
      {
        name: finalConfig.algorithm,
        length: finalConfig.keyLength
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );

    this.encryptionKeys.set(keyId, key);
    
    // Export key for storage (in production, would use secure key management)
    const exported = await crypto.subtle.exportKey('jwk', key);
    return JSON.stringify(exported);
  }

  public async importEncryptionKey(keyId: string, keyData: string, config?: Partial<EncryptionConfig>): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const keyObject = JSON.parse(keyData);
    
    const key = await crypto.subtle.importKey(
      'jwk',
      keyObject,
      {
        name: finalConfig.algorithm,
        length: finalConfig.keyLength
      },
      true,
      ['encrypt', 'decrypt']
    );

    this.encryptionKeys.set(keyId, key);
  }

  public async rotateEncryptionKey(keyId: string): Promise<string> {
    const oldKey = this.encryptionKeys.get(keyId);
    if (!oldKey) {
      throw new Error(`Key ${keyId} not found`);
    }

    // Generate new key
    const newKeyData = await this.generateEncryptionKey(`${keyId}_new`);
    
    // In production, would re-encrypt all data with new key
    console.log(`[DataProtection] Key ${keyId} rotated`);
    
    return newKeyData;
  }

  // Encryption/Decryption
  public async encryptData(data: string, keyId: string, config?: Partial<EncryptionConfig>): Promise<EncryptedData> {
    const key = this.encryptionKeys.get(keyId);
    if (!key) {
      throw new Error(`Encryption key ${keyId} not found`);
    }

    const finalConfig = { ...this.defaultConfig, ...config };
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(finalConfig.ivLength));
    
    // Encrypt data
    const encrypted = await crypto.subtle.encrypt(
      {
        name: finalConfig.algorithm,
        iv: iv,
        ...(finalConfig.tagLength && { tagLength: finalConfig.tagLength })
      },
      key,
      dataBytes
    );

    const result: EncryptedData = {
      data: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv),
      algorithm: finalConfig.algorithm,
      keyId
    };

    // For GCM mode, extract authentication tag
    if (finalConfig.algorithm === 'AES-GCM' && finalConfig.tagLength) {
      const tagStart = encrypted.byteLength - finalConfig.tagLength;
      const tag = encrypted.slice(tagStart);
      result.tag = this.arrayBufferToBase64(tag);
      result.data = this.arrayBufferToBase64(encrypted.slice(0, tagStart));
    }

    return result;
  }

  public async decryptData(encryptedData: EncryptedData): Promise<string> {
    const key = this.encryptionKeys.get(encryptedData.keyId);
    if (!key) {
      throw new Error(`Decryption key ${encryptedData.keyId} not found`);
    }

    const iv = this.base64ToArrayBuffer(encryptedData.iv);
    let dataToDecrypt = this.base64ToArrayBuffer(encryptedData.data);

    // For GCM mode, reconstruct data with tag
    if (encryptedData.algorithm === 'AES-GCM' && encryptedData.tag) {
      const tag = this.base64ToArrayBuffer(encryptedData.tag);
      const combined = new Uint8Array(dataToDecrypt.byteLength + tag.byteLength);
      combined.set(new Uint8Array(dataToDecrypt));
      combined.set(new Uint8Array(tag), dataToDecrypt.byteLength);
      dataToDecrypt = combined.buffer;
    }

    const decrypted = await crypto.subtle.decrypt(
      {
        name: encryptedData.algorithm,
        iv: iv
      },
      key,
      dataToDecrypt
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  // Hashing and Password Protection
  public async hashPassword(password: string, saltId?: string): Promise<{ hash: string; salt: string; iterations: number }> {
    const iterations = 100000; // PBKDF2 iterations
    
    let salt: Uint8Array;
    if (saltId && this.saltCache.has(saltId)) {
      salt = this.saltCache.get(saltId)!;
    } else {
      salt = crypto.getRandomValues(new Uint8Array(32));
      if (saltId) {
        this.saltCache.set(saltId, salt);
      }
    }

    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);

    const key = await crypto.subtle.importKey(
      'raw',
      passwordBytes,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const hash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: 'SHA-256'
      },
      key,
      256 // bits
    );

    return {
      hash: this.arrayBufferToBase64(hash),
      salt: this.arrayBufferToBase64(salt),
      iterations
    };
  }

  public async verifyPassword(password: string, hashedData: { hash: string; salt: string; iterations: number }): Promise<boolean> {
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);
    const salt = this.base64ToArrayBuffer(hashedData.salt);

    const key = await crypto.subtle.importKey(
      'raw',
      passwordBytes,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const hash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: hashedData.iterations,
        hash: 'SHA-256'
      },
      key,
      256 // bits
    );

    const computedHash = this.arrayBufferToBase64(hash);
    return computedHash === hashedData.hash;
  }

  // Secure Data Handling
  public async hashData(data: string, algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'): Promise<string> {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    const hash = await crypto.subtle.digest(algorithm, dataBytes);
    return this.arrayBufferToBase64(hash);
  }

  public async signData(data: string): Promise<string> {
    // In production, would use proper signing keys
    const hash = await this.hashData(data);
    return hash; // Simplified for demo
  }

  public async verifySignature(data: string, signature: string): Promise<boolean> {
    const computedHash = await this.hashData(data);
    return computedHash === signature; // Simplified for demo
  }

  // Data Masking and Anonymization
  public maskSensitiveData(data: string, type: 'email' | 'phone' | 'ssn' | 'credit_card' | 'custom', pattern?: string): string {
    switch (type) {
      case 'email':
        return data.replace(/(.{1,3}).*(@.*)/, '$1***$2');
      case 'phone':
        return data.replace(/(\d{3})(\d{3})(\d{4})/, '$1-***-$3');
      case 'ssn':
        return data.replace(/(\d{3})(\d{2})(\d{4})/, '***-**-$3');
      case 'credit_card':
        return data.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '**** **** **** $4');
      case 'custom':
        if (pattern) {
          return data.replace(new RegExp(pattern), '***');
        }
        return data.replace(/.{3,}/g, '***');
      default:
        return data;
    }
  }

  public anonymizeData(data: Record<string, unknown>): Record<string, unknown> {
    const anonymized = { ...data };
    
    // Remove or hash personally identifiable information
    const piiFields = ['email', 'phone', 'address', 'ssn', 'name', 'firstName', 'lastName'];
    
    for (const field of piiFields) {
      if (anonymized[field]) {
        anonymized[field] = this.hashData(String(anonymized[field]));
      }
    }
    
    // Replace identifiers with random values
    if (anonymized.id) {
      anonymized.id = `anon_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    return anonymized;
  }

  // Data Loss Prevention
  public scanForSensitiveData(text: string): {
    found: boolean;
    patterns: Array<{
      type: string;
      matches: string[];
      confidence: number;
    }>;
  } {
    const patterns = [
      {
        type: 'email',
        regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        confidence: 0.9
      },
      {
        type: 'phone',
        regex: /(\+?1-?)?(\(?[0-9]{3}\)?[-.\s]?){1,2}[0-9]{4}/g,
        confidence: 0.8
      },
      {
        type: 'ssn',
        regex: /\b\d{3}-?\d{2}-?\d{4}\b/g,
        confidence: 0.95
      },
      {
        type: 'credit_card',
        regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
        confidence: 0.9
      },
      {
        type: 'api_key',
        regex: /[a-zA-Z0-9]{32,}/g,
        confidence: 0.6
      }
    ];

    const results: Array<{ type: string; matches: string[]; confidence: number }> = [];
    let found = false;

    for (const pattern of patterns) {
      const matches = text.match(pattern.regex);
      if (matches && matches.length > 0) {
        found = true;
        results.push({
          type: pattern.type,
          matches: matches,
          confidence: pattern.confidence
        });
      }
    }

    return { found, patterns: results };
  }

  // Secure Storage
  public async secureStore(key: string, data: unknown, classification: string): Promise<void> {
    const dataClass = this.dataClassifications.get(classification);
    if (!dataClass) {
      throw new Error(`Unknown data classification: ${classification}`);
    }

    const serialized = JSON.stringify(data);
    
    if (dataClass.encryptionRequired) {
      const encrypted = await this.encryptData(serialized, 'default');
      localStorage.setItem(key, JSON.stringify(encrypted));
    } else {
      localStorage.setItem(key, serialized);
    }
  }

  public async secureRetrieve(key: string, classification: string): Promise<unknown> {
    const dataClass = this.dataClassifications.get(classification);
    if (!dataClass) {
      throw new Error(`Unknown data classification: ${classification}`);
    }

    const stored = localStorage.getItem(key);
    if (!stored) return null;

    if (dataClass.encryptionRequired) {
      try {
        const encrypted: EncryptedData = JSON.parse(stored);
        const decrypted = await this.decryptData(encrypted);
        return JSON.parse(decrypted);
      } catch (error) {
        console.error('[DataProtection] Failed to decrypt stored data:', error);
        return null;
      }
    } else {
      return JSON.parse(stored);
    }
  }

  // Secure Deletion
  public secureDelete(key: string): void {
    // Overwrite with random data multiple times (DoD 5220.22-M standard)
    const item = localStorage.getItem(key);
    if (item) {
      for (let i = 0; i < 3; i++) {
        const randomData = crypto.getRandomValues(new Uint8Array(item.length));
        const randomString = Array.from(randomData, byte => String.fromCharCode(byte)).join('');
        localStorage.setItem(key, randomString);
      }
    }
    localStorage.removeItem(key);
  }

  // Utility Methods
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Public API
  public getDataClassification(classification: string): DataClassification | undefined {
    return this.dataClassifications.get(classification);
  }

  public addDataClassification(key: string, classification: DataClassification): void {
    this.dataClassifications.set(key, classification);
  }

  public async initializeDefaultKey(): Promise<void> {
    if (!this.encryptionKeys.has('default')) {
      await this.generateEncryptionKey('default');
    }
  }

  public clearSensitiveMemory(): void {
    // Clear encryption keys from memory
    this.encryptionKeys.clear();
    this.saltCache.clear();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }
}

// Singleton instance
export { DataProtectionManager };
export const dataProtection = new DataProtectionManager();
export default dataProtection;