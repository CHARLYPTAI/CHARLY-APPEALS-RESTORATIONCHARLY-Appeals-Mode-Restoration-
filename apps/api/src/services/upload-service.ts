import { 
  validateFile, 
  scanForViruses, 
  scrubEXIF, 
  extractTextFromFile,
  checkForDuplicate
} from '../mocks/charly-packages.js';
import type { UploadResponse } from '../types/api.js';
import { generateUploadId } from '../utils/id-generator.js';

export class UploadService {
  async processUpload(
    filename: string,
    mimeType: string,
    buffer: Buffer
  ): Promise<UploadResponse> {
    const uploadId = generateUploadId();
    
    const validation = await validateFile(buffer, mimeType, filename);
    if (!validation.valid) {
      throw new Error(`File validation failed: ${validation.errors?.join(', ')}`);
    }

    const pipeline = {
      av: 'pending' as const,
      exif: 'pending' as const,
      ocr: 'pending' as const
    };

    this.processFileAsync(uploadId, buffer, mimeType).catch(console.error);

    return {
      upload_id: uploadId,
      signed_urls: [`/uploads/${uploadId}`],
      pipeline
    };
  }

  private async processFileAsync(uploadId: string, buffer: Buffer, mimeType: string): Promise<void> {
    try {
      const avResult = await scanForViruses(buffer);
      if (!avResult.clean) {
        throw new Error(`Virus detected: ${avResult.threats?.join(', ')}`);
      }

      const { buffer: scrubbed } = await scrubEXIF(buffer, mimeType);
      
      const ocrResult = await extractTextFromFile(scrubbed, mimeType);
      
      const hashResult = checkForDuplicate(scrubbed, uploadId);
      
      console.log(`Upload ${uploadId} processed successfully`, {
        virus_scan: avResult.clean ? 'clean' : 'threats_found',
        ocr_confidence: ocrResult.confidence,
        is_duplicate: hashResult.isDuplicate,
        hash: hashResult.sha256
      });
      
    } catch (error) {
      console.error(`Upload ${uploadId} processing failed:`, error);
    }
  }
}