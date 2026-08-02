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
import { Book, Week } from '../types';

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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
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
  onNext: (books: Book[]) => void
): Unsubscribe {
  const path = 'books';
  const q = query(collection(db, 'books'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const books = snapshot.docs.map((d) => d.data() as Book);
      onNext(books);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// Delete Book
export async function deleteBookFromFirestore(bookId: string): Promise<void> {
  const path = `books/${bookId}`;
  try {
    await deleteDoc(doc(db, 'books', bookId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
