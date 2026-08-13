import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  PageBreak,
  AlignmentType,
  Footer,
  PageNumber,
  WidthType,
  BorderStyle,
} from 'docx';
import { Author, Book, Week, GlossaryTerm, ExportTheme } from '../types';
import { cleanPlainText, parseRichTextSegments } from './formatUtils';

export interface MarkdownTableData {
  headers: string[];
  rows: string[][];
}

export type ParagraphBlock =
  | { type: 'text'; content: string }
  | { type: 'table'; data: MarkdownTableData };

export function parseMarkdownTable(text: string): MarkdownTableData | null {
  if (!text || typeof text !== 'string') return null;

  // 1. Pre-process escaped newlines, carriage returns, br tags, and row boundary markers
  let cleanText = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&lt;br\s*\/?&gt;/gi, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Replace double-pipe row boundaries "||" or "| |" between content cells with line breaks
  cleanText = cleanText.replace(/(\|\s*)\|\s*(?=\|)/g, '$1\n|');
  cleanText = cleanText.replace(/([^|\s\n])\s*\|\s*\|\s*([^|\s\n])/g, '$1 |\n| $2');

  // Break lines before separator rows like "| --- |" if concatenated to header
  cleanText = cleanText.replace(/([^|\n])\s*(\|\s*:?---+[\s\-:|]*\|)/g, '$1\n$2');

  // Break lines after separator rows if concatenated to first data row
  cleanText = cleanText.replace(/(\|\s*:?---+[\s\-:|]*\|)\s*([^|\n])/g, '$1\n$2');

  // Break lines between adjacent pipe rows if separated by space: "| col1 | col2 |  | col3 | col4 |"
  cleanText = cleanText.replace(/(\|\s*)\s+(\|\s*[^\s|\-:\n])/g, '$1\n$2');

  const lines = cleanText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const parseRow = (line: string): string[] => {
    let cleaned = line.trim();
    if (cleaned.startsWith('|')) cleaned = cleaned.substring(1);
    if (cleaned.endsWith('|')) cleaned = cleaned.substring(0, cleaned.length - 1);
    const cells = cleaned.split(/(?<!\\)\|/);
    return cells.map((cell) => cell.replace(/\\\|/g, '|').replace(/<br\s*\/?>/gi, ' ').replace(/&lt;br\s*\/?&gt;/gi, ' ').trim());
  };

  const tableLines = lines.filter((l) => l.includes('|'));

  if (tableLines.length >= 2) {
    let headerIndex = 0;
    if (/^\|?[\s\-:|]+\|?$/.test(tableLines[0])) {
      headerIndex = 1;
    }

    const headers = parseRow(tableLines[headerIndex]);
    if (headers && headers.length > 0) {
      const rows: string[][] = [];
      for (let i = headerIndex + 1; i < tableLines.length; i++) {
        const rowStr = tableLines[i];
        if (/^\|?[\s\-:|]+\|?$/.test(rowStr)) continue;

        const cells = parseRow(rowStr);
        if (cells.length > 0) {
          while (cells.length < headers.length) cells.push('');
          rows.push(cells.slice(0, headers.length));
        }
      }
      return { headers, rows };
    }
  }

  // 2. Fallback: single-line pipe parsing if multi-line splitting didn't yield a valid table
  const allCells = cleanText
    .replace(/\n/g, ' ')
    .split('|')
    .map((c) => c.trim());

  while (allCells.length > 0 && allCells[0] === '') allCells.shift();
  while (allCells.length > 0 && allCells[allCells.length - 1] === '') allCells.pop();

  if (allCells.length === 0) return null;

  let sepStartIndex = -1;
  let sepEndIndex = -1;

  for (let i = 0; i < allCells.length; i++) {
    const isSep = /^:?---+:?$/.test(allCells[i]);
    if (isSep) {
      if (sepStartIndex === -1) sepStartIndex = i;
      sepEndIndex = i;
    } else if (sepStartIndex !== -1) {
      break;
    }
  }

  if (sepStartIndex > 0) {
    const headers = allCells.slice(0, sepStartIndex);
    const colCount = headers.length;
    const dataCells = allCells.slice(sepEndIndex + 1);

    if (colCount > 0 && dataCells.length > 0) {
      const rows: string[][] = [];
      for (let i = 0; i < dataCells.length; i += colCount) {
        const chunk = dataCells.slice(i, i + colCount);
        while (chunk.length < colCount) chunk.push('');
        rows.push(chunk);
      }
      if (rows.length > 0) {
        return { headers, rows };
      }
    }
  }

  return null;
}

