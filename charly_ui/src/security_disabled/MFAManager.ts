/**
 * CHARLY 2.0 - Multi-Factor Authentication Manager
 * Enterprise-grade MFA with TOTP, SMS, Email, and Hardware Key support
 */

interface MFAMethod {
  id: string;
  type: 'totp' | 'sms' | 'email' | 'webauthn' | 'backup_codes';
  name: string;
  isActive: boolean;
  isPrimary: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  lastUsed?: Date;
}

interface TOTPSetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  recoveryUrl: string;
}

interface MFAChallenge {
  challengeId: string;
  type: 'totp' | 'sms' | 'email' | 'webauthn';
  expiresAt: Date;
  attemptsRemaining: number;
  metadata: Record<string, unknown>;
}

interface MFAVerificationResult {
  success: boolean;
  methodUsed: string;
  tokensIssued?: boolean;
  backupCodeUsed?: boolean;
  attemptsRemaining?: number;
  cooldownUntil?: Date;
}

// WebAuthn credential interface for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _WebAuthnCredential {
  id: string;
  publicKey: string;
  counter: number;
  deviceName: string;
  createdAt: Date;
  lastUsed?: Date;
  aaguid: string; // Authenticator AAGUID
}

interface MFAPolicy {
  required: boolean;
  allowedMethods: string[];
  challengeTimeout: number; // seconds
  maxAttempts: number;
  cooldownDuration: number; // seconds
  requireForSensitiveActions: boolean;
  graceperiodDuration: number; // seconds for new users
}

class MFAManager {
  private readonly API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  private activeMethods: MFAMethod[] = [];
  private activeChallenge: MFAChallenge | null = null;
  private policy: MFAPolicy;
  private eventListeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();

  constructor() {
    this.policy = {
      required: true,
      allowedMethods: ['totp', 'sms', 'email', 'webauthn', 'backup_codes'],
      challengeTimeout: 300, // 5 minutes
      maxAttempts: 3,
      cooldownDuration: 900, // 15 minutes
      requireForSensitiveActions: true,
      graceperiodDuration: 86400 // 24 hours
    };
    
    this.loadUserMFAMethods();
  }

