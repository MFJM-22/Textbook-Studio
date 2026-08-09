import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { generateBookDocx, normalizeContentSections } from './src/lib/docGenerator';
import { generateBookPdf } from './src/lib/pdfGenerator';
import { Author, Book, Page, Week, GlossaryTerm, SampleNote } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Increase payload limit for base64 scanned document images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy Gemini SDK Initialization
let genAIInstance: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not set. AI functions will return fallback mock structuring if key is missing.");
    }
    genAIInstance = new GoogleGenAI({
      apiKey: key || 'dummy-key',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIInstance;
}

// In-Memory Database Store
let currentAuthor: Author = {
  id: 'author-1',
  name: '',
  credentials: '',
  bio: '',
  photo_url: '',
  created_at: new Date().toISOString(),
};

const sampleNotesData: SampleNote[] = [];

let booksStore: Book[] = [];
let pagesStore: Page[] = [];
let weeksStore: Week[] = [];
let glossaryStore: GlossaryTerm[] = [];

// Helper to retrieve or lazily create a book in memory so endpoints never return 404 for dynamic IDs
function getOrCreateBook(id: string, meta?: Partial<Book>): Book {
  let book = booksStore.find((b) => b.id === id);
  if (!book) {
    book = {
      id,
      author_id: currentAuthor.id,
      title: meta?.title || 'Integrated Science Textbook',
      subject: meta?.subject || 'Science',
      class_level: meta?.class_level || 'JSS 2',
      term: meta?.term || '1st Term',
      status: meta?.status || 'uploading',
      created_at: new Date().toISOString(),
      pages_count: 0,
    };
    booksStore.unshift(book);
  }
  return book;
}

// Helper to run Gemini Vision OCR on base64 data or HTTP image URL
async function extractTextFromImageWithGemini(imgSrc: string, promptText: string): Promise<string> {
  if (!imgSrc) return '';
  const ai = getGenAI();
  let mimeType = 'image/jpeg';
  let base64Data = '';

  if (imgSrc.startsWith('data:image')) {
    const base64Parts = imgSrc.split(',');
    mimeType = base64Parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    base64Data = base64Parts[1];
  } else if (imgSrc.startsWith('http://') || imgSrc.startsWith('https://')) {
    try {
      const response = await fetch(imgSrc);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        base64Data = Buffer.from(arrayBuffer).toString('base64');
        const contentType = response.headers.get('content-type');
        if (contentType) mimeType = contentType.split(';')[0];
      }
    } catch (err) {
      console.warn('Failed to fetch image URL for Gemini OCR:', err);
    }
  }

  if (!base64Data) return '';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: promptText },
          ],
        },
      ],
    });

    return (response.text || '').trim();
  } catch (err) {
    console.error('Gemini Vision OCR API Error:', err);
    return '';
  }
}

// Helper for clean fallback text if OCR extraction returns empty
function getCleanFallbackText(subject: string, pageNum: number): string {
  return `Scanned page ${pageNum} for ${subject || 'lesson notes'}. Edit text or re-run OCR if needed.`;
}

// --- API ENDPOINTS ---

// 1. Author Profile
app.get('/api/author', (req, res) => {
  res.json(currentAuthor);
});

app.put('/api/author', (req, res) => {
  const { name, credentials, bio, photo_url } = req.body;
  if (name) currentAuthor.name = name;
  if (credentials) currentAuthor.credentials = credentials;
  if (bio) currentAuthor.bio = bio;
  if (photo_url) currentAuthor.photo_url = photo_url;
  res.json(currentAuthor);
});

// 2. Sample Notes for quick testing
app.get('/api/sample-notes', (req, res) => {
  try {
    res.json(sampleNotesData || []);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch sample notes' });
  }
});

// 3. Books Management
app.get('/api/books', (req, res) => {
  try {
    const booksWithCounts = (booksStore || []).map((b) => ({
      ...b,
      pages_count: (pagesStore || []).filter((p) => p.book_id === b.id).length,
    }));
    res.json(booksWithCounts);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch books' });
  }
});

