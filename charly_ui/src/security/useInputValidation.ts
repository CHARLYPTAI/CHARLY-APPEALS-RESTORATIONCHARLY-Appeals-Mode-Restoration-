/**
 * CHARLY 2.0 - React Hooks for Input Validation & Security
 * Enterprise-grade React hooks for secure input handling
 * Apple CTO Enterprise Security Standards
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { inputValidation, ValidationResult } from './InputValidation';

interface UseInputValidationOptions {
  type: 'text' | 'email' | 'url' | 'number' | 'json' | 'sql' | 'html';
  maxLength?: number;
  minLength?: number;
  allowEmpty?: boolean;
  customPattern?: RegExp;
  validateOnChange?: boolean;
  debounceMs?: number;
}

interface UseInputValidationReturn {
  value: string;
  setValue: (value: string) => void;
  isValid: boolean;
  errors: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  sanitizedValue: unknown;
  validate: () => ValidationResult;
  reset: () => void;
}

/**
 * Hook for secure input validation with real-time feedback
 */
export function useInputValidation(
  initialValue: string = '',
  options: UseInputValidationOptions
): UseInputValidationReturn {
  const [value, setValue] = useState(initialValue);
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    riskLevel: 'low'
  });

  // Debounced validation
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const validate = useCallback((): ValidationResult => {
    const result = inputValidation.validateInput(value, options.type, {
      maxLength: options.maxLength,
      minLength: options.minLength,
      allowEmpty: options.allowEmpty,
      customPattern: options.customPattern
    });

    setValidationResult(result);
    return result;
  }, [value, options]);

  // Debounced validation on value change
  useEffect(() => {
    if (options.validateOnChange) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      const timer = setTimeout(() => {
        validate();
      }, options.debounceMs || 300);

      setDebounceTimer(timer);

      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [value, validate, options.validateOnChange, options.debounceMs, debounceTimer]);

  const handleSetValue = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);

  const reset = useCallback(() => {
    setValue(initialValue);
    setValidationResult({
      isValid: true,
      errors: [],
      riskLevel: 'low'
    });
  }, [initialValue]);

  return {
    value,
    setValue: handleSetValue,
    isValid: validationResult.isValid,
    errors: validationResult.errors,
    riskLevel: validationResult.riskLevel,
    sanitizedValue: validationResult.sanitizedValue,
    validate,
    reset
  };
}

interface UseCSRFProtectionReturn {
  token: string | null;
  isValid: boolean;
  generateToken: () => string;
  validateToken: (providedToken: string) => boolean;
  getTokenHeader: () => { [key: string]: string };
}

/**
 * Hook for CSRF protection
 */
export function useCSRFProtection(sessionId: string): UseCSRFProtectionReturn {
  const [token, setToken] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  const generateToken = useCallback(() => {
    const newToken = inputValidation.generateCSRFToken(sessionId);
    setToken(newToken);
    setIsValid(true);
    return newToken;
  }, [sessionId]);

  const validateToken = useCallback((providedToken: string) => {
    const valid = inputValidation.validateCSRFToken(sessionId, providedToken);
    setIsValid(valid);
    return valid;
  }, [sessionId]);

  const getTokenHeader = useCallback(() => {
    return token ? { 'X-CSRF-Token': token } : {};
  }, [token]);

  // Generate initial token
  useEffect(() => {
    generateToken();
  }, [generateToken]);

  // Clean up expired tokens periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      inputValidation.cleanExpiredCSRFTokens();
    }, 60000); // Every minute

    return () => clearInterval(cleanup);
  }, []);

  return {
    token,
    isValid,
    generateToken,
    validateToken,
    getTokenHeader
  };
}

interface UseSecureFormOptions {
  validateOnSubmit?: boolean;
  validateOnChange?: boolean;
  csrfProtection?: boolean;
  maxSubmissionRate?: number; // submissions per minute
}

interface UseSecureFormReturn {
  values: { [key: string]: unknown };
  errors: { [key: string]: string[] };
  isValid: boolean;
  isSubmitting: boolean;
  csrfToken: string | null;
  setValue: (field: string, value: unknown) => void;
  setFieldValidation: (field: string, options: UseInputValidationOptions) => void;
  validateField: (field: string) => boolean;
  validateForm: () => boolean;
  handleSubmit: (onSubmit: (values: Record<string, unknown>, csrfToken?: string) => Promise<void>) => Promise<void>;
  reset: () => void;
}

/**
 * Hook for comprehensive secure form handling
 */
