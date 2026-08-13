import React from 'react';

/**
 * Strips raw HTML tags (e.g., <u>, </u>, <b>, </b>, <br>, etc.)
 */
export function stripHtmlTags(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/&lt;br\s*\/?&gt;/gi, ' ')
    .replace(/<\/?(u|b|i|strong|em|p|span|div|h[1-6]|font)\b[^>]*>/gi, '')
    .replace(/&lt;\/?(u|b|i|strong|em|p|span|div|h[1-6]|font)\b.*?&gt;/gi, '')
    .trim();
}

/**
 * Cleans plain text for places where markdown or HTML formatting isn't supported (e.g., table cells or pdf headers)
 */
export function cleanPlainText(str: string): string {
  if (!str || typeof str !== 'string') return '';
  let cleaned = stripHtmlTags(str);
  // Strip bold markers **text** or __text__
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1').replace(/__(.*?)__/g, '$1');
  // Clean up any remaining orphan double asterisks
  cleaned = cleaned.replace(/\*\*/g, '');
  // Clean horizontal rule lines if present as isolated text
  if (/^[\s\-_*]{3,}$/.test(cleaned.trim())) {
    return '';
  }
  return cleaned;
}

export interface FormattedSegment {
  text: string;
  bold?: boolean;
  isDivider?: boolean;
}

/**
 * Parses raw string text (which may contain <u>, **bold**, ---) into structured segments.
 */
export function parseRichTextSegments(rawText: string): FormattedSegment[] {
  if (!rawText || typeof rawText !== 'string') return [];

  // Check if entire text or line is a divider like --- or ___ or ***
  const trimmed = rawText.trim();
  if (/^[\s\-_*]{3,}$/.test(trimmed)) {
    return [{ text: '', isDivider: true }];
  }

  // 1. Strip HTML tags like <u>, </u>, <b>, </b>, etc.
  const cleanStr = stripHtmlTags(rawText);

  // 2. Parse **bold** parts
  const segments: FormattedSegment[] = [];
  const parts = cleanStr.split(/(\*\*.*?\*\*|__.*?__)/g);

  for (const part of parts) {
    if (!part) continue;
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      const content = part.substring(2, part.length - 2);
      if (content) {
        segments.push({ text: content, bold: true });
      }
    } else {
      // Remove any stray ** that wasn't closed
      const cleanPart = part.replace(/\*\*/g, '');
      if (cleanPart) {
        segments.push({ text: cleanPart, bold: false });
      }
    }
  }

  return segments;
}

/**
 * React component to render rich text segments cleanly
 */
export const FormattedText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <span className={className}>
      {lines.map((line, lIdx) => {
        const segments = parseRichTextSegments(line);

        if (segments.length === 1 && segments[0].isDivider) {
          return (
            <span key={lIdx} className="block my-3">
              <hr className="border-slate-300 dark:border-white/10" />
            </span>
          );
        }

        return (
          <React.Fragment key={lIdx}>
            {segments.map((seg, sIdx) => {
              if (seg.bold) {
                return (
                  <strong key={sIdx} className="font-bold text-slate-900 dark:text-white">
                    {seg.text}
                  </strong>
                );
              }
              return <span key={sIdx}>{seg.text}</span>;
            })}
            {lIdx < lines.length - 1 && <br />}
          </React.Fragment>
        );
      })}
    </span>
  );
};