app.post('/api/books', (req, res) => {
  try {
    const { id, title, subject, class_level, term, sample_id } = req.body || {};
    const bookId = id || `book-${Date.now()}`;
    const newBook: Book = {
      id: bookId,
      author_id: currentAuthor.id,
      title: title || `${subject || 'General'} Textbook`,
      subject: subject || 'Science',
      class_level: class_level || 'Grade 9',
      term: term || '1st Term',
      status: 'uploading',
      created_at: new Date().toISOString(),
      pages_count: 0,
    };

    // Replace if exists or unshift
    const existingIndex = booksStore.findIndex((b) => b.id === bookId);
    if (existingIndex >= 0) {
      booksStore[existingIndex] = newBook;
    } else {
      booksStore.unshift(newBook);
    }

    // If created from sample notes dataset
    if (sample_id && Array.isArray(sampleNotesData)) {
      const sample = sampleNotesData.find((s) => s.id === sample_id);
      if (sample) {
        sample.sample_pages.forEach((sp, idx) => {
          pagesStore.push({
            id: `p-${Date.now()}-${idx}`,
            book_id: newBook.id,
            page_order: sp.page_order,
            image_url: sp.image_url,
            raw_ocr_text: sp.raw_text,
            ocr_confidence: 0.98,
            status: 'completed',
            created_at: new Date().toISOString(),
          });
        });
        newBook.status = 'ocr_processing';
      }
    }

    res.status(201).json(newBook);
  } catch (err: any) {
    console.error('Error in POST /api/books:', err);
    res.status(500).json({ error: err?.message || 'Failed to create book' });
  }
});

app.get('/api/books/:id', (req, res) => {
  try {
    const book = getOrCreateBook(req.params.id);

    const pages = (pagesStore || [])
      .filter((p) => p.book_id === book.id)
      .sort((a, b) => a.page_order - b.page_order);

    const weeks = (weeksStore || [])
      .filter((w) => w.book_id === book.id)
      .sort((a, b) => a.week_number - b.week_number);

    const glossary = (glossaryStore || []).filter((g) => g.book_id === book.id);

    res.json({
      ...book,
      pages,
      weeks,
      glossary,
    });
  } catch (err: any) {
    console.error(`Error in GET /api/books/${req.params.id}:`, err);
    res.status(500).json({ error: err?.message || 'Failed to fetch book' });
  }
});

app.delete('/api/books/:id', (req, res) => {
  const bookId = req.params.id;
  booksStore = booksStore.filter((b) => b.id !== bookId);
  pagesStore = pagesStore.filter((p) => p.book_id !== bookId);
  weeksStore = weeksStore.filter((w) => w.book_id !== bookId);
  glossaryStore = glossaryStore.filter((g) => g.book_id !== bookId);
  res.json({ success: true });
});

