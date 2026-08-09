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
import { Author, Book, Week, GlossaryTerm } from '../types';

export function parseMarkdownTable(text: string): {
  headers: string[];
  rows: string[][];
} | null {
  if (!text || typeof text !== 'string') return null;

  // 1. Pre-process escaped newlines, carriage returns, and row boundary markers
  let cleanText = text
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Replace double-pipe row boundaries like "GROUP VIII || ---" or "He (2) || 2"
  cleanText = cleanText.replace(/([^|\s])\s*\|\s*\|\s*([^|\s])/g, '$1 |\n| $2');

  // Break lines before separator rows like "| --- |" if concatenated to header
  cleanText = cleanText.replace(/([^|\n])\s*(\|\s*:?---+[\s\-:|]*\|)/g, '$1\n$2');

  // Break lines after separator rows if concatenated to first data row
  cleanText = cleanText.replace(/(\|\s*:?---+[\s\-:|]*\|)\s*([^|\n])/g, '$1\n$2');

  const lines = cleanText.trim().split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  const parseRow = (line: string) => {
    let cleaned = line.trim();
    if (cleaned.startsWith('|')) cleaned = cleaned.substring(1);
    if (cleaned.endsWith('|')) cleaned = cleaned.substring(0, cleaned.length - 1);
    return cleaned.split('|').map((cell) => cell.trim());
  };

  const tableLines = lines.filter((l) => l.startsWith('|') && (l.endsWith('|') || l.includes('|', 1)));

  if (tableLines.length >= 2) {
    const headers = parseRow(tableLines[0]);
    if (headers && headers.length > 0) {
      const rows: string[][] = [];
      for (let i = 1; i < tableLines.length; i++) {
        const rowStr = tableLines[i];
        // Skip separator row like | --- | --- |
        if (rowStr.replace(/[\s|\-:]/g, '').length === 0) continue;
        const cells = parseRow(rowStr);
        if (cells.length > 0) {
          while (cells.length < headers.length) cells.push('');
          rows.push(cells.slice(0, headers.length));
        }
      }
      if (rows.length > 0) {
        return { headers, rows };
      }
    }
  }

  // 2. Fallback: single-line pipe parsing if multi-line splitting didn't yield a valid table
  const allCells = text
    .replace(/\\n/g, ' ')
    .split('|')
    .map((c) => c.trim());

  // Remove empty leading/trailing cells caused by outer '|'
  if (allCells.length > 0 && allCells[0] === '') allCells.shift();
  if (allCells.length > 0 && allCells[allCells.length - 1] === '') allCells.pop();

  if (allCells.length === 0) return null;

  // Find separator cells block
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

    // 2. Normalize paragraphs: if a paragraph is a table (even single-line), convert it to clean multi-line markdown table
    const newParagraphs: string[] = [];
    let tableBuffer: string[] = [];

    const flushTable = () => {
      if (tableBuffer.length > 0) {
        const rawTableText = tableBuffer.join('\n');
        const parsed = parseMarkdownTable(rawTableText);
        if (parsed) {
          const headerStr = `| ${parsed.headers.join(' | ')} |`;
          const sepStr = `| ${parsed.headers.map(() => '---').join(' | ')} |`;
          const rowStrs = parsed.rows.map((r) => `| ${r.join(' | ')} |`);
          newParagraphs.push([headerStr, sepStr, ...rowStrs].join('\n'));
        } else {
          newParagraphs.push(rawTableText);
        }
        tableBuffer = [];
      }
    };

    for (const p of paragraphs) {
      if (typeof p !== 'string') continue;
      const trimmed = p.trim();

      // Check if p itself is already a full single-line or multi-line table
      const directTable = parseMarkdownTable(p);
      if (directTable) {
        flushTable();
        const headerStr = `| ${directTable.headers.join(' | ')} |`;
        const sepStr = `| ${directTable.headers.map(() => '---').join(' | ')} |`;
        const rowStrs = directTable.rows.map((r) => `| ${r.join(' | ')} |`);
        newParagraphs.push([headerStr, sepStr, ...rowStrs].join('\n'));
        continue;
      }

      if (trimmed.startsWith('|') && (trimmed.endsWith('|') || trimmed.includes('|', 1))) {
        if (p.includes('\n')) {
          flushTable();
          const parsed = parseMarkdownTable(p);
          if (parsed) {
            const headerStr = `| ${parsed.headers.join(' | ')} |`;
            const sepStr = `| ${parsed.headers.map(() => '---').join(' | ')} |`;
            const rowStrs = parsed.rows.map((r) => `| ${r.join(' | ')} |`);
            newParagraphs.push([headerStr, sepStr, ...rowStrs].join('\n'));
          } else {
            newParagraphs.push(p);
          }
        } else {
          tableBuffer.push(trimmed);
        }
      } else {
        flushTable();
        if (trimmed.length > 0) {
          newParagraphs.push(p);
        }
      }
    }
    flushTable();

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
              children: [new TextRun({ text: headerText || '', bold: true, color: '1E293B' })],
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
          const cellText = row[colIndex] || '';
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
  glossary?: GlossaryTerm[]
): Document {
  const sectionsChildren: (Paragraph | Table)[] = [];

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
            text: sec.subheading,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          })
        );
      }

      if (Array.isArray(sec.paragraphs)) {
        sec.paragraphs.forEach((pText: string) => {
          const tableData = parseMarkdownTable(pText);
          if (tableData) {
            sectionsChildren.push(createDocxTable(tableData));
            sectionsChildren.push(new Paragraph({ text: '', spacing: { after: 200 } }));
          } else {
            sectionsChildren.push(
              new Paragraph({
                children: [new TextRun({ text: pText || '', size: 24, color: '334155' })],
                spacing: { after: 200 },
              })
            );
          }
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
  glossary?: GlossaryTerm[]
): Promise<Buffer> {
  const doc = buildDocxDocument(book, author, weeks, glossary);
  return await Packer.toBuffer(doc);
}

export async function generateBookDocxBlob(
  book: Book,
  author: Author,
  weeks: Week[],
  glossary?: GlossaryTerm[]
): Promise<Blob> {
  const doc = buildDocxDocument(book, author, weeks, glossary);
  return await Packer.toBlob(doc);
}
