import csv from 'csv-parser';
import { Readable } from 'stream';
import type { CSVExtractionResult } from './types.js';

export async function extractCSVData(buffer: Buffer): Promise<CSVExtractionResult> {
  return new Promise((resolve, reject) => {
    const results: Record<string, string>[] = [];
    let headers: string[] = [];
    const errors: string[] = [];
    
    const stream = Readable.from(buffer)
      .pipe(csv({
        skipEmptyLines: true,
        headers: (headerList) => {
          headers = headerList.map(header => header.trim());
          return headers;
        }
      }))
      .on('data', (data) => {
        try {
          const cleanedData: Record<string, string> = {};
          for (const [key, value] of Object.entries(data)) {
            cleanedData[key] = String(value).trim();
          }
          results.push(cleanedData);
        } catch (error) {
          errors.push(`Row parsing error: ${error}`);
        }
      })
      .on('end', () => {
        resolve({
          headers,
          rows: results,
          totalRows: results.length,
          errors: errors.length > 0 ? errors : undefined
        });
      })
      .on('error', (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      });
  });
}

export function validateCSVStructure(
  result: CSVExtractionResult,
  requiredHeaders: string[]
): string[] {
  const errors: string[] = [];
  
  if (result.headers.length === 0) {
    errors.push('No headers found in CSV');
    return errors;
  }

  for (const required of requiredHeaders) {
    if (!result.headers.includes(required)) {
      errors.push(`Required header '${required}' not found`);
    }
  }

  if (result.totalRows === 0) {
    errors.push('No data rows found in CSV');
  }

  return errors;
}