// 4. Upload Scanned Pages / Handwritten Notes + OCR via Gemini
app.post('/api/books/:id/upload-pages', async (req, res) => {
  const bookId = req.params.id;
  const book = getOrCreateBook(bookId);

  const { pages } = req.body as { pages: { image_data?: string; image_url?: string; raw_text?: string }[] };
  if (!Array.isArray(pages) || pages.length === 0) {
    return res.status(400).json({ error: 'No pages provided' });
  }

  book.status = 'ocr_processing';

  const existingPages = pagesStore.filter((p) => p.book_id === bookId);
  let startOrder = existingPages.length + 1;

  const createdPages: Page[] = [];

  for (const pItem of pages) {
    const pageId = `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const pageObj: Page = {
      id: pageId,
      book_id: bookId,
      page_order: startOrder++,
      image_url: pItem.image_url || pItem.image_data || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
      raw_ocr_text: pItem.raw_text || '',
      ocr_confidence: 0.10,
      status: 'processing',
      created_at: new Date().toISOString(),
    };

    pagesStore.push(pageObj);
    createdPages.push(pageObj);

    // Run Gemini OCR if image data is present and text isn't provided
    const imgSrc = pItem.image_data || pItem.image_url || '';
    if (!pItem.raw_text && imgSrc) {
      try {
        const promptText = `Examine this scanned image of handwritten/typed teacher lesson notes carefully.
Transcribe all text from the page with extreme accuracy:
- Include all headings, titles, subheadings, dates, topics, and week numbers
- Transcribe all paragraphs, lists, equations, chemical symbols, and handwritten definitions
- Format ALL tables as Markdown tables (| Header 1 | Header 2 |\n| --- | --- |\n| Row 1 | Row 2 |)
- Extract ONLY what is visible in the image. Do NOT summarize or invent text.`;

        const extractedText = await extractTextFromImageWithGemini(imgSrc, promptText);

        if (extractedText && extractedText.length > 5) {
          pageObj.raw_ocr_text = extractedText;
          pageObj.ocr_confidence = 0.96;
        } else {
          pageObj.raw_ocr_text = pItem.raw_text || getCleanFallbackText(book.subject, pageObj.page_order);
          pageObj.ocr_confidence = 0.10; // Low confidence for fallback text
        }
        pageObj.status = 'completed';
      } catch (err: any) {
        console.error('OCR Error on page:', err);
        pageObj.raw_ocr_text = pItem.raw_text || getCleanFallbackText(book.subject, pageObj.page_order);
        pageObj.ocr_confidence = 0.10;
        pageObj.status = 'completed';
      }
    } else if (!pageObj.raw_ocr_text) {
      pageObj.raw_ocr_text = getCleanFallbackText(book.subject, pageObj.page_order);
      pageObj.ocr_confidence = 0.10;
      pageObj.status = 'completed';
    } else {
      pageObj.ocr_confidence = 1.0; // User provided raw_text explicitly
      pageObj.status = 'completed';
    }
  }

  res.json({ success: true, pages: createdPages });
});

// 5. Re-run OCR on specific page
app.post('/api/books/:id/re-ocr-page', async (req, res) => {
  const { page_id, updated_text } = req.body;
  const page = pagesStore.find((p) => p.id === page_id);
  if (!page) return res.status(404).json({ error: 'Page not found' });

  if (updated_text !== undefined) {
    page.raw_ocr_text = updated_text;
    page.ocr_confidence = 1.0; // human verified 100% match
    return res.json(page);
  }

  // Otherwise trigger AI OCR re-analysis
  try {
    const book = getOrCreateBook(req.params.id);
    const promptText = `Perform meticulous transcription of this handwritten/typed note page image.
Extract all headings, prose, lists, equations, chemical symbols, and tables as markdown tables (| Col 1 | Col 2 |).`;

    const extractedText = await extractTextFromImageWithGemini(page.image_url, promptText);

    if (extractedText && extractedText.length > 5) {
      page.raw_ocr_text = extractedText;
      page.ocr_confidence = 0.98;
    } else {
      page.raw_ocr_text = page.raw_ocr_text || getCleanFallbackText(book.subject, page.page_order);
      page.ocr_confidence = 0.10;
    }
    res.json(page);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Re-OCR failed' });
  }
});

// 6. AI Structuring (Raw Notes -> Term/Week/Topic JSON)
app.post('/api/books/:id/structure', async (req, res) => {
  const bookId = req.params.id;
  const book = getOrCreateBook(bookId);

  let pages = pagesStore.filter((p) => p.book_id === bookId).sort((a, b) => a.page_order - b.page_order);
  if (req.body && Array.isArray(req.body.pages) && req.body.pages.length > 0) {
    pages = req.body.pages;
    for (const p of pages) {
      const existingIdx = pagesStore.findIndex((ps) => ps.id === p.id);
      if (existingIdx >= 0) {
        pagesStore[existingIdx] = p;
      } else {
        pagesStore.push(p);
      }
    }
  }

  const contentsInput: any[] = [];
  let promptTextBuffer = `Book Title: ${book.title}\nSubject: ${book.subject || 'Science'}\nClass Level: ${book.class_level || 'JSS 2'}\n\n`;

  pages.forEach((p, idx) => {
    const imgSrc = p.image_url || (p as any).image_data || '';
    if (imgSrc.startsWith('data:image')) {
      const parts = imgSrc.split(',');
      const mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const base64Data = parts[1];
      contentsInput.push({
        inlineData: { mimeType, data: base64Data }
      });
    }
    promptTextBuffer += `--- PAGE ${idx + 1} ---\n${p.raw_ocr_text || ''}\n\n`;
  });

  contentsInput.push({
    text: `${promptTextBuffer}\nExamine the attached scanned note page images and transcribed text above. Extract and structure ONLY the handwritten/typed lesson content present in the uploaded material into week curriculum units. Preserve all tables as Markdown tables (| Col 1 | Col 2 |). DO NOT fabricate or generate unrequested extra weeks.`
  });

  try {
    const ai = getGenAI();

    const systemPrompt = `You are a curriculum structure AI assistant for school textbook publishing.
CRITICAL MANDATES:
1. STRICT ADHERENCE TO SOURCE MATERIAL: Rely ONLY on the provided notes and scanned page images. Transcribe and structure ONLY the content that actually appears in the input.
2. NO FABRICATION / NO EXPANSION: Do NOT invent, hallucinate, or fabricate any extra lessons, topics, formulas, or weeks that are not present in the user's uploaded material.
3. EXACT WEEK COUNT: If the uploaded material only covers 1 week (e.g. Week 1), return EXACTLY 1 week in the output array. Do NOT extrapolate or generate extra weeks up to Week 12.
4. TABLE PRESERVATION: Capture all tables and tabular data as Markdown tables (| Header 1 | Header 2 |\n| --- | --- |\n| Row 1 | Row 2 |).
5. Keep all lesson content detailed and organized under subheadings based strictly on the source text.

Structure the extracted notes into an array of Weeks. Each Week must have:
- week_number (number, e.g. 1, 2, 3...)
- topic (short topic name extracted directly from the notes)
- content_json: array of section objects, each having:
  - subheading (string)
  - paragraphs (array of strings, including any formatted Markdown table blocks)

Return strictly valid JSON corresponding to this schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contentsInput,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: 'List of structured weeks extracted from raw notes',
          items: {
            type: Type.OBJECT,
            properties: {
              week_number: { type: Type.INTEGER },
              topic: { type: Type.STRING },
              content_json: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    subheading: { type: Type.STRING },
                    paragraphs: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ['subheading', 'paragraphs'],
                },
              },
            },
            required: ['week_number', 'topic', 'content_json'],
          },
        },
      },
    });

    const parsedWeeks = JSON.parse(response.text || '[]');

    if (Array.isArray(parsedWeeks) && parsedWeeks.length > 0) {
      weeksStore = weeksStore.filter((w) => w.book_id !== bookId);

      const savedWeeks: Week[] = parsedWeeks.map((pw: any, idx: number) => {
        const normalizedSections = normalizeContentSections(pw.content_json || []);
        const weekObj: Week = {
          id: `w-${Date.now()}-${idx + 1}`,
          book_id: bookId,
          week_number: pw.week_number || idx + 1,
          topic: pw.topic || `Topic ${idx + 1}`,
          content_json: normalizedSections,
          created_at: new Date().toISOString(),
        };
        weeksStore.push(weekObj);
        return weekObj;
      });

      book.status = 'awaiting_review';
      return res.json({ success: true, weeks: savedWeeks });
    }
  } catch (err: any) {
    console.error('Structuring AI Error:', err);
  }

  // Fallback Structuring: Guarantee structured weeks matching actual week content
  weeksStore = weeksStore.filter((w) => w.book_id !== bookId);
  const effectivePages = pages.length > 0 ? pages : [
    {
      id: `p-def-${Date.now()}`,
      book_id: bookId,
      page_order: 1,
      image_url: '',
      raw_ocr_text: `${book.title}\n${book.subject || 'Subject Notes'}\n\nKey Lesson Outline & Topics`,
      ocr_confidence: 0.95,
      status: 'completed',
      created_at: new Date().toISOString(),
    }
  ];

  // Group pages by explicitly stated week numbers (e.g., "Week 1", "Week 2")
  // If no multiple week markers exist, group all pages into a single Week 1
  const weekMap = new Map<number, { topic: string; pageTexts: string[] }>();

  effectivePages.forEach((p, idx) => {
    const rawText = (p.raw_ocr_text || '').trim();
    const weekMatch = rawText.match(/\bWEEK\s*(\d+)/i);
    const weekNum = weekMatch ? parseInt(weekMatch[1], 10) : 1;

    if (!weekMap.has(weekNum)) {
      const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      let topicCandidate = `${book.subject || 'Lesson Unit'}`;
      if (lines.length > 0) {
        const found = lines.find((l) => /^week|\btopic\b/i.test(l)) || lines[0];
        if (found && !found.startsWith('|')) {
          topicCandidate = found.replace(/^[#\s*]+/, '').replace(/^WEEK \d+:?/i, '').replace(/^TOPIC:?/i, '').trim() || topicCandidate;
        }
      }
      weekMap.set(weekNum, { topic: topicCandidate, pageTexts: [] });
    }
    weekMap.get(weekNum)!.pageTexts.push(rawText);
  });

  const fallbackWeeks: Week[] = Array.from(weekMap.entries()).map(([weekNum, data], idx) => {
    const combinedText = data.pageTexts.join('\n\n');
    const lines = combinedText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

    const sections: { subheading: string; paragraphs: string[] }[] = [];
    let currentSubheading = 'Lesson Content & Core Notes';
    let currentParagraphs: string[] = [];
    let tableBuffer: string[] = [];

    const flushTable = () => {
      if (tableBuffer.length > 0) {
        currentParagraphs.push(tableBuffer.join('\n'));
        tableBuffer = [];
      }
    };

    const flushSection = () => {
      flushTable();
      if (currentParagraphs.length > 0) {
        sections.push({
          subheading: currentSubheading,
          paragraphs: [...currentParagraphs],
        });
        currentParagraphs = [];
      }
    };

    for (const line of lines) {
      if (line.startsWith('|') && (line.endsWith('|') || line.includes('|', 1))) {
        tableBuffer.push(line);
        continue;
      }

      flushTable();

      if (line.startsWith('#') || line.startsWith('WEEK') || line.startsWith('TOPIC:') || line.startsWith('SECTION:') || (line.endsWith(':') && line.length < 60)) {
        if (currentParagraphs.length > 0) {
          flushSection();
        }
        const subCandidate = line.replace(/^[#\s*]+/, '').replace(/^WEEK \d+:?/i, '').replace(/^TOPIC:?/i, '').replace(/^SECTION:?/i, '').trim();
        if (subCandidate) {
          currentSubheading = subCandidate;
        }
      } else {
        currentParagraphs.push(line);
      }
    }
    flushSection();

    if (sections.length === 0) {
      sections.push({
        subheading: 'Lesson Notes',
        paragraphs: lines.length > 0 ? lines : ['No text content transcribed for this page.'],
      });
    }

    const normalizedSections = normalizeContentSections(sections);

    const wObj: Week = {
      id: `w-fb-${Date.now()}-${idx + 1}`,
      book_id: bookId,
      week_number: weekNum,
      topic: data.topic || `Week ${weekNum} Unit`,
      content_json: normalizedSections,
      created_at: new Date().toISOString(),
    };
    weeksStore.push(wObj);
    return wObj;
  });

  book.status = 'awaiting_review';
  return res.json({ success: true, weeks: fallbackWeeks, fallback: true });
});

// 7. Save Human Review Edits for Weeks
app.put('/api/books/:id/weeks', (req, res) => {
  const bookId = req.params.id;
  const { weeks } = req.body as { weeks: Week[] };

  if (!Array.isArray(weeks)) return res.status(400).json({ error: 'Weeks array required' });

  // Update store for book
  weeksStore = weeksStore.filter((w) => w.book_id !== bookId);
  weeks.forEach((w, index) => {
    weeksStore.push({
      ...w,
      book_id: bookId,
      week_number: index + 1, // ensure reordered sequential numbering
      id: w.id || `w-${Date.now()}-${index}`,
      content_json: normalizeContentSections(w.content_json || []),
      created_at: w.created_at || new Date().toISOString(),
    });
  });

  const updatedWeeks = weeksStore.filter((w) => w.book_id === bookId).sort((a, b) => a.week_number - b.week_number);
  res.json({ success: true, weeks: updatedWeeks });
});

// 8. Human Review Approval Gate & Glossary Generation
app.post('/api/books/:id/approve-structure', async (req, res) => {
  const bookId = req.params.id;
  const book = getOrCreateBook(bookId);

  book.status = 'reviewed';

  const bookWeeks = weeksStore.filter((w) => w.book_id === bookId);
  const textContent = bookWeeks
    .map((w) => `Week ${w.week_number}: ${w.topic}\n` + w.content_json.map((c) => `${c.subheading}\n${c.paragraphs.join(' ')}`).join('\n'))
    .join('\n\n');

  // Generate Glossary automatically
  try {
    const ai = getGenAI();
    const prompt = `Extract a list of 5 to 15 key technical terms, vocabulary words, and concepts with clear concise definitions from the following textbook material:\n\n${textContent}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              term: { type: Type.STRING },
              definition: { type: Type.STRING },
            },
            required: ['term', 'definition'],
          },
        },
      },
    });

    const parsedGlossary = JSON.parse(response.text || '[]');
    glossaryStore = glossaryStore.filter((g) => g.book_id !== bookId);

    parsedGlossary.forEach((item: any, idx: number) => {
      glossaryStore.push({
        id: `g-${Date.now()}-${idx}`,
        book_id: bookId,
        term: item.term,
        definition: item.definition,
      });
    });

    res.json({
      success: true,
      status: book.status,
      glossary: glossaryStore.filter((g) => g.book_id === bookId),
    });
  } catch (err: any) {
    console.error('Glossary Generation Error:', err);
    res.json({
      success: true,
      status: book.status,
      glossary: glossaryStore.filter((g) => g.book_id === bookId),
    });
  }
});

// 9. Glossary Management Endpoints
app.get('/api/books/:id/glossary', (req, res) => {
  const terms = glossaryStore.filter((g) => g.book_id === req.params.id);
  res.json(terms);
});

app.post('/api/books/:id/glossary', (req, res) => {
  const bookId = req.params.id;
  const { term, definition } = req.body;
  if (!term || !definition) return res.status(400).json({ error: 'Term and definition required' });

  const newTerm: GlossaryTerm = {
    id: `g-${Date.now()}`,
    book_id: bookId,
    term,
    definition,
  };
  glossaryStore.push(newTerm);
  res.status(201).json(newTerm);
});

app.put('/api/books/:id/glossary/:termId', (req, res) => {
  const { termId } = req.params;
  const { term, definition } = req.body;
  const item = glossaryStore.find((g) => g.id === termId);
  if (!item) return res.status(404).json({ error: 'Term not found' });

  if (term) item.term = term;
  if (definition) item.definition = definition;
  res.json(item);
});

app.delete('/api/books/:id/glossary/:termId', (req, res) => {
  const { termId } = req.params;
  glossaryStore = glossaryStore.filter((g) => g.id !== termId);
  res.json({ success: true });
});

// 10. Generate DOCX Export Endpoint
app.post('/api/books/:id/generate-docx', async (req, res) => {
  const bookId = req.params.id;
  const book = getOrCreateBook(bookId);

  let weeks = weeksStore.filter((w) => w.book_id === bookId).sort((a, b) => a.week_number - b.week_number);
  const glossary = glossaryStore.filter((g) => g.book_id === bookId);

  // If no weeks exist yet, auto-generate default lesson units from pages or fallback
  if (weeks.length === 0) {
    const pages = pagesStore.filter((p) => p.book_id === bookId);
    if (pages.length > 0) {
      weeks = pages.map((p, idx) => ({
        id: `w-auto-${Date.now()}-${idx + 1}`,
        book_id: bookId,
        week_number: idx + 1,
        topic: `Unit ${idx + 1}: Lesson Overview`,
        content_json: normalizeContentSections([
          {
            subheading: `Lesson Summary (Page ${p.page_order})`,
            paragraphs: (p.raw_ocr_text || 'Core lesson material.').split('\n').filter((l) => l.trim().length > 0),
          },
        ]),
        created_at: new Date().toISOString(),
      }));
    } else {
      weeks = [
        {
          id: `w-default-${Date.now()}-1`,
          book_id: bookId,
          week_number: 1,
          topic: `Week 1: Introduction to ${book.subject}`,
          content_json: normalizeContentSections([
            {
              subheading: 'Fundamental Concepts & Curriculum Overview',
              paragraphs: [
                `Welcome to ${book.title} (${book.class_level}, ${book.term}).`,
                'This textbook module includes core curriculum units, structured table visualizations, and key terms glossary.',
              ],
            },
          ]),
          created_at: new Date().toISOString(),
        },
      ];
    }
    // Save to store
    weeks.forEach((w) => weeksStore.push(w));
  }

  try {
    const docBuffer = await generateBookDocx(book, currentAuthor, weeks, glossary);

    book.status = 'generated';

    const sanitizeFilename = (book.title || 'Textbook').replace(/[^a-zA-Z0-9_\-]/g, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename}.docx"`);
    res.send(docBuffer);
  } catch (err: any) {
    console.error('Docx Export Failure:', err);
    res.status(500).json({ error: 'Failed to generate Word document' });
  }
});

// 11. Generate PDF Export Endpoint
app.post('/api/books/:id/generate-pdf', async (req, res) => {
  const bookId = req.params.id;
  const book = getOrCreateBook(bookId);

  let weeks = weeksStore.filter((w) => w.book_id === bookId).sort((a, b) => a.week_number - b.week_number);
  const glossary = glossaryStore.filter((g) => g.book_id === bookId);

  // If no weeks exist yet, auto-generate default lesson units from pages or fallback
  if (weeks.length === 0) {
    const pages = pagesStore.filter((p) => p.book_id === bookId);
    if (pages.length > 0) {
      weeks = pages.map((p, idx) => ({
        id: `w-auto-${Date.now()}-${idx + 1}`,
        book_id: bookId,
        week_number: idx + 1,
        topic: `Unit ${idx + 1}: Lesson Overview`,
        content_json: normalizeContentSections([
          {
            subheading: `Lesson Summary (Page ${p.page_order})`,
            paragraphs: (p.raw_ocr_text || 'Core lesson material.').split('\n').filter((l) => l.trim().length > 0),
          },
        ]),
        created_at: new Date().toISOString(),
      }));
    } else {
      weeks = [
        {
          id: `w-default-${Date.now()}-1`,
          book_id: bookId,
          week_number: 1,
          topic: `Week 1: Introduction to ${book.subject}`,
          content_json: normalizeContentSections([
            {
              subheading: 'Fundamental Concepts & Curriculum Overview',
              paragraphs: [
                `Welcome to ${book.title} (${book.class_level}, ${book.term}).`,
                'This textbook module includes core curriculum units, structured table visualizations, and key terms glossary.',
              ],
            },
          ]),
          created_at: new Date().toISOString(),
        },
      ];
    }
    // Save to store
    weeks.forEach((w) => weeksStore.push(w));
  }

  try {
    const pdfBuffer = await generateBookPdf(book, currentAuthor, weeks, glossary);

    book.status = 'generated';

    const sanitizeFilename = (book.title || 'Textbook').replace(/[^a-zA-Z0-9_\-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    console.error('PDF Export Failure:', err);
    res.status(500).json({ error: 'Failed to generate PDF document' });
  }
});

// Global API Error Handler Middleware (prevents HTML 500 responses)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled API Error:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: err?.message || 'An internal server error occurred' });
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Textbook Studio server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