  // TOTP (Time-based One-Time Password) Methods
  public async setupTOTP(userEmail: string): Promise<TOTPSetupData> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/mfa/totp/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
        body: JSON.stringify({ email: userEmail })
      });

      if (!response.ok) {
        throw new Error('Failed to setup TOTP');
      }

      const data = await response.json();
      return {
        secret: data.secret,
        qrCode: data.qrCode,
        backupCodes: data.backupCodes,
        recoveryUrl: data.recoveryUrl
      };
    } catch (error) {
      console.error('[MFA] TOTP setup failed:', error);
      throw error;
    }
  }

  public async verifyTOTPSetup(token: string, secret: string): Promise<{ success: boolean; backupCodes: string[] }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/mfa/totp/verify-setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
        body: JSON.stringify({ token, secret })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        await this.loadUserMFAMethods(); // Refresh methods
        this.emit('methodAdded', { type: 'totp' });
      }

      return result;
    } catch (error) {
      console.error('[MFA] TOTP verification failed:', error);
      throw error;
    }
  }

  public async generateBackupCodes(): Promise<string[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/mfa/backup-codes/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate backup codes');
      }

      const data = await response.json();
      return data.codes;
    } catch (error) {
      console.error('[MFA] Backup code generation failed:', error);
      throw error;
    }
  }

  // SMS MFA Methods
  public async setupSMS(phoneNumber: string): Promise<{ challengeId: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/mfa/sms/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
        body: JSON.stringify({ phoneNumber })
      });

      if (!response.ok) {
        throw new Error('Failed to setup SMS MFA');
      }

      return await response.json();
    } catch (error) {
      console.error('[MFA] SMS setup failed:', error);
      throw error;
    }
  }

  public async sendSMSChallenge(phoneNumber?: string): Promise<{ challengeId: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/mfa/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
        body: JSON.stringify({ phoneNumber })
      });

      if (!response.ok) {
        throw new Error('Failed to send SMS challenge');
      }

      const result = await response.json();
      this.activeChallenge = {
        challengeId: result.challengeId,
        type: 'sms',
        expiresAt: new Date(Date.now() + this.policy.challengeTimeout * 1000),
        attemptsRemaining: this.policy.maxAttempts,
        metadata: { phoneNumber }
      };

      return result;
    } catch (error) {
      console.error('[MFA] SMS challenge failed:', error);
      throw error;
    }
  }

  // Email MFA Methods
  public async sendEmailChallenge(email?: string): Promise<{ challengeId: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/mfa/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error('Failed to send email challenge');
      }

      const result = await response.json();
      this.activeChallenge = {
        challengeId: result.challengeId,
        type: 'email',
        expiresAt: new Date(Date.now() + this.policy.challengeTimeout * 1000),
        attemptsRemaining: this.policy.maxAttempts,
        metadata: { email }
      };

      return result;
    } catch (error) {
      console.error('[MFA] Email challenge failed:', error);
      throw error;
    }
  }

  // WebAuthn (Hardware Key / Biometric) Methods
  public async setupWebAuthn(deviceName: string): Promise<{ challenge: string; options: unknown }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/mfa/webauthn/setup/begin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
        body: JSON.stringify({ deviceName })
      });

      if (!response.ok) {
        throw new Error('Failed to initiate WebAuthn setup');
      }

      const data = await response.json();
      
      // Convert challenge and other binary data from base64
      const options = {
        ...data.options,
        challenge: this.base64ToArrayBuffer(data.options.challenge),
        user: {
          ...data.options.user,
          id: this.base64ToArrayBuffer(data.options.user.id)
        }
      };

      return { challenge: data.challenge, options };
    } catch (error) {
      console.error('[MFA] WebAuthn setup initiation failed:', error);
      throw error;
    }
  }

  public async completeWebAuthnSetup(credential: PublicKeyCredential, challenge: string): Promise<{ success: boolean }> {
    try {
      const credentialData = {
        id: credential.id,
        rawId: this.arrayBufferToBase64(credential.rawId),
        type: credential.type,
        response: {
          attestationObject: this.arrayBufferToBase64((credential.response as AuthenticatorAttestationResponse).attestationObject),
          clientDataJSON: this.arrayBufferToBase64(credential.response.clientDataJSON)
        }
      };

      const response = await fetch(`${this.API_BASE_URL}/auth/mfa/webauthn/setup/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
        body: JSON.stringify({ credential: credentialData, challenge })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        await this.loadUserMFAMethods();
        this.emit('methodAdded', { type: 'webauthn' });
      }

      return result;
    } catch (error) {
      console.error('[MFA] WebAuthn setup completion failed:', error);
      throw error;
    }
  }

  public async initiateWebAuthnChallenge(): Promise<{ challengeId: string; options: unknown }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/mfa/webauthn/challenge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to initiate WebAuthn challenge');
      }

      const data = await response.json();
      
      const options = {
        ...data.options,
        challenge: this.base64ToArrayBuffer(data.options.challenge),
        allowCredentials: data.options.allowCredentials.map((cred: Record<string, unknown>) => ({
          ...cred,
          id: this.base64ToArrayBuffer(cred.id)
        }))
      };

      this.activeChallenge = {
        challengeId: data.challengeId,
        type: 'webauthn',
        expiresAt: new Date(Date.now() + this.policy.challengeTimeout * 1000),
        attemptsRemaining: this.policy.maxAttempts,
        metadata: { options }
      };

      return { challengeId: data.challengeId, options };
    } catch (error) {
      console.error('[MFA] WebAuthn challenge initiation failed:', error);
      throw error;
    }
  }

  // Challenge Verification
  public async verifyChallenge(challengeId: string, response: string | PublicKeyCredential): Promise<MFAVerificationResult> {
    try {
      const requestBody: Record<string, unknown> = { challengeId };
      
      if (this.activeChallenge?.type === 'webauthn' && response instanceof PublicKeyCredential) {
        requestBody.credential = {
          id: response.id,
          rawId: this.arrayBufferToBase64(response.rawId),
          type: response.type,
          response: {
            authenticatorData: this.arrayBufferToBase64((response.response as AuthenticatorAssertionResponse).authenticatorData),
            clientDataJSON: this.arrayBufferToBase64(response.response.clientDataJSON),
            signature: this.arrayBufferToBase64((response.response as AuthenticatorAssertionResponse).signature),
            userHandle: (response.response as AuthenticatorAssertionResponse).userHandle ? 
              this.arrayBufferToBase64((response.response as AuthenticatorAssertionResponse).userHandle!) : null
          }
        };
      } else {
        requestBody.code = response;
      }

      const apiResponse = await fetch(`${this.API_BASE_URL}/auth/mfa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
        body: JSON.stringify(requestBody)
      });

      const result = await apiResponse.json();

      if (apiResponse.ok) {
        this.activeChallenge = null;
        
        if (result.success) {
          this.emit('challengeVerified', {
            method: result.methodUsed,
            backupCodeUsed: result.backupCodeUsed
          });
        }
      } else {
        if (this.activeChallenge) {
          this.activeChallenge.attemptsRemaining = result.attemptsRemaining || 0;
          
          if (this.activeChallenge.attemptsRemaining <= 0) {
            this.activeChallenge = null;
            this.emit('challengeFailed', { reason: 'max_attempts_exceeded' });
          }
        }
      }

      return result;
    } catch (error) {
      console.error('[MFA] Challenge verification failed:', error);
      throw error;
    }
  }

  // Method Management
  public async removeMFAMethod(methodId: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/mfa/methods/${methodId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`
        }
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        await this.loadUserMFAMethods();
        this.emit('methodRemoved', { methodId });
      }

      return result;
    } catch (error) {
      console.error('[MFA] Method removal failed:', error);
      throw error;
    }
  }

  public async setPrimaryMethod(methodId: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/mfa/methods/${methodId}/primary`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`
        }
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        await this.loadUserMFAMethods();
        this.emit('primaryMethodChanged', { methodId });
      }

      return result;
    } catch (error) {
      console.error('[MFA] Primary method update failed:', error);
      throw error;
    }
  }

  // Policy and Status Methods
  public isMFARequired(): boolean {
    return this.policy.required;
  }

  public isMFASetup(): boolean {
    return this.activeMethods.some(method => method.isActive);
  }

  public getAvailableMethods(): string[] {
    return this.policy.allowedMethods;
  }

  public getActiveMethods(): MFAMethod[] {
    return [...this.activeMethods];
  }

  public getPrimaryMethod(): MFAMethod | null {
    return this.activeMethods.find(method => method.isPrimary) || null;
  }

  public getActiveChallenge(): MFAChallenge | null {
    if (this.activeChallenge && this.activeChallenge.expiresAt < new Date()) {
      this.activeChallenge = null;
    }
    return this.activeChallenge;
  }

  public async requireMFAForAction(action: string): Promise<boolean> {
    if (!this.policy.requireForSensitiveActions) {
      return false;
    }

    const sensitiveActions = [
      'change_password',
      'update_mfa',
      'delete_account',
      'export_data',
      'admin_action'
    ];

    return sensitiveActions.includes(action);
  }

  // Utility Methods
  private async loadUserMFAMethods(): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/mfa/methods`, {
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.activeMethods = data.methods || [];
      }
    } catch (error) {
      console.error('[MFA] Failed to load user MFA methods:', error);
    }
  }

  private getAccessToken(): string {
    // This should integrate with your AuthenticationManager
    const tokens = localStorage.getItem('charly_auth_tokens');
    if (tokens) {
      const parsed = JSON.parse(tokens);
      return parsed.accessToken;
    }
    throw new Error('No access token available');
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const length = binaryString.length;
    const bytes = new Uint8Array(length);
    
    for (let i = 0; i < length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes.buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return btoa(binary);
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
        } catch (error) {
          console.error('[MFA] Event listener error:', error);
        }
      });
    }
  }

  // Public Event Methods
  public onMethodAdded(callback: (data: { type: string }) => void): () => void {
    this.addEventListener('methodAdded', callback);
    return () => this.removeEventListener('methodAdded', callback);
  }

  public onMethodRemoved(callback: (data: { methodId: string }) => void): () => void {
    this.addEventListener('methodRemoved', callback);
    return () => this.removeEventListener('methodRemoved', callback);
  }

  public onChallengeVerified(callback: (data: { method: string; backupCodeUsed?: boolean }) => void): () => void {
    this.addEventListener('challengeVerified', callback);
    return () => this.removeEventListener('challengeVerified', callback);
  }

  public onChallengeFailed(callback: (data: { reason: string }) => void): () => void {
    this.addEventListener('challengeFailed', callback);
    return () => this.removeEventListener('challengeFailed', callback);
  }

  public onPrimaryMethodChanged(callback: (data: { methodId: string }) => void): () => void {
    this.addEventListener('primaryMethodChanged', callback);
    return () => this.removeEventListener('primaryMethodChanged', callback);
  }
}

// Singleton instance
export { MFAManager };
export const mfaManager = new MFAManager();
export default mfaManager;