// 🍎 Document Upload Component - Apple Quality File Handling
// "Simplicity is the ultimate sophistication" - Steve Jobs

import React, { useState, useRef } from 'react';
import { APPLE_COLORS, NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';
import { LoadingDots } from './LoadingDots';

interface DocumentUploadProps {
  propertyId: string;
  onUploadComplete?: (uploadedData: any) => void;
  onUploadError?: (error: string) => void;
  acceptedTypes?: string[];
  maxFileSize?: number;
}

interface UploadedDocument {
  id: string;
  fileName: string;
  documentType: string;
  uploadDate: string;
  financialSummary?: any;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  propertyId,
  onUploadComplete,
  onUploadError,
  acceptedTypes = ['.pdf'],
  maxFileSize = 10 * 1024 * 1024 // 10MB default
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      onUploadError?.(`Invalid file type. Please upload ${acceptedTypes.join(', ')} files only.`);
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      onUploadError?.(`File too large. Maximum size is ${Math.round(maxFileSize / 1024 / 1024)}MB.`);
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('property_id', propertyId);
      formData.append('document_type', 'auto');

      const response = await fetch('http://localhost:8001/api/upload/property-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Upload failed: ${errorData}`);
      }

      const result = await response.json();
      
      // Add to uploaded docs list
      const newDoc: UploadedDocument = {
        id: result.property_id + '_' + Date.now(),
        fileName: result.file_name,
        documentType: result.document_type,
        uploadDate: result.upload_date,
        financialSummary: result.financial_summary
      };

      setUploadedDocs(prev => [...prev, newDoc]);
      onUploadComplete?.(result);

    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const formatDocumentType = (type: string) => {
    switch (type) {
      case 'income_statement': return 'Income Statement';
      case 'rent_roll': return 'Rent Roll';
      case 'comparable_sales': return 'Comparable Sales';
      default: return 'Unknown Document';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Document Upload</h3>
      <p style={styles.subtitle}>
        Upload income statements, rent rolls, and other property documents for automated parsing
      </p>

      {/* Upload Area */}
      <div
        style={{
          ...styles.uploadArea,
          ...(dragActive ? styles.uploadAreaActive : {}),
          ...(uploading ? styles.uploadAreaUploading : {})
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          style={styles.hiddenInput}
        />

        {uploading ? (
          <div style={styles.uploadingState}>
            <LoadingDots size="lg" />
            <p style={styles.uploadingText}>Processing document...</p>
          </div>
        ) : (
          <div style={styles.uploadPrompt}>
            <div style={styles.uploadIcon}>📄</div>
            <h4 style={styles.uploadTitle}>
              {dragActive ? 'Drop your document here' : 'Upload Property Documents'}
            </h4>
            <p style={styles.uploadText}>
              Drag and drop PDF files here, or click to browse
            </p>
            <p style={styles.uploadHint}>
              Supported: {acceptedTypes.join(', ')} • Max {Math.round(maxFileSize / 1024 / 1024)}MB
            </p>
          </div>
        )}
      </div>

      {/* Uploaded Documents List */}
      {uploadedDocs.length > 0 && (
        <div style={styles.uploadedSection}>
          <h4 style={styles.uploadedTitle}>Uploaded Documents</h4>
          <div style={styles.documentsList}>
            {uploadedDocs.map((doc) => (
              <div key={doc.id} style={styles.documentCard}>
                <div style={styles.documentIcon}>📄</div>
                <div style={styles.documentInfo}>
                  <h5 style={styles.documentName}>{doc.fileName}</h5>
                  <p style={styles.documentType}>{formatDocumentType(doc.documentType)}</p>
                  {doc.financialSummary && (
                    <div style={styles.financialSummary}>
                      {doc.documentType === 'income_statement' && (
                        <>
                          <span style={styles.summaryItem}>
                            NOI: ${doc.financialSummary.net_operating_income?.toLocaleString() || 'N/A'}
                          </span>
                          <span style={styles.summaryItem}>
                            Income: ${doc.financialSummary.gross_income?.toLocaleString() || 'N/A'}
                          </span>
                        </>
                      )}
                      {doc.documentType === 'rent_roll' && (
                        <>
                          <span style={styles.summaryItem}>
                            Monthly Rent: ${doc.financialSummary.total_monthly_rent?.toLocaleString() || 'N/A'}
                          </span>
                          <span style={styles.summaryItem}>
                            Occupancy: {(doc.financialSummary.occupancy_rate * 100)?.toFixed(1) || 'N/A'}%
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div style={styles.documentStatus}>
                  <div style={styles.statusBadge}>✓ Parsed</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    marginBottom: SPACING.XXL,
  },

  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.XS,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
  },

  subtitle: {
    fontSize: '16px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
    marginBottom: SPACING.LG,
    lineHeight: 1.5,
  },

  uploadArea: {
    border: `2px dashed ${NEUTRAL_COLORS.GRAY_200}`,
    borderRadius: '12px',
    padding: SPACING.XXL,
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    backgroundColor: NEUTRAL_COLORS.WHITE,
    marginBottom: SPACING.LG,

    ':hover': {
      borderColor: APPLE_COLORS.BLUE,
      backgroundColor: `${APPLE_COLORS.BLUE}05`,
    },
  },

  uploadAreaActive: {
    borderColor: APPLE_COLORS.BLUE,
    backgroundColor: `${APPLE_COLORS.BLUE}10`,
    transform: 'scale(1.02)',
  },

  uploadAreaUploading: {
    borderColor: NEUTRAL_COLORS.GRAY_300,
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    cursor: 'not-allowed',
  },

  hiddenInput: {
    display: 'none',
  },

  uploadingState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: SPACING.SM,
  },

  uploadingText: {
    fontSize: '16px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
  },

  uploadPrompt: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: SPACING.SM,
  },

  uploadIcon: {
    fontSize: '48px',
    marginBottom: SPACING.SM,
  },

  uploadTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
  },

  uploadText: {
    fontSize: '16px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
  },

  uploadHint: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_500,
    margin: 0,
  },

  uploadedSection: {
    marginTop: SPACING.LG,
  },

  uploadedTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.SM,
  },

  documentsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.SM,
  },

  documentCard: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.SM,
    padding: SPACING.SM,
    backgroundColor: NEUTRAL_COLORS.WHITE,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    borderRadius: '8px',
    transition: 'all 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',

    ':hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  },

  documentIcon: {
    fontSize: '24px',
    width: '32px',
    textAlign: 'center' as const,
  },

  documentInfo: {
    flex: 1,
    minWidth: 0,
  },

  documentName: {
    fontSize: '14px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  documentType: {
    fontSize: '12px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
    marginBottom: '4px',
  },

  financialSummary: {
    display: 'flex',
    gap: SPACING.SM,
    flexWrap: 'wrap' as const,
  },

  summaryItem: {
    fontSize: '11px',
    color: APPLE_COLORS.BLUE,
    backgroundColor: `${APPLE_COLORS.BLUE}10`,
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 500,
  },

  documentStatus: {
    display: 'flex',
    alignItems: 'center',
  },

  statusBadge: {
    fontSize: '12px',
    fontWeight: 500,
    color: APPLE_COLORS.GREEN,
    backgroundColor: `${APPLE_COLORS.GREEN}15`,
    padding: '4px 8px',
    borderRadius: '12px',
  },
} as const;