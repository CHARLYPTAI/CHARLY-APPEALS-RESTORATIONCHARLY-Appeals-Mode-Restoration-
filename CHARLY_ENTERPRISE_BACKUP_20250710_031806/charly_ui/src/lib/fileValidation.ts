// fileValidation.ts

export const MAX_FILE_SIZE_MB = 10;
const allowedMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv"
];

export function validateFile(file: File): string | null {
  if (!allowedMimeTypes.includes(file.type)) {
    return `Unsupported file type: ${file.type}`;
  }

  const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`;
  }

  return null; // ✅ Passed
}