export interface FileProcessingPipeline {
  uploadId: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  stages: ProcessingStage[];
}

export interface ProcessingStage {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  result?: unknown;
  error?: string;
}

export interface AVScanResult {
  clean: boolean;
  threats?: string[];
  scanTime: Date;
}

export interface EXIFScrubResult {
  originalHadExif: boolean;
  scrubbed: boolean;
  metadataRemoved?: string[];
}

export interface OCRResult {
  text: string;
  confidence: number;
  language?: string;
  pages?: OCRPage[];
}

export interface OCRPage {
  pageNumber: number;
  text: string;
  confidence: number;
  boundingBoxes?: TextBoundingBox[];
}

export interface TextBoundingBox {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface ThumbnailResult {
  thumbnailPath: string;
  width: number;
  height: number;
  format: string;
}

export interface HashResult {
  sha256: string;
  isDuplicate: boolean;
  existingUploadId?: string;
}

export interface FileValidationResult {
  valid: boolean;
  mimeType: string;
  actualMimeType?: string;
  fileSize: number;
  errors?: string[];
}

export interface CSVExtractionResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  errors?: string[];
}