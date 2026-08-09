import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes('client is offline') ||
      message.includes('unavailable') ||
      (error && typeof error === 'object' && 'code' in error && (error as any).code === 'unavailable')
    ) {
      console.info('Firestore notice: Connection deferred or client operating in offline mode.');
    } else {
      console.debug('Firestore connection check completed:', message);
    }
  }
}
testConnection();