export function parseParagraphBlocks(text: string): ParagraphBlock[] {
  if (!text || typeof text !== 'string' || !text.trim()) return [];

  if (!text.includes('|')) {
    return [{ type: 'text', content: text }];
  }

  const directTable = parseMarkdownTable(text);
  if (directTable) {
    return [{ type: 'table', data: directTable }];
  }

  let cleanText = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&lt;br\s*\/?&gt;/gi, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/(\|\s*)\|\s*(?=\|)/g, '$1\n|')
    .replace(/([^|\s\n])\s*\|\s*\|\s*([^|\s\n])/g, '$1 |\n| $2')
    .replace(/([^|\n])\s*(\|\s*:?---+[\s\-:|]*\|)/g, '$1\n$2')
    .replace(/(\|\s*:?---+[\s\-:|]*\|)\s*([^|\n])/g, '$1\n$2')
    .replace(/(\|\s*)\s+(\|\s*[^\s|\-:\n])/g, '$1\n$2');

  const lines = cleanText.split('\n');
  const blocks: ParagraphBlock[] = [];
  let textBuffer: string[] = [];
  let tableBuffer: string[] = [];

  const flushText = () => {
    if (textBuffer.length > 0) {
      const str = textBuffer.join('\n').trim();
      if (str) blocks.push({ type: 'text', content: str });
      textBuffer = [];
    }
  };

  const flushTable = () => {
    if (tableBuffer.length > 0) {
      const tableStr = tableBuffer.join('\n');
      const tableData = parseMarkdownTable(tableStr);
      if (tableData) {
        blocks.push({ type: 'table', data: tableData });
      } else {
        const str = tableBuffer.join('\n').trim();
        if (str) blocks.push({ type: 'text', content: str });
      }
      tableBuffer = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const isTableLine =
      trimmed.startsWith('|') ||
      (trimmed.includes('|') && (trimmed.includes('---') || trimmed.endsWith('|')));

    if (isTableLine) {
      flushText();
      tableBuffer.push(line);
    } else {
      if (tableBuffer.length > 0) {
        flushTable();
      }
      textBuffer.push(line);
    }
  }

  flushText();
  flushTable();

  return blocks.length > 0 ? blocks : [{ type: 'text', content: text }];
}

