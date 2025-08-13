/**
 * CHARLY 2.0 - Secure React Components
 * Enterprise-grade secure form components with built-in validation
 * Apple CTO Enterprise Security Standards
 */

import React, { forwardRef, ReactNode, useState } from 'react';
import { Eye, EyeOff, AlertTriangle, CheckCircle, Shield, Upload, X } from 'lucide-react';
import { useInputValidation, useSecureForm, useFileUploadSecurity, securityUtils } from '../security/useInputValidation';

// Base input props interface
interface BaseInputProps {
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  helpText?: string;
  'data-testid'?: string;
}

// Secure text input component
interface SecureTextInputProps extends BaseInputProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'url';
  maxLength?: number;
  minLength?: number;
  pattern?: RegExp;
  validateOnChange?: boolean;
  showSecurityIndicator?: boolean;
}

export const SecureTextInput = forwardRef<HTMLInputElement, SecureTextInputProps>(({
  label,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  helpText,
  value,
  onChange,
  type = 'text',
  maxLength,
  minLength,
  pattern,
  validateOnChange = true,
  showSecurityIndicator = true,
  'data-testid': testId,
  ...props
}, ref) => {
  const {
    value: inputValue,
    setValue,
    isValid,
    errors,
    riskLevel,
    sanitizedValue
  } = useInputValidation(value, {
    type,
    maxLength,
    minLength,
    customPattern: pattern,
    validateOnChange,
    debounceMs: 300
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange(sanitizedValue || newValue);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-600 border-red-500';
      case 'high': return 'text-orange-600 border-orange-500';
      case 'medium': return 'text-yellow-600 border-yellow-500';
      case 'low': return 'text-green-600 border-green-500';
      default: return 'text-gray-600 border-gray-300';
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={ref}
          type={type}
          value={inputValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          className={`
            block w-full px-3 py-2 border rounded-md shadow-sm 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${!isValid ? 'border-red-500' : 'border-gray-300'}
            ${className}
          `}
          data-testid={testId}
          {...props}
        />
        
        {showSecurityIndicator && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isValid ? (
              <CheckCircle size={16} className="text-green-500" />
            ) : (
              <AlertTriangle size={16} className={getRiskColor(riskLevel).split(' ')[0]} />
            )}
          </div>
        )}
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <p key={index} className={`text-sm ${getRiskColor(riskLevel).split(' ')[0]}`}>
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Help text */}
      {helpText && !errors.length && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}

      {/* Security indicator */}
      {showSecurityIndicator && (
        <div className="flex items-center space-x-2 text-xs">
          <Shield size={12} className={getRiskColor(riskLevel).split(' ')[0]} />
          <span className={getRiskColor(riskLevel).split(' ')[0]}>
            Security Level: {riskLevel.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
});

SecureTextInput.displayName = 'SecureTextInput';

// Secure password input with strength indicator
interface SecurePasswordInputProps extends BaseInputProps {
  value: string;
  onChange: (value: string) => void;
  showStrengthIndicator?: boolean;
  confirmPassword?: boolean;
}

export const SecurePasswordInput = forwardRef<HTMLInputElement, SecurePasswordInputProps>(({
  label = 'Password',
  placeholder = 'Enter password',
  required = false,
  disabled = false,
  className = '',
  helpText,
  value,
  onChange,
  showStrengthIndicator = true,
  confirmPassword = false,
  'data-testid': testId,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    value: inputValue,
    setValue,
    isValid,
    errors
  } = useInputValidation(value, {
    type: 'text',
    minLength: 8,
    validateOnChange: true,
    customPattern: confirmPassword ? undefined : /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange(newValue);
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;
    return strength;
  };

  const strength = getPasswordStrength(inputValue);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          value={inputValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            block w-full px-3 py-2 pr-10 border rounded-md shadow-sm 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${!isValid ? 'border-red-500' : 'border-gray-300'}
            ${className}
          `}
          data-testid={testId}
          {...props}
        />
        
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* Password strength indicator */}
      {showStrengthIndicator && !confirmPassword && inputValue.length > 0 && (
        <div className="space-y-2">
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={`h-2 flex-1 rounded ${
                  level <= strength ? strengthColors[strength - 1] : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600">
            Strength: {strengthLabels[strength - 1] || 'Very Weak'}
          </p>
        </div>
      )}

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Help text */}
      {helpText && !errors.length && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
});

SecurePasswordInput.displayName = 'SecurePasswordInput';

// Secure textarea component
interface SecureTextAreaProps extends BaseInputProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  maxLength?: number;
  allowHTML?: boolean;
}

export const SecureTextArea = forwardRef<HTMLTextAreaElement, SecureTextAreaProps>(({
  label,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  helpText,
  value,
  onChange,
  rows = 4,
  maxLength,
  allowHTML = false,
  'data-testid': testId,
  ...props
}, ref) => {
  const {
    value: inputValue,
    setValue,
    isValid,
    errors,
    sanitizedValue
  } = useInputValidation(value, {
    type: allowHTML ? 'html' : 'text',
    maxLength,
    validateOnChange: true
  });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange(sanitizedValue || newValue);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        maxLength={maxLength}
        className={`
          block w-full px-3 py-2 border rounded-md shadow-sm 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${!isValid ? 'border-red-500' : 'border-gray-300'}
          ${className}
        `}
        data-testid={testId}
        {...props}
      />

      {/* Character count */}
      {maxLength && (
        <div className="flex justify-between text-sm text-gray-500">
          <span>{inputValue.length} / {maxLength} characters</span>
          {allowHTML && <span>HTML content will be sanitized</span>}
        </div>
      )}

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Help text */}
      {helpText && !errors.length && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
});

SecureTextArea.displayName = 'SecureTextArea';

// Secure file upload component
interface SecureFileUploadProps extends BaseInputProps {
  onFilesChange: (files: File[]) => void;
  allowedTypes?: string[];
  allowedExtensions?: string[];
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  dragAndDrop?: boolean;
}

export const SecureFileUpload: React.FC<SecureFileUploadProps> = ({
  label,
  required = false,
  disabled = false,
  className = '',
  helpText,
  onFilesChange,
  allowedTypes,
  allowedExtensions,
  maxSize,
  maxFiles = 1,
  multiple = false,
  dragAndDrop = true,
  'data-testid': testId
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { validateFiles } = useFileUploadSecurity({
    allowedTypes,
    allowedExtensions,
    maxSize,
    maxFiles
  });

  const handleFileSelection = (files: FileList | File[]) => {
    const { valid, invalid } = validateFiles(files);
    
    setSelectedFiles(valid);
    onFilesChange(valid);

    if (invalid.length > 0) {
      console.warn('Invalid files:', invalid);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelection(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFileSelection(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesChange(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {dragAndDrop ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${disabled ? 'cursor-not-allowed opacity-50' : ''}
            ${className}
          `}
        >
          <Upload size={32} className="mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop files here, or click to select
          </p>
          <input
            type="file"
            onChange={handleFileChange}
            multiple={multiple}
            accept={allowedTypes?.join(',')}
            disabled={disabled}
            className="hidden"
            data-testid={testId}
            id={`file-upload-${Math.random()}`}
          />
          <label
            htmlFor={`file-upload-${Math.random()}`}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 cursor-pointer"
          >
            Select Files
          </label>
        </div>
      ) : (
        <input
          type="file"
          onChange={handleFileChange}
          multiple={multiple}
          accept={allowedTypes?.join(',')}
          disabled={disabled}
          className={`
            block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0 file:text-sm file:font-medium
            file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100
            ${className}
          `}
          data-testid={testId}
        />
      )}

      {/* Selected files list */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                </p>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="ml-2 p-1 text-red-500 hover:text-red-700"
                title="Remove file"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Help text and constraints */}
      <div className="text-xs text-gray-500 space-y-1">
        {helpText && <p>{helpText}</p>}
        {allowedTypes && (
          <p>Allowed types: {allowedTypes.join(', ')}</p>
        )}
        {allowedExtensions && (
          <p>Allowed extensions: {allowedExtensions.join(', ')}</p>
        )}
        {maxSize && (
          <p>Maximum file size: {formatFileSize(maxSize)}</p>
        )}
        {maxFiles > 1 && (
          <p>Maximum {maxFiles} files allowed</p>
        )}
      </div>
    </div>
  );
};

// Secure form wrapper component
interface SecureFormProps {
  children: ReactNode;
  onSubmit: (values: Record<string, unknown>, csrfToken?: string) => Promise<void>;
  initialValues?: Record<string, unknown>;
  validateOnSubmit?: boolean;
  csrfProtection?: boolean;
  className?: string;
  'data-testid'?: string;
}

export const SecureForm: React.FC<SecureFormProps> = ({
  children,
  onSubmit,
  initialValues = {},
  validateOnSubmit = true,
  csrfProtection = true,
  className = '',
  'data-testid': testId
}) => {
  const {
    handleSubmit,
    isSubmitting,
    csrfToken
  } = useSecureForm(initialValues, {
    validateOnSubmit,
    csrfProtection,
    maxSubmissionRate: 10 // 10 submissions per minute
  });

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit(onSubmit);
  };

  return (
    <form 
      onSubmit={onFormSubmit} 
      className={className}
      data-testid={testId}
    >
      {csrfProtection && csrfToken && (
        <input type="hidden" name="csrf_token" value={csrfToken} />
      )}
      
      {children}
      
      {isSubmitting && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Submitting...</span>
          </div>
        </div>
      )}
    </form>
  );
};

// Secure HTML renderer component
interface SecureHTMLRendererProps {
  html: string;
  className?: string;
  maxLength?: number;
}

export const SecureHTMLRenderer: React.FC<SecureHTMLRendererProps> = ({
  html,
  className = '',
  maxLength
}) => {
  const sanitizedHTML = securityUtils.sanitizeHTML(maxLength ? html.slice(0, maxLength) : html);

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
};