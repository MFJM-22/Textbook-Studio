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
  const lines = text.trim().split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const tableLines = lines.filter((l) => l.startsWith('|') && (l.endsWith('|') || l.includes('|', 1)));
  if (tableLines.length < 2) return null;

  const parseRow = (line: string) => {
    let cleaned = line.trim();
    if (cleaned.startsWith('|')) cleaned = cleaned.substring(1);
    if (cleaned.endsWith('|')) cleaned = cleaned.substring(0, cleaned.length - 1);
    return cleaned.split('|').map((cell) => cell.trim());
  };

  const headers = parseRow(tableLines[0]);
  if (!headers || headers.length === 0) return null;

  const rows: string[][] = [];

  for (let i = 1; i < tableLines.length; i++) {
    const rowStr = tableLines[i];
    // skip separator row like | --- | --- |
    if (rowStr.replace(/[\s|\-:]/g, '').length === 0) continue;
    const cells = parseRow(rowStr);
    if (cells.length > 0) {
      while (cells.length < headers.length) cells.push('');
      rows.push(cells.slice(0, headers.length));
    }
  }

  if (rows.length === 0) return null;
  return { headers, rows };
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

    // 2. Group consecutive paragraph items that are table rows into single multi-line table strings
    const newParagraphs: string[] = [];
    let tableBuffer: string[] = [];

    const flushTable = () => {
      if (tableBuffer.length > 0) {
        newParagraphs.push(tableBuffer.join('\n'));
        tableBuffer = [];
      }
    };

    for (const p of paragraphs) {
      if (typeof p !== 'string') continue;
      const trimmed = p.trim();
      if (trimmed.startsWith('|') && (trimmed.endsWith('|') || trimmed.includes('|', 1))) {
        if (p.includes('\n')) {
          flushTable();
          newParagraphs.push(p);
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
  glossary: GlossaryTerm[]
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
  if (safeGlossary.length > 0) {
    sectionsChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Glossary of Key Terms`, bold: true, color: '2563EB' }),
        ],
        spacing: { before: 200, after: 150 },
      })
    );
  }

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

  // --- GLOSSARY SECTION ---
  if (safeGlossary.length > 0) {
    sectionsChildren.push(
      new Paragraph({
        text: 'Glossary',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 400 },
      })
    );

    const sortedGlossary = [...safeGlossary].sort((a, b) => (a.term || '').localeCompare(b.term || ''));

    sortedGlossary.forEach((item) => {
      sectionsChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${item.term || ''}: `, bold: true, color: '0F172A', size: 24 }),
            new TextRun({ text: item.definition || '', color: '334155', size: 24 }),
          ],
          spacing: { after: 200 },
        })
      );
    });
  }

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
  glossary: GlossaryTerm[]
): Promise<Buffer> {
  const doc = buildDocxDocument(book, author, weeks, glossary);
  return await Packer.toBuffer(doc);
}

export async function generateBookDocxBlob(
  book: Book,
  author: Author,
  weeks: Week[],
  glossary: GlossaryTerm[]
): Promise<Blob> {
  const doc = buildDocxDocument(book, author, weeks, glossary);
  return await Packer.toBlob(doc);
}
