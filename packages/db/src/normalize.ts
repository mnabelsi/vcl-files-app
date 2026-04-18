// Shared folder/client-name normalization so writes + pg_trgm lookups line up.
const NOISE = [
  /\bv\d+(\.\d+)?\b/gi,
  /\bfinal\b/gi,
  /\bdraft\b/gi,
  /\bcopy\b/gi,
  /\b20\d{2}\b/g,
  /[_\-]+/g,
  /[^\p{L}\p{N}\s]/gu,
];

export function normalizeClientName(input: string): string {
  let s = input.toLowerCase();
  for (const re of NOISE) s = s.replace(re, ' ');
  return s.replace(/\s+/g, ' ').trim();
}
