import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { generateBookDocx, normalizeContentSections } from './src/lib/docGenerator';
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
  res.json(sampleNotesData);
});

// 3. Books Management
app.get('/api/books', (req, res) => {
  // calculate updated page count
  const booksWithCounts = booksStore.map((b) => ({
    ...b,
    pages_count: pagesStore.filter((p) => p.book_id === b.id).length,
  }));
  res.json(booksWithCounts);
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
  const book = getOrCreateBook(req.params.id);

  const pages = pagesStore
    .filter((p) => p.book_id === book.id)
    .sort((a, b) => a.page_order - b.page_order);

  const weeks = weeksStore
    .filter((w) => w.book_id === book.id)
    .sort((a, b) => a.week_number - b.week_number);

  const glossary = glossaryStore.filter((g) => g.book_id === book.id);

  res.json({
    ...book,
    pages,
    weeks,
    glossary,
  });
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
      ocr_confidence: 0.95,
      status: 'processing',
      created_at: new Date().toISOString(),
    };

    pagesStore.push(pageObj);
    createdPages.push(pageObj);

    // Run Gemini OCR if image data is present and text isn't provided
    if (!pItem.raw_text && (pItem.image_data || pItem.image_url)) {
      try {
        const ai = getGenAI();
        let promptText = "Transcribe all handwritten and typed text from this lesson note page accurately. Include headings, bullet points, formulas, and any tables formatted as Markdown tables (| Col 1 | Col 2 |). Do NOT summarize or skip details.";

        let contentInput: any = promptText;

        if (pItem.image_data && pItem.image_data.startsWith('data:image')) {
          const base64Parts = pItem.image_data.split(',');
          const mimeType = base64Parts[0].match(/:(.*?);/)?.[1] || 'image/png';
          const base64Data = base64Parts[1];

          contentInput = {
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              { text: promptText },
            ],
          };
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contentInput,
        });

        pageObj.raw_ocr_text = response.text || 'Unable to extract text.';
        pageObj.ocr_confidence = 0.96;
        pageObj.status = 'completed';
      } catch (err: any) {
        console.error('OCR Error on page:', err);
        pageObj.raw_ocr_text = pItem.raw_text || 'Error during OCR transcription. You can edit this text manually.';
        pageObj.ocr_confidence = 0.70;
        pageObj.status = 'completed';
      }
    } else {
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
    page.ocr_confidence = 1.0; // human verified
    return res.json(page);
  }

  // Otherwise trigger AI OCR re-analysis
  try {
    const ai = getGenAI();
    let promptText = "Perform meticulous transcription of this note page. Extract all handwritten/typed prose, lists, equations, and tables as markdown tables.";
    
    let contentInput: any = promptText;
    if (page.image_url && page.image_url.startsWith('data:image')) {
      const base64Parts = page.image_url.split(',');
      const mimeType = base64Parts[0].match(/:(.*?);/)?.[1] || 'image/png';
      const base64Data = base64Parts[1];
      contentInput = {
        parts: [{ inlineData: { mimeType, data: base64Data } }, { text: promptText }],
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contentInput,
    });

    page.raw_ocr_text = response.text || page.raw_ocr_text;
    page.ocr_confidence = 0.98;
    res.json(page);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Re-OCR failed' });
  }
});

// 6. AI Structuring (Raw Notes -> Term/Week/Topic JSON)
app.post('/api/books/:id/structure', async (req, res) => {
  const bookId = req.params.id;
  const book = getOrCreateBook(bookId);

  const pages = pagesStore.filter((p) => p.book_id === bookId).sort((a, b) => a.page_order - b.page_order);
  const combinedRawNotes = pages.map((p, idx) => `--- PAGE ${idx + 1} ---\n${p.raw_ocr_text || ''}`).join('\n\n');

  try {
    const ai = getGenAI();

    const systemPrompt = `You are a curriculum structure AI assistant for school textbook publishing.
CRITICAL INSTRUCTIONS:
1. Only use content that is actually present in the teacher's raw notes provided below. Do NOT invent or fabricate content.
2. CRITICAL TABLE PRESERVATION: You MUST capture all tables, scientific element classifications, matrices, data columns, and tabular content from the notes! Format every table as a single Markdown table block string (| Header 1 | Header 2 |\n| --- | --- |\n| Row 1 Col 1 | Row 1 Col 2 |) inside the \`paragraphs\` array for that section. Never drop, omit, or summarize tables.

Structure the extracted notes into an array of Weeks. Each Week must have:
- week_number (number, e.g. 1, 2, 3...)
- topic (short topic name)
- content_json: array of section objects, each having:
  - subheading (string)
  - paragraphs (array of strings, including any formatted Markdown table blocks)
  - table (optional object with headers: string[], rows: string[][], if tabular data is present in notes)

Return strictly valid JSON corresponding to this schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Raw Notes Source Material:\n${combinedRawNotes}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: 'List of structured weeks extracted strictly from raw notes',
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
                    table: {
                      type: Type.OBJECT,
                      properties: {
                        headers: { type: Type.ARRAY, items: { type: Type.STRING } },
                        rows: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                          },
                        },
                      },
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

    // Clear existing weeks for book and save new AI-structured weeks
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
    res.json({ success: true, weeks: savedWeeks });
  } catch (err: any) {
    console.error('Structuring Error:', err);
    // Fallback parser if API key missing or error
    weeksStore = weeksStore.filter((w) => w.book_id !== bookId);
    const fallbackWeeks: Week[] = pages.map((p, idx) => {
      const lines = (p.raw_ocr_text || '').split('\n').filter((l) => l.trim().length > 0);
      const topicLine = lines.find((l) => l.toLowerCase().includes('week') || l.toLowerCase().includes('topic')) || `Lesson Note Part ${idx + 1}`;
      
      const rawSections = [
        {
          subheading: 'Main Lesson Content',
          paragraphs: lines.length > 0 ? lines : ['No raw text captured for this page.'],
        },
      ];
      const normalizedSections = normalizeContentSections(rawSections);

      const wObj: Week = {
        id: `w-fb-${Date.now()}-${idx + 1}`,
        book_id: bookId,
        week_number: idx + 1,
        topic: topicLine.replace(/^WEEK \d+:?/i, '').trim() || `Topic ${idx + 1}`,
        content_json: normalizedSections,
        created_at: new Date().toISOString(),
      };
      weeksStore.push(wObj);
      return wObj;
    });

    book.status = 'awaiting_review';
    res.json({ success: true, weeks: fallbackWeeks, fallback: true });
  }
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
