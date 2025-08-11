export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

const DEFAULT_OPTIONS: Required<FileValidationOptions> = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'application/pdf',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/plain'
  ],
  allowedExtensions: ['.pdf', '.csv', '.xlsx', '.xls', '.txt']
};

export const validateFile = (
  file: File, 
  options: FileValidationOptions = {}
): FileValidationResult => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // File size validation
  if (file.size > opts.maxSizeBytes) {
    const maxSizeMB = Math.round(opts.maxSizeBytes / (1024 * 1024));
    return { 
      valid: false, 
      error: `File size must be under ${maxSizeMB}MB. Current file is ${Math.round(file.size / (1024 * 1024))}MB.` 
    };
  }

  // MIME type validation
  if (!opts.allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed types: PDF, CSV, Excel files. Received: ${file.type || 'unknown'}` 
    };
  }

  // File extension validation (additional security layer)
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!opts.allowedExtensions.includes(fileExtension)) {
    return { 
      valid: false, 
      error: `Invalid file extension. Allowed extensions: ${opts.allowedExtensions.join(', ')}. Received: ${fileExtension}` 
    };
  }

  // Suspicious file name patterns
  const suspiciousPatterns = [
    /\.(exe|bat|cmd|scr|com|pif)$/i,
    /\.(js|vbs|jar|app)$/i,
    /\.php$/i,
    /\.\w+\.(exe|bat|cmd)$/i // Double extensions
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    return { 
      valid: false, 
      error: 'File name contains suspicious patterns and cannot be uploaded.' 
    };
  }

  // File name length validation
  if (file.name.length > 255) {
    return { 
      valid: false, 
      error: 'File name is too long. Maximum 255 characters allowed.' 
    };
  }

  // Empty file validation
  if (file.size === 0) {
    return { 
      valid: false, 
      error: 'Empty files cannot be uploaded.' 
    };
  }

  return { valid: true };
};

export const validateFileList = (
  files: FileList | File[], 
  options: FileValidationOptions = {}
): { valid: boolean; results: FileValidationResult[]; errors: string[] } => {
  const fileArray = Array.from(files);
  const results = fileArray.map(file => validateFile(file, options));
  const errors = results.filter(r => !r.valid).map(r => r.error!);
  
  return {
    valid: results.every(r => r.valid),
    results,
    errors
  };
};

// Utility function for displaying validation errors
export const formatValidationErrors = (errors: string[]): string => {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  
  return `Multiple validation errors:\n${errors.map((error, index) => `${index + 1}. ${error}`).join('\n')}`;
};

// Legacy function for backward compatibility
export const MAX_FILE_SIZE_MB = 10;
export function validateFile_legacy(file: File): string | null {
  const result = validateFile(file);
  return result.valid ? null : result.error || 'Validation failed';
}