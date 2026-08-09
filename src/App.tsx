import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Sparkles,
  BookMarked,
  User,
  Loader2,
  FileDown,
  FileText,
  Search,
  Lock,
  LogIn,
  ShieldAlert,
} from 'lucide-react';
import { Author, Book, Page, Week, GlossaryTerm } from './types';
import { Header } from './components/Header';
import { AuthorProfileModal } from './components/AuthorProfileModal';
import { BookCard } from './components/BookCard';
import { NewBookModal } from './components/NewBookModal';
import { OCRViewerModal } from './components/OCRViewerModal';
import { HumanReviewEditor } from './components/HumanReviewEditor';
import { PrintPDFPreview } from './components/PrintPDFPreview';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './components/LandingPage';
import { Footer } from './components/Footer';
import { generateBookDocxBlob } from './lib/docGenerator';
import { useAuth } from './context/AuthContext';
import {
  saveBookToFirestore,
  subscribeToBooks,
  deleteBookFromFirestore,
  savePagesToFirestore,
  fetchPagesFromFirestore,
  saveWeeksToFirestore,
  saveGlossaryToFirestore,
  fetchGlossaryFromFirestore,
  saveAuthorToFirestore,
  fetchAuthorFromFirestore,
} from './lib/firestoreService';

function getCleanFallbackText(subject: string, pageNum: number): string {
  return `Scanned page ${pageNum} for ${subject || 'lesson notes'}. Edit text or re-analyze OCR if needed.`;
}

