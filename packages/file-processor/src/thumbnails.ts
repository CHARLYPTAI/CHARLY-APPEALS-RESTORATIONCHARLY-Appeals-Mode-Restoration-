import sharp from 'sharp';
import type { ThumbnailResult } from './types.js';

const THUMBNAIL_WIDTH = 300;
const THUMBNAIL_HEIGHT = 300;

export async function generateThumbnail(
  buffer: Buffer, 
  mimeType: string,
  outputPath: string
): Promise<ThumbnailResult> {
  if (!shouldGenerateThumbnail(mimeType)) {
    throw new Error(`Thumbnail generation not supported for ${mimeType}`);
  }

  try {
    const thumbnail = await sharp(buffer)
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    const metadata = await sharp(thumbnail).metadata();

    return {
      thumbnailPath: outputPath,
      width: metadata.width || THUMBNAIL_WIDTH,
      height: metadata.height || THUMBNAIL_HEIGHT,
      format: 'jpeg'
    };
  } catch (error) {
    throw new Error(`Failed to generate thumbnail: ${error}`);
  }
}

function shouldGenerateThumbnail(mimeType: string): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf'
  ];
  
  return supportedTypes.includes(mimeType);
}