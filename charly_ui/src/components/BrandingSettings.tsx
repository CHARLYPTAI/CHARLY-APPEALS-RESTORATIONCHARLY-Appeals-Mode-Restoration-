// 🍎 Branding Settings Component - Apple Professional Excellence
// "Design is not just what it looks like - design is how it works" - Steve Jobs

import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { APPLE_COLORS, NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';
import { TRANSITIONS } from '../design/animations';

interface BrandingData {
  companyName: string;
  legalEntity: string;
  licenseNumber: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  website: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  letterheadUrl?: string;
}

const BrandingSettings: React.FC = () => {
  const [formData, setFormData] = useState<BrandingData>({
    companyName: 'Demo Firm',
    legalEntity: 'Demo Firm LLC',
    licenseNumber: 'TX-REB-12345',
    contactEmail: 'admin@demofirm.com',
    contactPhone: '(555) 123-4567',
    address: '123 Business St, Austin, TX 78701',
    website: 'https://demofirm.com',
    primaryColor: APPLE_COLORS.BLUE,
    secondaryColor: APPLE_COLORS.GREEN,
  });

  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleInputChange = (field: keyof BrandingData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (type: 'logo' | 'letterhead', file: File) => {
    setUploading(type);
    
    try {
      // Simulate file upload - in real app, this would upload to backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo, just create a local blob URL
      const blobUrl = URL.createObjectURL(file);
      
      if (type === 'logo') {
        setFormData(prev => ({ ...prev, logoUrl: blobUrl }));
      } else {
        setFormData(prev => ({ ...prev, letterheadUrl: blobUrl }));
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate API save
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert('Branding settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Company Information</h3>
        <div style={styles.formGrid}>
          <Input
            label="Company Name"
            value={formData.companyName}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            required
          />
          <Input
            label="Legal Entity"
            value={formData.legalEntity}
            onChange={(e) => handleInputChange('legalEntity', e.target.value)}
          />
          <Input
            label="Professional License #"
            value={formData.licenseNumber}
            onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
          />
          <Input
            label="Website URL"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            type="url"
          />
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Contact Information</h3>
        <div style={styles.formGrid}>
          <Input
            label="Contact Email"
            value={formData.contactEmail}
            onChange={(e) => handleInputChange('contactEmail', e.target.value)}
            type="email"
          />
          <Input
            label="Contact Phone"
            value={formData.contactPhone}
            onChange={(e) => handleInputChange('contactPhone', e.target.value)}
            type="tel"
          />
        </div>
        <Input
          label="Business Address"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
        />
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Brand Assets</h3>
        
        <div style={styles.uploadSection}>
          <div style={styles.uploadGroup}>
            <label style={styles.uploadLabel}>Company Logo</label>
            <p style={styles.uploadDescription}>
              Upload your company logo (PNG, SVG recommended, 300x100px optimal)
            </p>
            
            {formData.logoUrl ? (
              <div style={styles.previewContainer}>
                <img
                  src={formData.logoUrl}
                  alt="Company Logo"
                  style={styles.logoPreview}
                />
                <div style={styles.previewActions}>
                  <Button
                    variant="secondary"
                    onClick={() => setFormData(prev => ({ ...prev, logoUrl: undefined }))}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <FileUploadButton
                onFileSelect={(file) => handleFileUpload('logo', file)}
                loading={uploading === 'logo'}
                accept="image/*"
              />
            )}
          </div>

          <div style={styles.uploadGroup}>
            <label style={styles.uploadLabel}>Letterhead Template</label>
            <p style={styles.uploadDescription}>
              Upload your letterhead template for reports (PDF, PNG, JPEG)
            </p>
            
            {formData.letterheadUrl ? (
              <div style={styles.previewContainer}>
                <div style={styles.filePreview}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill={NEUTRAL_COLORS.GRAY_600}>
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                  <span>Letterhead uploaded</span>
                </div>
                <div style={styles.previewActions}>
                  <Button
                    variant="secondary"
                    onClick={() => setFormData(prev => ({ ...prev, letterheadUrl: undefined }))}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <FileUploadButton
                onFileSelect={(file) => handleFileUpload('letterhead', file)}
                loading={uploading === 'letterhead'}
                accept="image/*,.pdf"
              />
            )}
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Brand Colors</h3>
        <div style={styles.colorGrid}>
          <div style={styles.colorGroup}>
            <label style={styles.colorLabel}>Primary Brand Color</label>
            <div style={styles.colorInputWrapper}>
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                style={styles.colorInput}
              />
              <input
                type="text"
                value={formData.primaryColor}
                onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                style={styles.colorText}
                placeholder="#007AFF"
              />
            </div>
            <p style={styles.colorDescription}>
              Used for primary actions, links, and active states in branded outputs
            </p>
          </div>

          <div style={styles.colorGroup}>
            <label style={styles.colorLabel}>Secondary Accent Color</label>
            <div style={styles.colorInputWrapper}>
              <input
                type="color"
                value={formData.secondaryColor}
                onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                style={styles.colorInput}
              />
              <input
                type="text"
                value={formData.secondaryColor}
                onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                style={styles.colorText}
                placeholder="#34C759"
              />
            </div>
            <p style={styles.colorDescription}>
              Used for secondary elements, success states, and accents
            </p>
          </div>
        </div>
      </div>

      <div style={styles.actions}>
        <Button
          variant="primary"
          onClick={handleSave}
          loading={saving}
          disabled={saving}
        >
          Save Branding Settings
        </Button>
      </div>
    </div>
  );
};

interface FileUploadButtonProps {
  onFileSelect: (file: File) => void;
  loading: boolean;
  accept: string;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({ onFileSelect, loading, accept }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div style={styles.uploadButton}>
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={styles.hiddenInput}
        id="file-upload"
        disabled={loading}
      />
      <label htmlFor="file-upload" style={styles.uploadButtonLabel}>
        {loading ? (
          <>
            <div style={styles.spinner} />
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill={APPLE_COLORS.BLUE}>
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
            <span>Choose File</span>
          </>
        )}
      </label>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
  },

  section: {
    marginBottom: SPACING.XXL,
    padding: SPACING.LG,
    backgroundColor: NEUTRAL_COLORS.WHITE,
    borderRadius: '12px',
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
  },

  sectionTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.LG,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
  },

  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: SPACING.LG,
  },

  uploadSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.XL,
  },

  uploadGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.SM,
  },

  uploadLabel: {
    fontSize: '16px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_900,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  uploadDescription: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
    lineHeight: 1.4,
  },

  uploadButton: {
    position: 'relative' as const,
  },

  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none' as const,
  },

  uploadButtonLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.SM,
    padding: SPACING.MD,
    border: `2px dashed ${NEUTRAL_COLORS.GRAY_200}`,
    borderRadius: '8px',
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    cursor: 'pointer',
    transition: TRANSITIONS.STANDARD,
    fontSize: '14px',
    color: APPLE_COLORS.BLUE,
    fontWeight: 500,
    justifyContent: 'center',
    minHeight: '80px',

    ':hover': {
      borderColor: APPLE_COLORS.BLUE,
      backgroundColor: `${APPLE_COLORS.BLUE}08`,
    },
  },

  previewContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.LG,
    padding: SPACING.MD,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_200}`,
    borderRadius: '8px',
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
  },

  logoPreview: {
    maxHeight: '60px',
    maxWidth: '200px',
    objectFit: 'contain' as const,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_200}`,
    borderRadius: '4px',
    backgroundColor: NEUTRAL_COLORS.WHITE,
  },

  filePreview: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.SM,
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_700,
  },

  previewActions: {
    marginLeft: 'auto',
  },

  colorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: SPACING.LG,
  },

  colorGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.SM,
  },

  colorLabel: {
    fontSize: '16px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_900,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  colorInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.SM,
  },

  colorInput: {
    width: '50px',
    height: '50px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    outline: `2px solid ${NEUTRAL_COLORS.GRAY_200}`,
    transition: TRANSITIONS.STANDARD,

    ':hover': {
      outlineColor: APPLE_COLORS.BLUE,
    },
  },

  colorText: {
    padding: `${SPACING.SM} ${SPACING.MD}`,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_200}`,
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'monospace',
    backgroundColor: NEUTRAL_COLORS.WHITE,
    flex: 1,
    transition: TRANSITIONS.STANDARD,

    ':focus': {
      outline: 'none',
      borderColor: APPLE_COLORS.BLUE,
      boxShadow: `0 0 0 3px ${APPLE_COLORS.BLUE}20`,
    },
  },

  colorDescription: {
    fontSize: '12px',
    color: NEUTRAL_COLORS.GRAY_500,
    margin: 0,
    lineHeight: 1.4,
  },

  spinner: {
    width: '16px',
    height: '16px',
    border: `2px solid ${NEUTRAL_COLORS.GRAY_200}`,
    borderTop: `2px solid ${APPLE_COLORS.BLUE}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  actions: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: SPACING.XL,
  },
} as const;

// Add keyframe animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(styleSheet);

export default BrandingSettings;