export function normalizeContentSections(sections: any): any[] {
  let list = sections;
  if (typeof sections === 'string') {
    try {
      list = JSON.parse(sections);
    } catch {
      list = [];
    }
  }
  if (!Array.isArray(list)) return [];

  return list.map((sec) => {
    let paragraphs: string[] = Array.isArray(sec.paragraphs) ? [...sec.paragraphs] : [];

    // 1. If sec.table exists, convert to Markdown table string if not already present in paragraphs
    if (sec.table && Array.isArray(sec.table.headers) && Array.isArray(sec.table.rows) && sec.table.headers.length > 0) {
      const headerStr = `| ${sec.table.headers.join(' | ')} |`;
      const sepStr = `| ${sec.table.headers.map(() => '---').join(' | ')} |`;
      const rowStrs = sec.table.rows.map((r: string[]) => `| ${r.join(' | ')} |`);
      const fullMarkdownTable = [headerStr, sepStr, ...rowStrs].join('\n');

      const alreadyHasTable = paragraphs.some((p) => p.includes(headerStr) || parseMarkdownTable(p) !== null);
      if (!alreadyHasTable) {
        paragraphs.push(fullMarkdownTable);
      }
    }

    // 2. Normalize paragraphs using parseParagraphBlocks
    const newParagraphs: string[] = [];
    for (const p of paragraphs) {
      if (typeof p !== 'string') continue;
      const blocks = parseParagraphBlocks(p);
      for (const b of blocks) {
        if (b.type === 'table') {
          const headerStr = `| ${b.data.headers.join(' | ')} |`;
          const sepStr = `| ${b.data.headers.map(() => '---').join(' | ')} |`;
          const rowStrs = b.data.rows.map((r) => `| ${r.join(' | ')} |`);
          newParagraphs.push([headerStr, sepStr, ...rowStrs].join('\n'));
        } else if (b.content.trim()) {
          newParagraphs.push(b.content);
        }
      }
    }

    return {
      subheading: sec.subheading || 'Lesson Section',
      paragraphs: newParagraphs.length > 0 ? newParagraphs : [''],
      ...(sec.table ? { table: sec.table } : {}),
    };
  });
}

export function createDocxTable(tableData: { headers: string[]; rows: string[][] }): Table {
  const headers = tableData?.headers || ['Header 1'];
  const rows = tableData?.rows || [];
  const colCount = Math.max(1, headers.length);
  const colWidth = Math.max(1, Math.floor(100 / colCount));

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (headerText) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: cleanPlainText(headerText) || '', bold: true, color: '1E293B' })],
              alignment: AlignmentType.LEFT,
            }),
          ],
          shading: { fill: 'F1F5F9' },
          width: { size: colWidth, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
            bottom: { style: BorderStyle.SINGLE, size: 2, color: '94A3B8' },
            left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
            right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
          },
        })
    ),
  });

  const bodyRows = rows.map(
    (row, rowIndex) =>
      new TableRow({
        children: headers.map((_, colIndex) => {
          const cellText = cleanPlainText(row[colIndex] || '');
          return new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: cellText, color: '334155' })],
              }),
            ],
            shading: { fill: rowIndex % 2 === 0 ? 'FFFFFF' : 'F8FAFC' },
            width: { size: colWidth, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
              left: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
              right: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
            },
          });
        }),
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
  });
}

