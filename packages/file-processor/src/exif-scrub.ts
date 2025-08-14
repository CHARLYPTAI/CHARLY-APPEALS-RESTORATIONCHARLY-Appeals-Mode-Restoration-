import sharp from 'sharp';
import type { EXIFScrubResult } from './types.js';

export async function scrubEXIF(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; result: EXIFScrubResult }> {
  if (!isImageFile(mimeType)) {
    return {
      buffer,
      result: {
        originalHadExif: false,
        scrubbed: false
      }
    };
  }

  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    const hadExif = !!(metadata.exif || metadata.icc || metadata.iptc || metadata.xmp);
    
    const scrubbed = await image
      .withMetadata({}) 
      .toBuffer();

    return {
      buffer: scrubbed,
      result: {
        originalHadExif: hadExif,
        scrubbed: true,
        metadataRemoved: getMetadataTypes(metadata)
      }
    };
  } catch (error) {
    return {
      buffer,
      result: {
        originalHadExif: false,
        scrubbed: false
      }
    };
  }
}

function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

function getMetadataTypes(metadata: sharp.Metadata): string[] {
  const types: string[] = [];
  
  if (metadata.exif) types.push('EXIF');
  if (metadata.icc) types.push('ICC');
  if (metadata.iptc) types.push('IPTC');
  if (metadata.xmp) types.push('XMP');
  
  return types;
}