export function useSecureForm(
  initialValues: { [key: string]: unknown } = {},
  options: UseSecureFormOptions = {}
): UseSecureFormReturn {
  const sessionId = useMemo(() => `session_${Date.now()}_${Math.random()}`, []);
  
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<{ [key: string]: string[] }>({});
  const [fieldValidations, setFieldValidations] = useState<{ [key: string]: UseInputValidationOptions }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setSubmissionCount] = useState(0); // Submission count for future use
  const [lastSubmission, setLastSubmission] = useState(0);

  const { token: csrfToken, generateToken: generateCSRFToken } = useCSRFProtection(sessionId);

  const setValue = useCallback((field: string, value: unknown) => {
    setValues(prev => ({ ...prev, [field]: value }));

    // Validate on change if enabled
    if (options.validateOnChange && fieldValidations[field]) {
      setTimeout(() => validateField(field), 100);
    }
  }, [options.validateOnChange, fieldValidations, validateField]);

  const setFieldValidation = useCallback((field: string, validationOptions: UseInputValidationOptions) => {
    setFieldValidations(prev => ({ ...prev, [field]: validationOptions }));
  }, []);

  const validateField = useCallback((field: string): boolean => {
    const validation = fieldValidations[field];
    if (!validation) return true;

    const result = inputValidation.validateInput(values[field], validation.type, {
      maxLength: validation.maxLength,
      minLength: validation.minLength,
      allowEmpty: validation.allowEmpty,
      customPattern: validation.customPattern
    });

    setErrors(prev => ({
      ...prev,
      [field]: result.isValid ? [] : result.errors
    }));

    return result.isValid;
  }, [values, fieldValidations]);

  const validateForm = useCallback((): boolean => {
    let isFormValid = true;
    const newErrors: { [key: string]: string[] } = {};

    for (const field of Object.keys(fieldValidations)) {
      const validation = fieldValidations[field];
      const result = inputValidation.validateInput(values[field], validation.type, {
        maxLength: validation.maxLength,
        minLength: validation.minLength,
        allowEmpty: validation.allowEmpty,
        customPattern: validation.customPattern
      });

      if (!result.isValid) {
        isFormValid = false;
        newErrors[field] = result.errors;
      }
    }

    setErrors(newErrors);
    return isFormValid;
  }, [values, fieldValidations]);

  const handleSubmit = useCallback(async (
    onSubmit: (values: Record<string, unknown>, csrfToken?: string) => Promise<void>
  ): Promise<void> => {
    // Rate limiting check
    const now = Date.now();
    if (options.maxSubmissionRate) {
      const timeWindow = 60000; // 1 minute
      if (now - lastSubmission < timeWindow / options.maxSubmissionRate) {
        throw new Error('Submission rate limit exceeded');
      }
    }

    setIsSubmitting(true);

    try {
      // Validate form if required
      if (options.validateOnSubmit && !validateForm()) {
        throw new Error('Form validation failed');
      }

      // Check rate limiting
      if (inputValidation.isRateLimited(sessionId, options.maxSubmissionRate || 10)) {
        throw new Error('Too many submission attempts');
      }

      // Execute submission
      await onSubmit(values, options.csrfProtection ? csrfToken || undefined : undefined);

      setSubmissionCount(prev => prev + 1);
      setLastSubmission(now);

      // Generate new CSRF token after successful submission
      if (options.csrfProtection) {
        generateCSRFToken();
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    values,
    csrfToken,
    options.validateOnSubmit,
    options.csrfProtection,
    options.maxSubmissionRate,
    validateForm,
    generateCSRFToken,
    sessionId,
    lastSubmission
  ]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setSubmissionCount(0);
    setLastSubmission(0);
  }, [initialValues]);

  const isValid = useMemo(() => {
    return Object.values(errors).every(fieldErrors => fieldErrors.length === 0);
  }, [errors]);

  return {
    values,
    errors,
    isValid,
    isSubmitting,
    csrfToken,
    setValue,
    setFieldValidation,
    validateField,
    validateForm,
    handleSubmit,
    reset
  };
}

interface UseFileUploadSecurityOptions {
  allowedTypes?: string[];
  maxSize?: number;
  allowedExtensions?: string[];
  maxFiles?: number;
}

interface UseFileUploadSecurityReturn {
  validateFiles: (files: FileList | File[]) => { valid: File[]; invalid: { file: File; errors: string[] }[] };
  uploadFiles: (files: File[], endpoint: string, csrfToken?: string) => Promise<Response>;
  isUploading: boolean;
  uploadProgress: number;
}

/**
 * Hook for secure file upload handling
 */
export function useFileUploadSecurity(
  options: UseFileUploadSecurityOptions = {}
): UseFileUploadSecurityReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const validateFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const valid: File[] = [];
    const invalid: { file: File; errors: string[] }[] = [];

    // Check max files limit
    if (options.maxFiles && fileArray.length > options.maxFiles) {
      return {
        valid: [],
        invalid: fileArray.map(file => ({
          file,
          errors: [`Maximum ${options.maxFiles} files allowed`]
        }))
      };
    }

    for (const file of fileArray) {
      const result = inputValidation.validateFileUpload(file, {
        allowedTypes: options.allowedTypes,
        maxSize: options.maxSize,
        allowedExtensions: options.allowedExtensions
      });

      if (result.isValid) {
        valid.push(file);
      } else {
        invalid.push({
          file,
          errors: result.errors
        });
      }
    }

    return { valid, invalid };
  }, [options]);

  const uploadFiles = useCallback(async (
    files: File[],
    endpoint: string,
    csrfToken?: string
  ): Promise<Response> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      const headers: { [key: string]: string } = {};
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      setUploadProgress(100);
      return await response.json();
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, []);

  return {
    validateFiles,
    uploadFiles,
    isUploading,
    uploadProgress
  };
}

// Export utility functions for direct use
export const securityUtils = {
  sanitizeText: (text: string) => inputValidation.sanitizeText(text),
  sanitizeHTML: (html: string) => inputValidation.sanitizeHTML(html),
  validateInput: (input: unknown, type: string, options?: Record<string, unknown>) => inputValidation.validateInput(input, type, options)
};