import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UploadService } from '../services/upload-service.js';

// Mock the file processor module
vi.mock('../mocks/charly-packages.js', () => ({
  validateFile: vi.fn(),
  scanForViruses: vi.fn(),
  scrubEXIF: vi.fn(),
  extractTextFromFile: vi.fn(),
  generateThumbnail: vi.fn(),
  checkForDuplicate: vi.fn()
}));

describe('UploadService', () => {
  let uploadService: UploadService;
  let mockValidateFile: any;
  let mockScanForViruses: any;
  let mockScrubEXIF: any;
  let mockExtractTextFromFile: any;
  let mockCheckForDuplicate: any;

  beforeEach(async () => {
    uploadService = new UploadService();
    
    // Get mocked functions
    const charlyPackages = await import('../mocks/charly-packages.js');
    mockValidateFile = vi.mocked(charlyPackages.validateFile);
    mockScanForViruses = vi.mocked(charlyPackages.scanForViruses);
    mockScrubEXIF = vi.mocked(charlyPackages.scrubEXIF);
    mockExtractTextFromFile = vi.mocked(charlyPackages.extractTextFromFile);
    mockCheckForDuplicate = vi.mocked(charlyPackages.checkForDuplicate);
    
    vi.clearAllMocks();
  });

  describe('processUpload', () => {
    it('should successfully process a valid file upload', async () => {
      const filename = 'test.pdf';
      const mimeType = 'application/pdf';
      const buffer = Buffer.from('test file content');

      mockValidateFile.mockResolvedValue({ valid: true });
      mockScanForViruses.mockResolvedValue({ clean: true });
      mockScrubEXIF.mockResolvedValue({ buffer });
      mockExtractTextFromFile.mockResolvedValue({ text: 'extracted text', confidence: 0.95 });
      mockCheckForDuplicate.mockReturnValue({ isDuplicate: false, sha256: 'mock-hash' });

      const result = await uploadService.processUpload(filename, mimeType, buffer);

      expect(result).toHaveProperty('upload_id');
      expect(result.upload_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(result.signed_urls).toEqual([`/uploads/${result.upload_id}`]);
      expect(result.pipeline).toEqual({
        av: 'pending',
        exif: 'pending',
        ocr: 'pending'
      });

      expect(mockValidateFile).toHaveBeenCalledWith(buffer, mimeType, filename);
    });

    it('should throw error for invalid file', async () => {
      const filename = 'invalid.exe';
      const mimeType = 'application/x-executable';
      const buffer = Buffer.from('malicious content');

      mockValidateFile.mockResolvedValue({ 
        valid: false, 
        errors: ['Unsupported file type'] 
      });

      await expect(uploadService.processUpload(filename, mimeType, buffer))
        .rejects.toThrow('File validation failed: Unsupported file type');

      expect(mockValidateFile).toHaveBeenCalledWith(buffer, mimeType, filename);
    });

    it('should throw error for file with validation errors', async () => {
      const filename = 'test.pdf';
      const mimeType = 'application/pdf';
      const buffer = Buffer.from('test content');

      mockValidateFile.mockResolvedValue({ 
        valid: false, 
        errors: ['File corrupted', 'Invalid header'] 
      });

      await expect(uploadService.processUpload(filename, mimeType, buffer))
        .rejects.toThrow('File validation failed: File corrupted, Invalid header');

      expect(mockValidateFile).toHaveBeenCalledWith(buffer, mimeType, filename);
    });

    it('should start async processing after successful upload', async () => {
      const filename = 'test.csv';
      const mimeType = 'text/csv';
      const buffer = Buffer.from('col1,col2\nval1,val2');

      mockValidateFile.mockResolvedValue({ valid: true });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockScanForViruses.mockResolvedValue({ clean: true });
      mockScrubEXIF.mockResolvedValue({ buffer });
      mockExtractTextFromFile.mockResolvedValue({ text: 'extracted text', confidence: 0.9 });
      mockCheckForDuplicate.mockReturnValue({ isDuplicate: false, sha256: 'test-hash' });

      const result = await uploadService.processUpload(filename, mimeType, buffer);

      expect(result).toHaveProperty('upload_id');

      // Wait for async processing to complete
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(mockScanForViruses).toHaveBeenCalledWith(buffer);
      expect(mockScrubEXIF).toHaveBeenCalledWith(buffer, mimeType);
      expect(mockExtractTextFromFile).toHaveBeenCalledWith(buffer, mimeType);
      expect(mockCheckForDuplicate).toHaveBeenCalledWith(buffer, result.upload_id);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Upload ${result.upload_id} processed successfully`),
        expect.objectContaining({
          virus_scan: 'clean',
          ocr_confidence: 0.9,
          is_duplicate: false,
          hash: 'test-hash'
        })
      );

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle virus detection in async processing', async () => {
      const filename = 'infected.pdf';
      const mimeType = 'application/pdf';
      const buffer = Buffer.from('infected content');

      mockValidateFile.mockResolvedValue({ valid: true });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockScanForViruses.mockResolvedValue({ 
        clean: false, 
        threats: ['Trojan.Win32.Test', 'Malware.Generic'] 
      });

      const result = await uploadService.processUpload(filename, mimeType, buffer);

      expect(result).toHaveProperty('upload_id');

      // Wait for async processing to complete
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Upload ${result.upload_id} processing failed:`),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle errors in async processing gracefully', async () => {
      const filename = 'error.pdf';
      const mimeType = 'application/pdf';
      const buffer = Buffer.from('test content');

      mockValidateFile.mockResolvedValue({ valid: true });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockScanForViruses.mockRejectedValue(new Error('AV service unavailable'));

      const result = await uploadService.processUpload(filename, mimeType, buffer);

      expect(result).toHaveProperty('upload_id');

      // Wait for async processing to complete
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Upload ${result.upload_id} processing failed:`),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});