export function buildDocxDocument(
  book: Book,
  author: Author,
  weeks: Week[],
  glossary?: GlossaryTerm[],
  theme: ExportTheme = 'academic'
): Document {
  const sectionsChildren: (Paragraph | Table)[] = [];

  let primaryColor = '0F172A';
  let accentColor = '2563EB';

  if (theme === 'minimalist') {
    primaryColor = '18181B';
    accentColor = '52525B';
  } else if (theme === 'creative') {
    primaryColor = '4F46E5';
    accentColor = '10B981';
  } else if (theme === 'modern') {
    primaryColor = '0284C7';
    accentColor = '0F766E';
  }

  const safeTitle = book?.title || 'Textbook';
  const safeSubject = book?.subject || 'General';
  const safeClass = book?.class_level || 'Grade Level';
  const safeTerm = book?.term || 'Term';
  const safeAuthorName = author?.name || 'Author Name';
  const safeCredentials = author?.credentials || 'Educator';
  const safeBio = author?.bio || 'Curriculum developer and teacher.';

  // --- COVER PAGE ---
  sectionsChildren.push(
    new Paragraph({ text: '', spacing: { before: 1200 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: safeTitle.toUpperCase(),
          bold: true,
          size: 52,
          color: '0F172A',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${safeSubject} • ${safeClass} • ${safeTerm}`,
          size: 28,
          color: '2563EB',
          bold: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 1200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Authored by',
          size: 22,
          color: '64748B',
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: safeAuthorName,
          size: 32,
          bold: true,
          color: '1E293B',
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: safeCredentials,
          size: 22,
          color: '475569',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 2000 },
    }),
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  // --- ABOUT THE AUTHOR PAGE ---
  sectionsChildren.push(
    new Paragraph({
      text: 'About the Author',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 300 },
    }),
    new Paragraph({
      children: [new TextRun({ text: safeAuthorName, bold: true, size: 28, color: '0F172A' })],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: safeCredentials, italics: true, color: '2563EB', size: 22 })],
      spacing: { after: 300 },
    }),
    new Paragraph({
      children: [new TextRun({ text: safeBio, size: 24, color: '334155' })],
      spacing: { after: 600 },
    }),
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  // --- TABLE OF CONTENTS ---
  sectionsChildren.push(
    new Paragraph({
      text: 'Table of Contents',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 400 },
    })
  );

  const safeWeeks = weeks || [];
  safeWeeks.forEach((w) => {
    sectionsChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Week ${w.week_number}: `, bold: true, color: '2563EB' }),
          new TextRun({ text: w.topic || '', bold: true, color: '0F172A' }),
        ],
        spacing: { after: 150 },
      })
    );
  });

  const safeGlossary = glossary || [];

  sectionsChildren.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  // --- WEEKS CONTENT ---
  safeWeeks.forEach((week) => {
    sectionsChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `WEEK ${week.week_number}`,
            bold: true,
            size: 20,
            color: '2563EB',
          }),
        ],
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        text: week.topic || '',
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 400 },
      })
    );

    const normSections = normalizeContentSections(week.content_json);
    normSections.forEach((sec) => {
      if (sec.subheading) {
        sectionsChildren.push(
          new Paragraph({
            text: cleanPlainText(sec.subheading),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          })
        );
      }

      if (Array.isArray(sec.paragraphs)) {
        sec.paragraphs.forEach((pText: string) => {
          const blocks = parseParagraphBlocks(pText);
          blocks.forEach((block) => {
            if (block.type === 'table') {
              sectionsChildren.push(createDocxTable(block.data));
              sectionsChildren.push(new Paragraph({ text: '', spacing: { after: 200 } }));
            } else if (block.content && block.content.trim()) {
              const segments = parseRichTextSegments(block.content);

              if (segments.length === 1 && segments[0].isDivider) {
                sectionsChildren.push(
                  new Paragraph({
                    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' } },
                    spacing: { before: 120, after: 120 },
                  })
                );
              } else {
                const textRuns = segments.map((seg) => new TextRun({
                  text: seg.text,
                  bold: !!seg.bold,
                  size: 24,
                  color: '334155',
                }));
                sectionsChildren.push(
                  new Paragraph({
                    children: textRuns,
                    spacing: { after: 200 },
                  })
                );
              }
            }
          });
        });
      }

      if (sec.table) {
        sectionsChildren.push(createDocxTable(sec.table));
        sectionsChildren.push(new Paragraph({ text: '', spacing: { after: 200 } }));
      }
    });

    sectionsChildren.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );
  });

  return new Document({
    sections: [
      {
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `${safeTitle} | Page ` }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        children: sectionsChildren,
      },
    ],
  });
}

export async function generateBookDocx(
  book: Book,
  author: Author,
  weeks: Week[],
  glossary?: GlossaryTerm[],
  theme: ExportTheme = 'academic'
): Promise<Buffer> {
  const doc = buildDocxDocument(book, author, weeks, glossary, theme);
  return await Packer.toBuffer(doc);
}

export async function generateBookDocxBlob(
  book: Book,
  author: Author,
  weeks: Week[],
  glossary?: GlossaryTerm[],
  theme: ExportTheme = 'academic'
): Promise<Blob> {
  const doc = buildDocxDocument(book, author, weeks, glossary, theme);
  return await Packer.toBlob(doc);
}
