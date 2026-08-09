import { jsPDF } from 'jspdf';
import { Author, Book, Week, GlossaryTerm } from '../types';
import { parseMarkdownTable, normalizeContentSections } from './docGenerator';

export function buildJsPdfDoc(
  book: Book,
  author: Author,
  weeks: Week[],
  glossary?: GlossaryTerm[]
): jsPDF {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight; // 170mm
  const marginTop = 20;
  const marginBottom = 20;
  const maxY = pageHeight - marginBottom;

  let currentY = marginTop;

  const safeTitle = book?.title || 'Textbook';
  const safeSubject = book?.subject || 'General';
  const safeClass = book?.class_level || 'Grade Level';
  const safeTerm = book?.term || 'Term';
  const safeAuthorName = author?.name || 'Author Name';
  const safeCredentials = author?.credentials || 'Educator';
  const safeBio = author?.bio || 'Curriculum developer and teacher.';

  // Helper to add footer and header to current page
  const addPageHeaderAndFooter = (pageNum: number, totalPages?: number) => {
    // Header (skip on cover page page 1)
    if (pageNum > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(`${safeTitle} • ${safeSubject}`, marginLeft, 12);
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setLineWidth(0.2);
      doc.line(marginLeft, 14, pageWidth - marginRight, 14);
    }

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(marginLeft, pageHeight - 14, pageWidth - marginRight, pageHeight - 14);

    doc.text('Textbook Studio AI', marginLeft, pageHeight - 9);
    const pageStr = totalPages ? `Page ${pageNum} of ${totalPages}` : `Page ${pageNum}`;
    doc.text(pageStr, pageWidth - marginRight, pageHeight - 9, { align: 'right' });
  };

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > maxY) {
      doc.addPage();
      currentY = marginTop + 5;
    }
  };

  // --- 1. COVER PAGE ---
  doc.setFillColor(15, 23, 42); // Dark slate bg for accent bar or clean white cover
  doc.rect(0, 0, pageWidth, 12, 'F');

  // Top Pill Badge
  doc.setFillColor(239, 246, 255); // Blue 50
  doc.setDrawColor(191, 219, 254); // Blue 200
  doc.roundedRect(marginLeft, 30, contentWidth, 10, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(37, 99, 235); // Blue 600
  doc.text(`${safeSubject.toUpperCase()} • ${safeClass.toUpperCase()} • ${safeTerm.toUpperCase()}`, pageWidth / 2, 36.5, {
    align: 'center',
  });

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(safeTitle, contentWidth);
  doc.text(titleLines, pageWidth / 2, 60, { align: 'center' });

  let yPos = 60 + titleLines.length * 10;

  // Accent line
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1.2);
  doc.line((pageWidth - 40) / 2, yPos, (pageWidth + 40) / 2, yPos);

  yPos += 12;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text('Curriculum Textbook & Study Guide', pageWidth / 2, yPos, { align: 'center' });

  // Author Box at bottom of cover
  yPos = 210;
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginLeft + 20, yPos, contentWidth - 40, 45, 3, 3, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('AUTHORED BY', pageWidth / 2, yPos + 12, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(safeAuthorName, pageWidth / 2, yPos + 22, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(safeCredentials, pageWidth / 2, yPos + 32, { align: 'center' });

  // --- 2. ABOUT THE AUTHOR PAGE ---
  doc.addPage();
  currentY = marginTop + 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('About the Author', marginLeft, currentY);
  currentY += 4;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);
  currentY += 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(safeAuthorName, marginLeft, currentY);
  currentY += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(37, 99, 235);
  doc.text(safeCredentials, marginLeft, currentY);
  currentY += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  const bioLines = doc.splitTextToSize(safeBio, contentWidth);
  doc.text(bioLines, marginLeft, currentY);
  currentY += bioLines.length * 5.5 + 15;

  // --- 3. TABLE OF CONTENTS PAGE ---
  checkPageBreak(50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('Table of Contents', marginLeft, currentY);
  currentY += 4;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);
  currentY += 12;

  const safeWeeks = weeks || [];
  safeWeeks.forEach((w) => {
    checkPageBreak(12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(37, 99, 235);
    const weekLabel = `Week ${w.week_number}: `;
    doc.text(weekLabel, marginLeft, currentY);

    const offset = doc.getTextWidth(weekLabel);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const topicText = w.topic || 'Curriculum Unit';
    const availWidth = contentWidth - offset - 15;
    const truncatedTopic = doc.splitTextToSize(topicText, availWidth)[0] || topicText;
    doc.text(truncatedTopic, marginLeft + offset, currentY);

    // Dotted line & Page number
    const startDotsX = marginLeft + offset + doc.getTextWidth(truncatedTopic) + 3;
    const endDotsX = pageWidth - marginRight - 18;
    if (endDotsX > startDotsX + 5) {
      doc.setDrawColor(203, 213, 225); // Slate 300
      doc.setLineWidth(0.3);
      doc.line(startDotsX, currentY - 0.5, endDotsX, currentY - 0.5);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${w.week_number + 3}`, pageWidth - marginRight, currentY, { align: 'right' });

    currentY += 8;
  });

  // --- 4. WEEKLY MODULES ---
  safeWeeks.forEach((week) => {
    doc.addPage();
    currentY = marginTop + 5;

    // Week badge header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(37, 99, 235);
    doc.text(`WEEK ${week.week_number}`, marginLeft, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(safeSubject, pageWidth - marginRight, currentY, { align: 'right' });
    currentY += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    const topicLines = doc.splitTextToSize(week.topic || `Week ${week.week_number}`, contentWidth);
    doc.text(topicLines, marginLeft, currentY);
    currentY += topicLines.length * 7 + 2;

    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(1);
    doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);
    currentY += 10;

    const normSections = normalizeContentSections(week.content_json);
    normSections.forEach((sec) => {
      checkPageBreak(15);

      if (sec.subheading) {
        // Accent bar on left of subheading
        doc.setFillColor(37, 99, 235);
        doc.rect(marginLeft, currentY - 3.5, 2, 5.5, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        const subLines = doc.splitTextToSize(sec.subheading, contentWidth - 6);
        doc.text(subLines, marginLeft + 5, currentY);
        currentY += subLines.length * 5.5 + 4;
      }

      // Paragraphs & Markdown Tables
      if (Array.isArray(sec.paragraphs)) {
        sec.paragraphs.forEach((pText: string) => {
          const tableData = parseMarkdownTable(pText);
          if (tableData) {
            renderPdfTable(doc, tableData, marginLeft, currentY, contentWidth, (addedY) => {
              currentY = addedY;
            }, checkPageBreak);
            currentY += 6;
          } else if (pText && pText.trim()) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9.5);
            doc.setTextColor(51, 65, 85);
            const pLines = doc.splitTextToSize(pText, contentWidth);
            const pHeight = pLines.length * 5;
            checkPageBreak(pHeight + 2);
            doc.text(pLines, marginLeft, currentY);
            currentY += pHeight + 4;
          }
        });
      }
    });
  });

  // --- 5. GLOSSARY SECTION (IF PRESENT) ---
  const safeGlossary = glossary || [];
  if (safeGlossary.length > 0) {
    checkPageBreak(40);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('Key Terms & Glossary', marginLeft, currentY);
    currentY += 4;

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.8);
    doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);
    currentY += 10;

    safeGlossary.forEach((item) => {
      checkPageBreak(15);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(37, 99, 235);
      doc.text(item.term, marginLeft, currentY);
      currentY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const defLines = doc.splitTextToSize(item.definition, contentWidth - 4);
      doc.text(defLines, marginLeft + 4, currentY);
      currentY += defLines.length * 4.5 + 6;
    });
  }

  // --- PAGE NUMBERING PASS ---
  const totalPageCount = doc.getNumberOfPages();
  for (let i = 1; i <= totalPageCount; i++) {
    doc.setPage(i);
    addPageHeaderAndFooter(i, totalPageCount);
  }

  return doc;
}

export async function generateBookPdf(
  book: Book,
  author: Author,
  weeks: Week[],
  glossary?: GlossaryTerm[]
): Promise<Buffer> {
  const doc = buildJsPdfDoc(book, author, weeks, glossary);
  const pdfArrayBuffer = doc.output('arraybuffer');
  return Buffer.from(pdfArrayBuffer);
}

export function downloadBookPdfClient(
  book: Book,
  author: Author,
  weeks: Week[],
  glossary?: GlossaryTerm[]
): void {
  const doc = buildJsPdfDoc(book, author, weeks, glossary);
  const sanitizeFilename = (book.title || 'Textbook').replace(/[^a-zA-Z0-9_\-]/g, '_');
  doc.save(`${sanitizeFilename}.pdf`);
}

function renderPdfTable(
  doc: jsPDF,
  tableData: { headers: string[]; rows: string[][] },
  startX: number,
  startY: number,
  tableWidth: number,
  updateY: (newY: number) => void,
  checkBreak: (neededHeight: number) => void
) {
  const headers = tableData.headers || ['Header 1'];
  const rows = tableData.rows || [];
  const colCount = headers.length;
  const colWidth = tableWidth / colCount;

  let currY = startY;

  // Render Header Row
  checkBreak(10);
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.2);
  doc.rect(startX, currY, tableWidth, 8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  headers.forEach((h, colIdx) => {
    const x = startX + colIdx * colWidth + 2;
    const truncatedH = doc.splitTextToSize(h || '', colWidth - 4)[0] || '';
    doc.text(truncatedH, x, currY + 5.5);
  });

  currY += 8;

  // Render Body Rows
  rows.forEach((row, rowIdx) => {
    checkBreak(8);

    const bgFill = rowIdx % 2 === 0 ? 255 : 248; // Alternating white / slate-50
    doc.setFillColor(bgFill, bgFill, bgFill);
    doc.setDrawColor(226, 232, 240);
    doc.rect(startX, currY, tableWidth, 7.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    headers.forEach((_, colIdx) => {
      const cellText = row[colIdx] || '';
      const x = startX + colIdx * colWidth + 2;
      const truncatedCell = doc.splitTextToSize(cellText, colWidth - 4)[0] || cellText;
      doc.text(truncatedCell, x, currY + 5);
    });

    currY += 7.5;
  });

  updateY(currY);
}
