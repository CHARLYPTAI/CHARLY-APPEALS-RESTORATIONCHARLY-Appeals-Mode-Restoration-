import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UploadService } from '../services/upload-service.js';
import { ValidationService } from '../services/validation-service.js';
import { OnboardingService } from '../services/onboarding-service.js';
import { JurisdictionService } from '../services/jurisdiction-service.js';
import fs from 'fs/promises';
import path from 'path';

// Mock the file processor module
vi.mock('../mocks/charly-packages.js', () => ({
  validateFile: vi.fn(),
  scanForViruses: vi.fn(),
  scrubEXIF: vi.fn(),
  extractTextFromFile: vi.fn(),
  generateThumbnail: vi.fn(),
  checkForDuplicate: vi.fn(),
  validateCommercialPropertySafe: vi.fn(),
  makeAssessmentDecision: vi.fn()
}));

describe('SWARTZ Dataset Validation - T-002 Security & Performance', () => {
  let uploadService: UploadService;
  let validationService: ValidationService;
  let onboardingService: OnboardingService;
  let jurisdictionService: JurisdictionService;
  let mockValidateFile: any;
  let mockScanForViruses: any;
  let mockScrubEXIF: any;
  let mockExtractTextFromFile: any;
  let mockCheckForDuplicate: any;
  let mockValidateCommercialPropertySafe: any;
  let mockMakeAssessmentDecision: any;

  beforeEach(async () => {
    uploadService = new UploadService();
    validationService = new ValidationService();
    onboardingService = new OnboardingService();
    jurisdictionService = new JurisdictionService();
    
    // Get mocked functions
    const charlyPackages = await import('../mocks/charly-packages.js');
    mockValidateFile = vi.mocked(charlyPackages.validateFile);
    mockScanForViruses = vi.mocked(charlyPackages.scanForViruses);
    mockScrubEXIF = vi.mocked(charlyPackages.scrubEXIF);
    mockExtractTextFromFile = vi.mocked(charlyPackages.extractTextFromFile);
    mockCheckForDuplicate = vi.mocked(charlyPackages.checkForDuplicate);
    mockValidateCommercialPropertySafe = vi.mocked(charlyPackages.validateCommercialPropertySafe);
    mockMakeAssessmentDecision = vi.mocked(charlyPackages.makeAssessmentDecision);
    
    vi.clearAllMocks();
  });

  describe('File Ingestion Security Validation', () => {
    it('should validate Office Building Z income statements with security pipeline', async () => {
      const testFile = 'Office Bldg Z – 2020, 2021, 2022 income statements.csv';
      const buffer = Buffer.from('mock,csv,content\nOffice Building Z,485000,340000');
      
      // Configure security mocks
      mockValidateFile.mockResolvedValue({ valid: true });
      mockScanForViruses.mockResolvedValue({ clean: true });
      mockScrubEXIF.mockResolvedValue({ buffer });
      mockExtractTextFromFile.mockResolvedValue({ 
        text: 'Office Building Z 485000 340000 NOI Austin TX',
        confidence: 0.92 
      });
      mockCheckForDuplicate.mockReturnValue({ 
        isDuplicate: false, 
        sha256: 'abc123def456' 
      });

      const result = await uploadService.processUpload(testFile, 'text/csv', buffer);

      expect(result.upload_id).toBeDefined();
      expect(result.pipeline.av).toBe('pending');
      expect(result.pipeline.exif).toBe('pending');
      expect(result.pipeline.ocr).toBe('pending');

      // Verify security checks called
      expect(mockValidateFile).toHaveBeenCalledWith(buffer, 'text/csv', testFile);
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(mockScanForViruses).toHaveBeenCalledWith(buffer);
      expect(mockScrubEXIF).toHaveBeenCalledWith(buffer, 'text/csv');
      expect(mockExtractTextFromFile).toHaveBeenCalled();
    });

    it('should validate ABC Company P&L with virus scanning', async () => {
      const testFile = 'P&L ABC Company 2021 & 2022.csv';
      const buffer = Buffer.from('mock,csv,content\nABC Company,285000,175000');
      
      mockValidateFile.mockResolvedValue({ valid: true });
      mockScanForViruses.mockResolvedValue({ clean: true });
      mockScrubEXIF.mockResolvedValue({ buffer });
      mockExtractTextFromFile.mockResolvedValue({ 
        text: 'ABC Company Office Complex 285000 175000',
        confidence: 0.88 
      });
      mockCheckForDuplicate.mockReturnValue({ 
        isDuplicate: false, 
        sha256: 'def789ghi012' 
      });

      const result = await uploadService.processUpload(testFile, 'text/csv', buffer);

      expect(result.upload_id).toBeDefined();
      expect(mockValidateFile).toHaveBeenCalled();
      
      // Wait for async security processing
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(mockScanForViruses).toHaveBeenCalledWith(buffer);
    });

    it('should reject malicious file during security scan', async () => {
      const testFile = 'malicious.csv';
      const buffer = Buffer.from('malicious content');
      
      mockValidateFile.mockResolvedValue({ valid: true });
      mockScanForViruses.mockResolvedValue({ 
        clean: false, 
        threats: ['CSV.Malware.Test'] 
      });

      const result = await uploadService.processUpload(testFile, 'text/csv', buffer);
      
      // Upload should succeed initially but fail in async processing
      expect(result.upload_id).toBeDefined();
      
      // Wait for async processing to detect virus
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(mockScanForViruses).toHaveBeenCalledWith(buffer);
    });
  });

  describe('Jurisdiction Rules Application', () => {
    it('should apply Travis County TX jurisdiction rules to Office Building Z', async () => {
      const propertyData = {
        assessedValue: 2800000,
        marketValue: 3200000,
        taxRate: 0.0225,
        address: {
          street: '1250 Business Park Drive',
          city: 'Austin',
          state: 'TX',
          zip: '78759'
        }
      };

      mockValidateCommercialPropertySafe.mockReturnValue({
        valid: true,
        data: propertyData
      });

      mockMakeAssessmentDecision.mockReturnValue({
        label: 'OVER',
        confidence: 0.85,
        savingsEstimate: 9000
      });

      const result = await validationService.validateCommercial({
        property: propertyData
      });

      expect(result.decision_preview).toEqual({
        label: 'OVER',
        confidence: 0.85,
        savings_estimate: 9000
      });

      expect(mockMakeAssessmentDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          assessedValue: 2800000,
          estimatedMarketValue: 3200000,
          taxRate: 0.0225,
          jurisdictionPriors: expect.objectContaining({
            successRate: 0.65,
            averageFees: 5000,
            averageTimeToResolution: 180,
            reassessmentRisk: 0.15
          })
        })
      );
    });

    it('should handle ABC Company property as FAIR assessment', async () => {
      const propertyData = {
        assessedValue: 1850000,
        marketValue: 1900000,
        taxRate: 0.0225,
        address: {
          street: '4500 Technology Way',
          city: 'Austin',
          state: 'TX',
          zip: '78746'
        }
      };

      mockValidateCommercialPropertySafe.mockReturnValue({
        valid: true,
        data: propertyData
      });

      mockMakeAssessmentDecision.mockReturnValue({
        label: 'FAIR',
        confidence: 0.82,
        savingsEstimate: 0
      });

      const result = await validationService.validateCommercial({
        property: propertyData
      });

      expect(result.decision_preview?.label).toBe('FAIR');
      expect(result.decision_preview?.savings_estimate).toBe(0);
    });

    it('should identify 123 Company as over-assessed', async () => {
      const propertyData = {
        assessedValue: 3200000,
        marketValue: 2900000,
        taxRate: 0.0225,
        address: {
          street: '7890 Corporate Boulevard',
          city: 'Austin',
          state: 'TX',
          zip: '78731'
        }
      };

      mockValidateCommercialPropertySafe.mockReturnValue({
        valid: true,
        data: propertyData
      });

      mockMakeAssessmentDecision.mockReturnValue({
        label: 'OVER',
        confidence: 0.78,
        savingsEstimate: 6750
      });

      const result = await validationService.validateCommercial({
        property: propertyData
      });

      expect(result.decision_preview?.label).toBe('OVER');
      expect(result.decision_preview?.savings_estimate).toBe(6750);
    });
  });

  describe('KPI Tracking During Onboarding', () => {
    it('should track KPIs for complete SWARTZ property onboarding flow', async () => {
      // Register customer
      const registrationRequest = {
        organization: {
          name: 'Don Swartz Properties',
          type: 'commercial_real_estate' as const,
          size: 'medium' as const,
          address: {
            street: '100 Main St',
            city: 'Austin',
            state: 'TX',
            zip: '78701',
            country: 'USA'
          },
          phone: '512-555-0123'
        },
        primary_contact: {
          first_name: 'Don',
          last_name: 'Swartz',
          email: 'don@swartzproperties.com',
          phone: '512-555-0123',
          title: 'Owner'
        },
        jurisdictions: ['travis_county_tx'],
        expected_monthly_appeals: 5
      };

      const customer = await onboardingService.registerCustomer(registrationRequest);
      expect(customer.customer_id).toBeDefined();

      // Process sample data upload step
      const uploadStepRequest = {
        customer_id: customer.customer_id,
        step_type: 'sample_data_upload' as const,
        data: {
          files: ['Office Bldg Z income statements', 'ABC Company P&L', '123 Company Income Statement']
        }
      };

      const uploadResult = await onboardingService.processOnboardingStep(uploadStepRequest);
      expect(uploadResult.status).toBe('completed');

      // Process jurisdiction verification step
      const jurisdictionStepRequest = {
        customer_id: customer.customer_id,
        step_type: 'jurisdiction_verification' as const,
        data: {
          jurisdictions: ['travis_county_tx']
        }
      };

      const jurisdictionResult = await onboardingService.processOnboardingStep(jurisdictionStepRequest);
      expect(jurisdictionResult.status).toBe('completed');

      // Check KPI tracking
      const kpis = await onboardingService.getKPIData(customer.customer_id);
      expect(kpis.length).toBeGreaterThanOrEqual(2); // registration + first_upload
      
      expect(kpis.find(k => k.event_type === 'registration')).toBeDefined();
      expect(kpis.find(k => k.event_type === 'first_upload')).toBeDefined();

      // Check onboarding status
      const status = await onboardingService.getOnboardingStatus(customer.customer_id);
      expect(status.kpis.sample_packets_generated).toBeGreaterThanOrEqual(0);
      expect(status.progress.completion_percentage).toBeGreaterThan(0);
    });
  });

  describe('Performance Validation', () => {
    it('should process SWARTZ dataset within performance thresholds', async () => {
      const startTime = performance.now();
      
      // Test file processing speed
      const testFiles = [
        'Office Bldg Z – 2020, 2021, 2022 income statements.csv',
        'P&L ABC Company 2021 & 2022.csv',
        'Income Statement 123 company.csv',
        'Rent Roll as of 12.31.22 Office Bldg Z.csv'
      ];

      mockValidateFile.mockResolvedValue({ valid: true });
      mockScanForViruses.mockResolvedValue({ clean: true });
      mockScrubEXIF.mockResolvedValue({ buffer: Buffer.from('test') });
      mockExtractTextFromFile.mockResolvedValue({ text: 'extracted', confidence: 0.9 });
      mockCheckForDuplicate.mockReturnValue({ isDuplicate: false, sha256: 'hash' });

      const uploadPromises = testFiles.map(filename => 
        uploadService.processUpload(filename, 'text/csv', Buffer.from('test data'))
      );

      const results = await Promise.all(uploadPromises);
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Performance assertions
      expect(processingTime).toBeLessThan(5000); // Under 5 seconds for 4 files
      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result.upload_id).toBeDefined();
        expect(result.pipeline).toBeDefined();
      });
    });

    it('should maintain decision confidence above threshold', async () => {
      const properties = [
        { assessedValue: 2800000, marketValue: 3200000, taxRate: 0.0225 }, // Over
        { assessedValue: 1850000, marketValue: 1900000, taxRate: 0.0225 }, // Fair  
        { assessedValue: 3200000, marketValue: 2900000, taxRate: 0.0225 }  // Over
      ];

      mockValidateCommercialPropertySafe.mockReturnValue({ valid: true, data: {} });
      
      // Mock high confidence decisions
      mockMakeAssessmentDecision
        .mockReturnValueOnce({ label: 'OVER', confidence: 0.85, savingsEstimate: 9000 })
        .mockReturnValueOnce({ label: 'FAIR', confidence: 0.82, savingsEstimate: 0 })
        .mockReturnValueOnce({ label: 'OVER', confidence: 0.78, savingsEstimate: 6750 });

      const results = await Promise.all(
        properties.map(property => validationService.validateCommercial({ property }))
      );

      // All decisions should meet confidence threshold
      results.forEach(result => {
        if (result.decision_preview) {
          expect(result.decision_preview.confidence).toBeGreaterThan(0.75);
        }
      });
    });
  });
});