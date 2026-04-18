export interface ParsedDoc {
  text: string;
  pages?: number;
  mimeType: string;
  meta?: Record<string, unknown>;
  /** True if the document appears to be scanned/image-only and required OCR. */
  ocr?: boolean;
}
