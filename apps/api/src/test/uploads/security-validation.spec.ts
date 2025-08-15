import { describe, it, expect } from 'vitest';
import { validateFile } from '../../mocks/charly-packages.js';

describe('Upload Security Validation', () => {
  describe('File Type Validation', () => {
    it('should accept PDF files with valid header', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 mock pdf content');
      const result = await validateFile(pdfBuffer, 'application/pdf', 'test.pdf');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject PDF files with invalid header', async () => {
      const invalidPdfBuffer = Buffer.from('not a pdf file');
      const result = await validateFile(invalidPdfBuffer, 'application/pdf', 'test.pdf');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid PDF file header');
    });

    it('should accept JPEG files with valid header', async () => {
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, ...Buffer.from('mock jpeg')]);
      const result = await validateFile(jpegBuffer, 'image/jpeg', 'test.jpg');
      
      expect(result.valid).toBe(true);
    });

    it('should reject JPEG files with invalid header', async () => {
      const invalidJpegBuffer = Buffer.from('not a jpeg');
      const result = await validateFile(invalidJpegBuffer, 'image/jpeg', 'test.jpg');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid JPEG file header');
    });

    it('should accept PNG files with valid header', async () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, ...Buffer.from('mock png')]);
      const result = await validateFile(pngBuffer, 'image/png', 'test.png');
      
      expect(result.valid).toBe(true);
    });

    it('should reject PNG files with invalid header', async () => {
      const invalidPngBuffer = Buffer.from('not a png');
      const result = await validateFile(invalidPngBuffer, 'image/png', 'test.png');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid PNG file header');
    });

    it('should accept CSV files', async () => {
      const csvBuffer = Buffer.from('header1,header2\nvalue1,value2');
      const result = await validateFile(csvBuffer, 'text/csv', 'test.csv');
      
      expect(result.valid).toBe(true);
    });

    it('should accept Excel files', async () => {
      const excelBuffer = Buffer.from('mock excel content');
      const result = await validateFile(excelBuffer, 'application/vnd.ms-excel', 'test.xls');
      
      expect(result.valid).toBe(true);
    });

    it('should reject unsupported file types', async () => {
      const buffer = Buffer.from('executable content');
      const result = await validateFile(buffer, 'application/x-msdownload', 'malicious.exe');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unsupported file type: application/x-msdownload');
    });

    it('should reject files with unsupported extensions', async () => {
      const buffer = Buffer.from('script content');
      const result = await validateFile(buffer, 'text/csv', 'script.sh');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unsupported file extension: .sh');
    });

    it('should reject files without extensions', async () => {
      const buffer = Buffer.from('some content');
      const result = await validateFile(buffer, 'text/csv', 'noextension');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unsupported file extension: none');
    });
  });

  describe('File Size Validation', () => {
    it('should reject empty files', async () => {
      const emptyBuffer = Buffer.alloc(0);
      const result = await validateFile(emptyBuffer, 'application/pdf', 'empty.pdf');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Empty file');
    });

    it('should reject files exceeding size limit', async () => {
      const largeBuffer = Buffer.alloc(51 * 1024 * 1024, 'x');
      const result = await validateFile(largeBuffer, 'application/pdf', 'large.pdf');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File exceeds maximum size of 50MB');
    });

    it('should accept files within size limit', async () => {
      const validBuffer = Buffer.from('%PDF-1.4 valid size');
      const result = await validateFile(validBuffer, 'application/pdf', 'valid.pdf');
      
      expect(result.valid).toBe(true);
    });
  });

  describe('Extension and MIME Type Alignment', () => {
    it('should validate PDF extension matches MIME type', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 content');
      const result = await validateFile(pdfBuffer, 'application/pdf', 'test.pdf');
      
      expect(result.valid).toBe(true);
    });

    it('should reject mismatched extension and MIME type', async () => {
      const buffer = Buffer.from('content');
      const result = await validateFile(buffer, 'application/pdf', 'test.exe');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unsupported file extension: .exe');
    });
  });
});