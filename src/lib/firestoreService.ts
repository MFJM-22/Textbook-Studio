import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Author, Book, Week, Page } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
}

// Save or Update a Book
export async function saveBookToFirestore(book: Book, userId?: string): Promise<void> {
  const path = `books/${book.id}`;
  try {
    const bookData = {
      ...book,
      userId: userId || auth.currentUser?.uid || 'anonymous',
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'books', book.id), bookData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Save Weeks for a Book
export async function saveWeeksToFirestore(bookId: string, weeks: Week[]): Promise<void> {
  for (const week of weeks) {
    const path = `books/${bookId}/weeks/${week.id}`;
    try {
      await setDoc(doc(db, 'books', bookId, 'weeks', week.id), {
        ...week,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

// Fetch User Books
export async function fetchUserBooks(userId: string): Promise<Book[]> {
  const path = 'books';
  try {
    const q = query(collection(db, 'books'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as Book);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// Listen to Books in real-time
export function subscribeToBooks(
  userId: string,
  onNext: (books: Book[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  const path = 'books';
  try {
    const q = query(collection(db, 'books'), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const books = snapshot.docs.map((d) => d.data() as Book);
        onNext(books);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        if (onError) {
          onError(error);
        }
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    if (onError) {
      onError(err);
    }
    return () => {};
  }
}

// Delete Book and all nested subcollections
export async function deleteBookFromFirestore(bookId: string): Promise<void> {
  const path = `books/${bookId}`;
  try {
    // Delete all subcollection documents (weeks, pages, glossary) first
    try {
      const weeksSnap = await getDocs(collection(db, 'books', bookId, 'weeks')).catch(() => null);
      if (weeksSnap && !weeksSnap.empty) {
        for (const d of weeksSnap.docs) {
          await deleteDoc(d.ref).catch(() => null);
        }
      }

      const pagesSnap = await getDocs(collection(db, 'books', bookId, 'pages')).catch(() => null);
      if (pagesSnap && !pagesSnap.empty) {
        for (const d of pagesSnap.docs) {
          await deleteDoc(d.ref).catch(() => null);
        }
      }

      const glossarySnap = await getDocs(collection(db, 'books', bookId, 'glossary')).catch(() => null);
      if (glossarySnap && !glossarySnap.empty) {
        for (const d of glossarySnap.docs) {
          await deleteDoc(d.ref).catch(() => null);
        }
      }
    } catch (subErr) {
      console.warn('Subcollection cleanup warning:', subErr);
    }

    // Delete main book document
    await deleteDoc(doc(db, 'books', bookId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

import { GlossaryTerm } from '../types';

// Save Pages for a Book
export async function savePagesToFirestore(bookId: string, pages: Page[]): Promise<void> {
  for (const page of pages) {
    const path = `books/${bookId}/pages/${page.id}`;
    try {
      await setDoc(doc(db, 'books', bookId, 'pages', page.id), {
        ...page,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

// Fetch Pages for a Book
export async function fetchPagesFromFirestore(bookId: string): Promise<Page[]> {
  const path = `books/${bookId}/pages`;
  try {
    const snapshot = await getDocs(collection(db, 'books', bookId, 'pages'));
    const pages = snapshot.docs.map((d) => d.data() as Page);
    return pages.sort((a, b) => a.page_order - b.page_order);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

// Save Glossary for a Book
export async function saveGlossaryToFirestore(bookId: string, glossary: GlossaryTerm[]): Promise<void> {
  for (const item of glossary) {
    const path = `books/${bookId}/glossary/${item.id}`;
    try {
      await setDoc(doc(db, 'books', bookId, 'glossary', item.id), {
        ...item,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

// Fetch Glossary for a Book
export async function fetchGlossaryFromFirestore(bookId: string): Promise<GlossaryTerm[]> {
  const path = `books/${bookId}/glossary`;
  try {
    const snapshot = await getDocs(collection(db, 'books', bookId, 'glossary'));
    return snapshot.docs.map((d) => d.data() as GlossaryTerm);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

// Save Author Profile for User
export async function saveAuthorToFirestore(author: Author, userId: string): Promise<void> {
  const path = `users/${userId}/profile/info`;
  try {
    const authorData = {
      ...author,
      userId,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', userId, 'profile', 'info'), authorData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Fetch Author Profile for User
export async function fetchAuthorFromFirestore(userId: string): Promise<Author | null> {
  const path = `users/${userId}/profile/info`;
  try {
    const snapshot = await getDoc(doc(db, 'users', userId, 'profile', 'info'));
    if (snapshot.exists()) {
      return snapshot.data() as Author;
    }
    // Fallback migration check on legacy paths
    const oldSnapshot = await getDoc(doc(db, 'authors', userId));
    if (oldSnapshot.exists()) {
      return oldSnapshot.data() as Author;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}
