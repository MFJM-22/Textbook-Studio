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
import { GlossaryManager } from './components/GlossaryManager';
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
} from './lib/firestoreService';

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
    'dashboard' | 'ocr' | 'review' | 'glossary' | 'print'
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
    try {
      const res = await fetch(`/api/books/${bookId}`);
      if (!res.ok) {
        console.error(`Failed to fetch book ${bookId}: HTTP status ${res.status}`);
        return null;
      }
      const data = await res.json();
      setSelectedBook(data);
      setPages(data.pages || []);
      setWeeks(data.weeks || []);
      setGlossary(data.glossary || []);
      return data;
    } catch (err) {
      console.error('Error fetching book details:', err);
      return null;
    }
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
      setAuthor(data);
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
          console.error('Error uploading pages:', uploadErr);
        }
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

  const handleOpenReviewView = async (book: Book) => {
    setIsLoading(true);
    setSelectedBook(book);
    try {
      const details = await fetchBookDetails(book.id);
      const currentWeeks = details?.weeks || weeks || [];

      // If weeks not structured yet, call AI structuring
      if (currentWeeks.length === 0) {
        try {
          const structRes = await fetch(`/api/books/${book.id}/structure`, {
            method: 'POST',
          });
          if (structRes.ok) {
            const structData = await structRes.json();
            if (structData.weeks) {
              setWeeks(structData.weeks);
            }
          }
        } catch (err) {
          console.error('Error structuring book:', err);
        }
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
      const currentWeeks = details?.weeks || weeks || [];
      if (currentWeeks.length === 0) {
        const structRes = await fetch(`/api/books/${book.id}/structure`, {
          method: 'POST',
        }).catch(() => null);
        if (structRes && structRes.ok) {
          const structData = await structRes.json();
          if (structData.weeks) setWeeks(structData.weeks);
        }
      }
    } finally {
      setCurrentView('print');
      setIsLoading(false);
    }
  };

  // Page level OCR updates
  const handleUpdatePageText = async (pageId: string, text: string) => {
    if (!selectedBook) return;
    try {
      const res = await fetch(`/api/books/${selectedBook.id}/re-ocr-page`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_id: pageId, updated_text: text }),
      });
      const updatedPage = await res.json();
      setPages((prev) => prev.map((p) => (p.id === pageId ? updatedPage : p)));
    } catch (err) {
      console.error('Error updating page text:', err);
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
      const updatedPage = await res.json();
      setPages((prev) => prev.map((p) => (p.id === pageId ? updatedPage : p)));
    } catch (err) {
      console.error('Error re-running OCR:', err);
    }
  };

  const handleUploadMorePages = async (files: { image_data?: string; raw_text?: string }[]) => {
    if (!selectedBook) return;
    try {
      const res = await fetch(`/api/books/${selectedBook.id}/upload-pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages: files }),
      });
      const data = await res.json();
      if (data.pages) {
        setPages((prev) => [...prev, ...data.pages]);
      }
      await fetchBookDetails(selectedBook.id);
    } catch (err) {
      console.error('Error uploading more pages:', err);
    }
  };

  // Human Review Actions
  const handleSaveWeeks = async (updatedWeeks: Week[]) => {
    if (!selectedBook) return;
    try {
      const res = await fetch(`/api/books/${selectedBook.id}/weeks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weeks: updatedWeeks }),
      });
      const data = await res.json();
      setWeeks(data.weeks || updatedWeeks);
    } catch (err) {
      console.error('Error saving weeks:', err);
    }
  };

  const handleApproveAndContinue = async () => {
    if (!selectedBook) return;
    try {
      const res = await fetch(`/api/books/${selectedBook.id}/approve-structure`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.glossary) setGlossary(data.glossary);
      await loadAuthor();
      setCurrentView('glossary');
    } catch (err) {
      console.error('Error approving structure:', err);
    }
  };

  // Glossary Actions
  const handleAddGlossaryTerm = async (term: string, definition: string) => {
    if (!selectedBook) return;
    try {
      const res = await fetch(`/api/books/${selectedBook.id}/glossary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term, definition }),
      });
      const newTerm = await res.json();
      setGlossary((prev) => [...prev, newTerm]);
    } catch (err) {
      console.error('Error adding term:', err);
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

  if (currentView === 'glossary' && selectedBook) {
    return (
      <GlossaryManager
        book={selectedBook}
        glossary={glossary}
        onBack={() => setCurrentView('dashboard')}
        onAddTerm={handleAddGlossaryTerm}
        onUpdateTerm={handleUpdateGlossaryTerm}
        onDeleteTerm={handleDeleteGlossaryTerm}
        onReGenerate={async () => {
          await handleApproveAndContinue();
        }}
      />
    );
  }

  if (currentView === 'print' && selectedBook) {
    return (
      <PrintPDFPreview
        book={selectedBook}
        author={author}
        weeks={weeks}
        glossary={glossary}
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
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
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {!currentUser && (
            <div className="p-4 bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950 border border-blue-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Multi-User Account Protection Active
                  </h4>
                  <p className="text-xs text-slate-400">
                    Sign in or create an account to store and access your textbook projects securely under your account.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-1.5 shrink-0"
              >
                <LogIn className="w-4 h-4" />
                Sign In / Sign Up
              </button>
            </div>
          )}

          {/* Banner Hero */}
          <div className="bg-gradient-to-r from-blue-900/80 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl border border-blue-800/40 shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Gemini Vision OCR & Structured Word Export
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Transform Scanned Teacher Notes into Publish-Ready Textbooks
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Upload handwritten or typed lesson outlines. Textbook Studio extracts text with multimodal AI, organizes week-by-week units with native table support, generates glossaries, and exports formatted Word (.docx) & PDF documents.
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    if (!currentUser) {
                      setIsAuthModalOpen(true);
                    } else {
                      setIsNewBookModalOpen(true);
                    }
                  }}
                  id="hero-create-btn"
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  New Textbook Project
                </button>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  Textbook Projects ({books.length})
                </h3>
                <p className="text-xs text-slate-400">
                  {currentUser
                    ? `Private projects for ${currentUser.email}`
                    : 'Manage lesson notes, review curriculum structures, and generate Word exports.'}
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search subject or class..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-xs">Loading textbook projects...</span>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
                <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-300">No textbook projects found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg"
                >
                  Create First Textbook
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onReview={() => handleOpenReviewView(book)}
                    onViewPages={() => handleOpenOCRView(book)}
                    onGlossary={() => handleOpenGlossaryView(book)}
                    onExportDocx={() => handleExportDocx(book)}
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
          onProceedToStructure={() => handleOpenReviewView(selectedBook)}
        />
      )}
    </div>
  );
}
