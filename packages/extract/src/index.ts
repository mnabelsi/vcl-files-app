import type { ParsedDoc } from './types.js';
export type { ParsedDoc };

export async function parseDocx(buf: Buffer): Promise<ParsedDoc> {
  const mammoth = await import('mammoth');
  const { value } = await mammoth.extractRawText({ buffer: buf });
  return {
    text: value,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
}

export async function parsePdf(buf: Buffer): Promise<ParsedDoc> {
  const pdf = (await import('pdf-parse')).default;
  const data = await pdf(buf);
  const text = data.text ?? '';
  // Scanned-PDF heuristic: near-zero extractable text per page -> OCR fallback.
  const perPage = data.numpages ? text.length / data.numpages : text.length;
  if (perPage < 40) {
    return parsePdfWithOcr(buf);
  }
  return {
    text,
    pages: data.numpages,
    mimeType: 'application/pdf',
    meta: { info: data.info },
  };
}

export async function parsePdfWithOcr(_buf: Buffer): Promise<ParsedDoc> {
  // STUB: tesseract.js pipeline goes here. Real impl should rasterize pages
  // (e.g. via pdfjs-dist) then OCR each image. Returning empty to keep the
  // pipeline unblocked.
  return { text: '', mimeType: 'application/pdf', ocr: true };
}

export async function parsePptx(buf: Buffer): Promise<ParsedDoc> {
  const op = await import('officeparser');
  const text = await op.parseOfficeAsync(buf);
  return {
    text: typeof text === 'string' ? text : String(text),
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };
}

export async function parseXlsx(buf: Buffer): Promise<ParsedDoc> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buf, { type: 'buffer' });
  const parts: string[] = [];
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;
    parts.push(`## ${sheetName}\n${XLSX.utils.sheet_to_csv(sheet)}`);
  }
  return {
    text: parts.join('\n\n'),
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}

export async function parseByFilename(name: string, buf: Buffer): Promise<ParsedDoc> {
  const lower = name.toLowerCase();
  if (lower.endsWith('.docx')) return parseDocx(buf);
  if (lower.endsWith('.pdf')) return parsePdf(buf);
  if (lower.endsWith('.pptx')) return parsePptx(buf);
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return parseXlsx(buf);
  if (lower.endsWith('.txt') || lower.endsWith('.md')) {
    return { text: buf.toString('utf8'), mimeType: 'text/plain' };
  }
  throw new Error(`unsupported file: ${name}`);
}