function structurePagesIntoWeeks(pages: Page[], book: Book): Week[] {
  if (!pages || pages.length === 0) return [];

  return pages.map((p, idx) => {
    const text = (p.raw_ocr_text || '').trim();
    if (!text || text.includes('Scanned page') || text.includes('No text could be extracted')) {
      return {
        id: `w-struct-${Date.now()}-${idx + 1}`,
        book_id: book.id,
        week_number: idx + 1,
        topic: `Week ${idx + 1}: ${book.subject || 'Lesson Unit'}`,
        content_json: [
          {
            subheading: 'Lesson Content',
            paragraphs: ['Lesson notes uploaded for this unit.'],
          },
        ],
        created_at: new Date().toISOString(),
      };
    }

    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    let topic = `Week ${idx + 1}: ${book.subject || 'Lesson Unit'}`;
    if (lines.length > 0) {
      const candidate = lines.find((l) => /^week|\btopic\b/i.test(l)) || lines[0];
      if (candidate && !candidate.startsWith('|')) {
        topic = candidate.replace(/^[#\s*]+/, '').replace(/^WEEK \d+:?/i, '').replace(/^TOPIC:?/i, '').trim();
      }
    }

    const sections: { subheading: string; paragraphs: string[] }[] = [];
    let currentSubheading = 'Lesson Content & Notes';
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
        sections.push({ subheading: currentSubheading, paragraphs: [...currentParagraphs] });
        currentParagraphs = [];
      }
    };

    for (const line of lines) {
      if (line.startsWith('|') && (line.endsWith('|') || line.includes('|', 1))) {
        tableBuffer.push(line);
        continue;
      }
      flushTable();
      if (line.startsWith('#') || line.startsWith('WEEK') || line.startsWith('TOPIC:') || (line.endsWith(':') && line.length < 60)) {
        flushSection();
        const sub = line.replace(/^[#\s*]+/, '').replace(/^WEEK \d+:?/i, '').replace(/^TOPIC:?/i, '').trim();
        if (sub) currentSubheading = sub;
      } else {
        currentParagraphs.push(line);
      }
    }
    flushSection();

    if (sections.length === 0) {
      sections.push({
        subheading: 'Transcribed Lesson Notes',
        paragraphs: lines.length > 0 ? lines : ['Extracted content from scanned notes.'],
      });
    }

    return {
      id: `w-struct-${Date.now()}-${idx + 1}`,
      book_id: book.id,
      week_number: idx + 1,
      topic: topic || `Week ${idx + 1} Unit`,
      content_json: sections,
      created_at: new Date().toISOString(),
    };
  });
}

function generateClientSideGlossary(weeks: Week[]): GlossaryTerm[] {
  const termsMap = new Map<string, string>();

  weeks.forEach((w) => {
    if (w.topic) {
      const parts = w.topic.split(':');
      const termName = (parts[1] || parts[0]).trim();
      if (termName && termName.length > 3 && termName.length < 50) {
        termsMap.set(termName, `Core concept covered in Week ${w.week_number} curriculum.`);
      }
    }
    w.content_json?.forEach((sec) => {
      if (sec.subheading && sec.subheading.length > 3 && sec.subheading.length < 50) {
        termsMap.set(sec.subheading, `Curriculum section topic under ${w.topic || 'unit'}.`);
      }
      sec.paragraphs?.forEach((para) => {
        if (para.includes('|')) {
          const lines = para.split('\n');
          lines.forEach((l) => {
            if (l.startsWith('|') && !l.includes('---')) {
              const cells = l.split('|').map((c) => c.trim()).filter(Boolean);
              if (
                cells.length >= 2 &&
                cells[0].toLowerCase() !== 'no.' &&
                cells[0].toLowerCase() !== 'header 1' &&
                cells[0].toLowerCase() !== 'item'
              ) {
                const term = cells[1] || cells[0];
                const def = cells[2] || cells[1] || `Tabular element in lesson notes.`;
                if (term && term.length > 1 && term.length < 40) {
                  termsMap.set(term, def);
                }
              }
            }
          });
        }
      });
    });
  });

  if (termsMap.size === 0) {
    termsMap.set('Curriculum Framework', 'Organized scope and sequence for week-by-week teaching units.');
    termsMap.set('Learning Outcome', 'Specific skills and knowledge students acquire upon completion of the unit.');
    termsMap.set('Tabular Data', 'Structured lesson information formatted as rows and columns for fast reference.');
  }

  const glossary: GlossaryTerm[] = [];
  let index = 1;
  termsMap.forEach((def, t) => {
    glossary.push({
      id: `g-auto-${Date.now()}-${index++}`,
      book_id: weeks[0]?.book_id || 'book-1',
      term: t,
      definition: def,
    });
  });
  return glossary.slice(0, 15);
}

export default function App() {
  const { currentUser } = useAuth();
  const [author, setAuthor] = useState<Author | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);

  // Navigation state
  const [currentView, setCurrentView] = useState<
    'dashboard' | 'ocr' | 'review' | 'print'
  >('dashboard');
  const [showLandingPage, setShowLandingPage] = useState<boolean>(true);

  // Modals state
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [isNewBookModalOpen, setIsNewBookModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Initial load author info
  useEffect(() => {
    loadAuthor();
  }, []);

  // Subscribe to user-specific books from Firestore whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      setIsLoading(true);
      setShowLandingPage(false);
      const unsubscribe = subscribeToBooks(currentUser.uid, (userBooks) => {
        setBooks(userBooks);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      // If not logged in (signed out), return to landing page
      setShowLandingPage(true);
      loadFallbackBooks();
    }
  }, [currentUser]);

  const defaultAuthor: Author = {
    id: 'author-1',
    name: '',
    credentials: '',
    bio: '',
    photo_url: '',
    created_at: new Date().toISOString(),
  };

  const loadAuthor = async () => {
    if (currentUser) {
      try {
        const fsAuthor = await fetchAuthorFromFirestore(currentUser.uid);
        if (fsAuthor) {
          setAuthor(fsAuthor);
          return;
        }
      } catch (err) {
        console.warn('Error loading author profile from Firestore:', err);
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const authorRes = await fetch('/api/author', { signal: controller.signal }).catch(() => null);
      clearTimeout(timeoutId);

      if (authorRes && authorRes.ok) {
        try {
          const authorData = await authorRes.json();
          setAuthor(authorData);
        } catch {
          setAuthor(defaultAuthor);
        }
      } else {
        setAuthor(defaultAuthor);
      }
    } catch {
      setAuthor(defaultAuthor);
    }
  };

  const loadFallbackBooks = async () => {
    setIsLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const booksRes = await fetch('/api/books', { signal: controller.signal }).catch(() => null);
      clearTimeout(timeoutId);

      if (booksRes && booksRes.ok) {
        try {
          const booksData = await booksRes.json();
          setBooks(Array.isArray(booksData) ? booksData : []);
        } catch {
          setBooks([]);
        }
      } else {
        setBooks([]);
      }
    } catch {
      setBooks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookDetails = async (bookId: string) => {
    let bookData: any = null;
    try {
      const res = await fetch(`/api/books/${bookId}`);
      if (res.ok) {
        bookData = await res.json();
        setSelectedBook(bookData);
      } else {
        console.warn(`Server responded with status ${res.status} for book ${bookId}`);
      }
    } catch (err) {
      console.warn(`Error fetching book ${bookId} from server API:`, err);
    }

    // Recover or fetch pages from Firestore / local state
    let fetchedPages: Page[] = bookData?.pages || [];
    if (fetchedPages.length === 0) {
      try {
        const fsPages = await fetchPagesFromFirestore(bookId);
        if (fsPages.length > 0) {
          fetchedPages = fsPages;
        }
      } catch (fsErr) {
        console.warn('Error fetching pages from Firestore:', fsErr);
      }
    }

    // Preserve existing pages in state if matching book
    if (fetchedPages.length === 0 && selectedBook?.id === bookId && pages.length > 0) {
      fetchedPages = pages;
    }

    setPages(fetchedPages);
    if (bookData?.weeks) setWeeks(bookData.weeks);
    if (bookData?.glossary) setGlossary(bookData.glossary);

    const currentBookObj = bookData || selectedBook || { id: bookId, title: 'Textbook' };
    return { ...currentBookObj, pages: fetchedPages };
  };

  // Author Profile Update
  const handleSaveAuthor = async (updated: Partial<Author>) => {
    try {
      const res = await fetch('/api/author', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      const newAuthor = { ...author, ...data };
      setAuthor(newAuthor);

      if (currentUser) {
        await saveAuthorToFirestore(newAuthor, currentUser.uid);
      }
    } catch (err) {
      console.error('Error updating author profile:', err);
    }
  };

  // Create New Book
  const handleCreateBook = async (bookData: {
    title: string;
    subject: string;
    class_level: string;
    term: string;
    sample_id?: string;
    uploaded_files?: { image_data?: string; raw_text?: string }[];
  }) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const { uploaded_files, ...metaData } = bookData;
      let newBook: Book;

      try {
        const res = await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metaData),
        });
        if (res.ok) {
          newBook = await res.json();
        } else {
          console.warn(`Server returned status ${res.status}, creating book locally.`);
          newBook = {
            id: `book-${Date.now()}`,
            author_id: currentUser.uid,
            title: bookData.title || `${bookData.subject || 'General'} Textbook`,
            subject: bookData.subject || 'Science',
            class_level: bookData.class_level || 'Grade 9',
            term: bookData.term || '1st Term',
            status: 'uploading',
            created_at: new Date().toISOString(),
            pages_count: uploaded_files?.length || 0,
          };
        }
      } catch (fetchErr) {
        console.warn('Network error during book creation, creating book locally:', fetchErr);
        newBook = {
          id: `book-${Date.now()}`,
          author_id: currentUser.uid,
          title: bookData.title || `${bookData.subject || 'General'} Textbook`,
          subject: bookData.subject || 'Science',
          class_level: bookData.class_level || 'Grade 9',
          term: bookData.term || '1st Term',
          status: 'uploading',
          created_at: new Date().toISOString(),
          pages_count: uploaded_files?.length || 0,
        };
      }

      // Associate with current user ID
      const userBook: Book = {
        ...newBook,
        userId: currentUser.uid,
      };

      // Update local state immediately
      setBooks((prev) => [userBook, ...prev.filter((b) => b.id !== userBook.id)]);

      // Attempt Firestore save
      try {
        await saveBookToFirestore(userBook, currentUser.uid);
      } catch (fsErr) {
        console.warn('Firestore persistence warning:', fsErr);
      }

      // Upload pages if custom files/text provided
      let createdPages: Page[] = [];
      if (uploaded_files && uploaded_files.length > 0) {
        try {
          const uploadRes = await fetch(`/api/books/${userBook.id}/upload-pages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pages: uploaded_files }),
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.pages && uploadData.pages.length > 0) {
              createdPages = uploadData.pages;
            }
          } else {
            console.warn('Pages upload HTTP status:', uploadRes.status);
          }
        } catch (uploadErr) {
          console.error('Error uploading pages to backend:', uploadErr);
        }

        // Guaranteed Fallback: If backend didn't return pages, create local Page objects from uploaded files
        if (createdPages.length === 0) {
          createdPages = uploaded_files.map((fItem, idx) => ({
            id: `p-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            book_id: userBook.id,
            page_order: idx + 1,
            image_url: fItem.image_data || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
            raw_ocr_text: fItem.raw_text || getCleanFallbackText(userBook.subject, idx + 1),
            ocr_confidence: 0.95,
            status: 'completed',
            created_at: new Date().toISOString(),
          }));
        }

        savePagesToFirestore(userBook.id, createdPages).catch(() => null);
      }

      setIsNewBookModalOpen(false);
      setShowLandingPage(false);
      setSelectedBook(userBook);
      if (createdPages.length > 0) {
        setPages(createdPages);
        setCurrentView('ocr');
      } else {
        await handleOpenOCRView(userBook);
      }
    } catch (err: any) {
      console.error('Error creating book:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Book
  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this textbook project?')) return;
    try {
      await fetch(`/api/books/${bookId}`, { method: 'DELETE' });
      if (currentUser) {
        await deleteBookFromFirestore(bookId);
      }
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
    } catch (err) {
      console.error('Error deleting book:', err);
    }
  };

  // Open Views
  const handleOpenOCRView = async (book: Book) => {
    setIsLoading(true);
    setSelectedBook(book);
    try {
      await fetchBookDetails(book.id);
    } finally {
      setCurrentView('ocr');
      setIsLoading(false);
    }
  };

  const handleOpenReviewView = async (book: Book, customPages?: Page[]) => {
    setIsLoading(true);
    setSelectedBook(book);
    try {
      const details = await fetchBookDetails(book.id);
      let currentWeeks = (details?.weeks && details.weeks.length > 0) ? details.weeks : (weeks || []);
      const pagesToUse = (customPages && customPages.length > 0)
        ? customPages
        : ((pages && pages.length > 0) ? pages : (details?.pages || []));

      const hasPlaceholderContent = currentWeeks.some((w) =>
        (w.topic || '').toLowerCase().includes('scanned lesson note') ||
        (w.content_json || []).some((s) =>
          (s.paragraphs || []).some((p) => (p || '').toLowerCase().includes('scanned lesson note'))
        )
      );

      // Re-structure if weeks is empty, customPages provided, or contains placeholder text
      if (!currentWeeks || currentWeeks.length === 0 || (customPages && customPages.length > 0) || hasPlaceholderContent) {
        let structuredFromBackend: Week[] = [];
        try {
          const structRes = await fetch(`/api/books/${book.id}/structure`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pages: pagesToUse }),
          });
          if (structRes.ok) {
            const structData = await structRes.json();
            if (structData.weeks && Array.isArray(structData.weeks) && structData.weeks.length > 0) {
              structuredFromBackend = structData.weeks;
            }
          }
        } catch (err) {
          console.warn('Backend structuring network call notice:', err);
        }

        if (structuredFromBackend.length > 0) {
          currentWeeks = structuredFromBackend;
        } else {
          // Client-side extraction from uploaded pages / notes
          currentWeeks = structurePagesIntoWeeks(pagesToUse, book);
        }
      }

      setWeeks(currentWeeks || []);
      if (currentUser) {
        saveWeeksToFirestore(book.id, currentWeeks).catch(() => null);
      }
    } catch (err) {
      console.error('Error opening review view:', err);
    } finally {
      setCurrentView('review');
      setIsLoading(false);
    }
  };

  const handleOpenGlossaryView = async (book: Book) => {
    setIsLoading(true);
    setSelectedBook(book);
    try {
      await fetchBookDetails(book.id);
      if (currentUser && glossary.length === 0) {
        const fsGlossary = await fetchGlossaryFromFirestore(book.id);
        if (fsGlossary.length > 0) setGlossary(fsGlossary);
      }
    } finally {
      setCurrentView('glossary');
      setIsLoading(false);
    }
  };

  const handleOpenPrintView = async (book: Book) => {
    setIsLoading(true);
    setSelectedBook(book);
    try {
      const details = await fetchBookDetails(book.id);
      let currentWeeks = details?.weeks || weeks || [];
      const pagesToUse = (pages && pages.length > 0) ? pages : (details?.pages || []);
      if (currentWeeks.length === 0) {
        currentWeeks = structurePagesIntoWeeks(pagesToUse, book);
      }
      setWeeks(currentWeeks);
    } finally {
      setCurrentView('print');
      setIsLoading(false);
    }
  };

  // Page level OCR updates
  const handleUpdatePageText = async (pageId: string, text: string) => {
    if (!selectedBook) return;
    const updatedPages = pages.map((p) => (p.id === pageId ? { ...p, raw_ocr_text: text, ocr_confidence: 1.0 } : p));
    setPages(updatedPages);
    if (currentUser) {
      await savePagesToFirestore(selectedBook.id, updatedPages);
    }
    try {
      const res = await fetch(`/api/books/${selectedBook.id}/re-ocr-page`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_id: pageId, updated_text: text }),
      });
      if (res.ok) {
        const updatedPage = await res.json();
        const finalPages = pages.map((p) => (p.id === pageId ? updatedPage : p));
        setPages(finalPages);
        if (currentUser) {
          await savePagesToFirestore(selectedBook.id, finalPages);
        }
      }
    } catch (err) {
      console.warn('Error updating page text on server:', err);
    }
  };

  const handleReOCRPage = async (pageId: string) => {
    if (!selectedBook) return;
    try {
      const res = await fetch(`/api/books/${selectedBook.id}/re-ocr-page`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_id: pageId }),
      });
      if (res.ok) {
        const updatedPage = await res.json();
        const updatedPages = pages.map((p) => (p.id === pageId ? updatedPage : p));
        setPages(updatedPages);
        if (currentUser) {
          await savePagesToFirestore(selectedBook.id, updatedPages);
        }
      }
    } catch (err) {
      console.warn('Error re-running OCR on server:', err);
    }
  };

  const handleUploadMorePages = async (files: { image_data?: string; raw_text?: string }[]) => {
    if (!selectedBook) return;
    try {
      let newPages: Page[] = [];
      try {
        const res = await fetch(`/api/books/${selectedBook.id}/upload-pages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pages: files }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.pages && data.pages.length > 0) {
            newPages = data.pages;
          }
        }
      } catch (err) {
        console.warn('Error uploading pages to backend server:', err);
      }

      if (newPages.length === 0) {
        const startOrder = pages.length + 1;
        newPages = files.map((f, idx) => ({
          id: `p-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          book_id: selectedBook.id,
          page_order: startOrder + idx,
          image_url: f.image_data || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
          raw_ocr_text: f.raw_text || 'Scanned lesson note page.',
          ocr_confidence: 0.95,
          status: 'completed',
          created_at: new Date().toISOString(),
        }));
      }

      setPages((prev) => [...prev, ...newPages]);
      savePagesToFirestore(selectedBook.id, newPages).catch(() => null);
    } catch (err) {
      console.error('Error uploading more pages:', err);
    }
  };

  // Human Review Actions
  const handleSaveWeeks = async (updatedWeeks: Week[]) => {
    if (!selectedBook) return;
    setWeeks(updatedWeeks);
    if (currentUser) {
      saveWeeksToFirestore(selectedBook.id, updatedWeeks).catch(() => null);
    }
    try {
      const res = await fetch(`/api/books/${selectedBook.id}/weeks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weeks: updatedWeeks }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.weeks) setWeeks(data.weeks);
      }
    } catch (err) {
      console.warn('Error saving weeks to backend server:', err);
    }
  };

  const handleApproveAndContinue = async () => {
    if (!selectedBook) return;
    setIsLoading(true);
    try {
      try {
        await fetch(`/api/books/${selectedBook.id}/approve-structure`, {
          method: 'POST',
        });
      } catch (err) {
        console.warn('Error approving structure on server:', err);
      }
      await loadAuthor();
      setCurrentView('print');
    } catch (err) {
      console.error('Error approving structure:', err);
      setCurrentView('print');
    } finally {
      setIsLoading(false);
    }
  };

  // Glossary Actions
  const handleAddGlossaryTerm = async (term: string, definition: string) => {
    if (!selectedBook) return;
    const newTerm: GlossaryTerm = {
      id: `g-${Date.now()}`,
      book_id: selectedBook.id,
      term,
      definition,
    };
    setGlossary((prev) => [...prev, newTerm]);
    if (currentUser) {
      saveGlossaryToFirestore(selectedBook.id, [...glossary, newTerm]).catch(() => null);
    }
    try {
      await fetch(`/api/books/${selectedBook.id}/glossary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term, definition }),
      });
    } catch (err) {
      console.warn('Error adding glossary term to server:', err);
    }
  };

  const handleUpdateGlossaryTerm = async (id: string, term: string, definition: string) => {
    if (!selectedBook) return;
    try {
      const res = await fetch(`/api/books/${selectedBook.id}/glossary/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term, definition }),
      });
      const updated = await res.json();
      setGlossary((prev) => prev.map((g) => (g.id === id ? updated : g)));
    } catch (err) {
      console.error('Error updating term:', err);
    }
  };

  const handleDeleteGlossaryTerm = async (id: string) => {
    if (!selectedBook) return;
    try {
      await fetch(`/api/books/${selectedBook.id}/glossary/${id}`, { method: 'DELETE' });
      setGlossary((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      console.error('Error deleting term:', err);
    }
  };

  // PDF Export Download
  const handleDownloadPdf = async (book?: Book) => {
    const targetBook = book || selectedBook;
    if (!targetBook) return;

    try {
      const res = await fetch(`/api/books/${targetBook.id}/generate-pdf`, {
        method: 'POST',
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${targetBook.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        await loadAuthor();
        return;
      }
      console.warn('Server PDF generation returned non-200 status, opening print view...');
    } catch (err) {
      console.warn('Server PDF export error, opening print view as fallback:', err);
    }

    // Fallback: open print view if endpoint fails
    handleOpenPrintView(targetBook);
  };

  // DOCX Export Download
  const handleExportDocx = async (book?: Book) => {
    const targetBook = book || selectedBook;
    if (!targetBook) return;

    try {
      const res = await fetch(`/api/books/${targetBook.id}/generate-docx`, {
        method: 'POST',
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${targetBook.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        await loadAuthor();
        return;
      }
      console.warn('Server DOCX generation returned non-200, switching to client-side fallback generation...');
    } catch (err) {
      console.warn('Server DOCX export error, falling back to client-side docx builder:', err);
    }

    // Client-side fallback generation
    try {
      setIsLoading(true);
      const details = await fetchBookDetails(targetBook.id);
      const exportWeeks = details?.weeks || weeks || [];
      const exportGlossary = details?.glossary || glossary || [];
      const safeAuthor = author || { id: '1', name: 'Curriculum Author', credentials: 'B.Ed', bio: 'Textbook author.' };

      const blob = await generateBookDocxBlob(targetBook, safeAuthor, exportWeeks, exportGlossary);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${targetBook.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (clientErr) {
      console.error('Client-side DOCX export error:', clientErr);
      alert('Unable to generate Word document. Please try again or check note contents.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!author) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Render Fullscreen Views
  if (currentView === 'review' && selectedBook) {
    return (
      <HumanReviewEditor
        book={selectedBook}
        weeks={weeks}
        onBack={() => setCurrentView('dashboard')}
        onSaveWeeks={handleSaveWeeks}
        onApproveAndContinue={handleApproveAndContinue}
      />
    );
  }

  if (currentView === 'print' && selectedBook) {
    return (
      <PrintPDFPreview
        book={selectedBook}
        author={author}
        weeks={weeks}
        onBack={() => setCurrentView('dashboard')}
        onExportDocx={() => handleExportDocx(selectedBook)}
      />
    );
  }

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.class_level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        author={author}
        showLandingPage={showLandingPage}
        onToggleLandingPage={(show) => setShowLandingPage(show)}
        onOpenAuthorProfile={() => setIsAuthorModalOpen(true)}
        onNewBook={() => {
          if (!currentUser) {
            setIsAuthModalOpen(true);
          } else {
            setShowLandingPage(false);
            setIsNewBookModalOpen(true);
          }
        }}
        onLoadSample={() => {
          if (!currentUser) {
            setIsAuthModalOpen(true);
          } else {
            setShowLandingPage(false);
            setIsNewBookModalOpen(true);
          }
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Hero Landing Page View */}
      {showLandingPage ? (
        <LandingPage
          onGetStarted={() => {
            if (!currentUser) {
              setIsAuthModalOpen(true);
            } else {
              setShowLandingPage(false);
              setIsNewBookModalOpen(true);
            }
          }}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onLoadSample={() => {
            if (!currentUser) {
              setIsAuthModalOpen(true);
            } else {
              setShowLandingPage(false);
              setIsNewBookModalOpen(true);
            }
          }}
        />
      ) : (
        /* Main Teacher Dashboard */
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-4 sm:space-y-6">
          {/* Dashboard Content */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 glass-panel p-4 sm:p-5 rounded-2xl border border-white/10">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 font-display">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                  Textbook Projects ({books.length})
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400">
                  {currentUser
                    ? `Private projects for ${currentUser.email}`
                    : 'Manage lesson notes, review curriculum structures, and generate Word exports.'}
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search subject or class..."
                  className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-slate-900/80 border border-white/10 rounded-full text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="py-12 sm:py-16 text-center text-slate-400 flex flex-col items-center gap-2 glass-panel rounded-2xl border border-white/10">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <span className="text-xs">Loading textbook projects...</span>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="p-8 sm:p-12 text-center glass-panel rounded-3xl border border-white/10 space-y-3">
                <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-slate-500 mx-auto" />
                <h4 className="text-xs sm:text-sm font-bold text-white font-display">No textbook projects found</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {currentUser
                    ? 'You haven’t created any projects under your account yet. Create your first project to begin.'
                    : 'Create a new project by uploading scanned notes or entering custom outlines to start publishing textbooks.'}
                </p>
                <button
                  onClick={() => {
                    if (!currentUser) {
                      setIsAuthModalOpen(true);
                    } else {
                      setIsNewBookModalOpen(true);
                    }
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-full shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Create First Textbook
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
                {filteredBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onReview={() => handleOpenReviewView(book)}
                    onViewPages={() => handleOpenOCRView(book)}
                    onExportDocx={() => handleExportDocx(book)}
                    onDownloadPdf={() => handleDownloadPdf(book)}
                    onPrintPreview={() => handleOpenPrintView(book)}
                    onDelete={handleDeleteBook}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      )}

      {/* Universal Footer */}
      <Footer
        onGetStarted={() => {
          if (!currentUser) {
            setIsAuthModalOpen(true);
          } else {
            setShowLandingPage(false);
            setIsNewBookModalOpen(true);
          }
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Auth Login/Signup Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          setShowLandingPage(false);
        }}
      />

      {/* Author Profile Modal */}
      <AuthorProfileModal
        author={author}
        isOpen={isAuthorModalOpen}
        onClose={() => setIsAuthorModalOpen(false)}
        onSave={handleSaveAuthor}
      />

      {/* New Book Creation Wizard Modal */}
      <NewBookModal
        isOpen={isNewBookModalOpen}
        onClose={() => setIsNewBookModalOpen(false)}
        onCreateBook={handleCreateBook}
      />

      {/* OCR Page Viewer Modal */}
      {selectedBook && currentView === 'ocr' && (
        <OCRViewerModal
          book={selectedBook}
          pages={pages}
          isOpen={true}
          onClose={() => setCurrentView('dashboard')}
          onUpdatePageText={handleUpdatePageText}
          onReOCR={handleReOCRPage}
          onUploadMorePages={handleUploadMorePages}
          onProceedToStructure={(pagesToStruct) => handleOpenReviewView(selectedBook, pagesToStruct)}
        />
      )}
    </div>
  );
}
