// Firebase client - optional dependency
// Note: Firebase is not installed by default. Install firebase package if needed.
// This module provides an alternative to Supabase for cloud persistence.

// @ts-ignore - Firebase is an optional dependency
let firebaseApp: any = null;
let db: any = null;
let auth: any = null;
let isInitialized = false;

export const isFirebaseConfigured = (): boolean => {
  return !!(process.env.FIREBASE_API_KEY && process.env.FIREBASE_PROJECT_ID);
};

export const initializeFirebase = async () => {
  if (isInitialized || !isFirebaseConfigured()) return;
  
  try {
    // Dynamic import for optional firebase dependency
    // @ts-ignore
    const firebase = await import('firebase/app');
    // @ts-ignore
    const { getFirestore } = await import('firebase/firestore');
    // @ts-ignore
    const { getAuth, signInAnonymously } = await import('firebase/auth');
    
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY || '',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.FIREBASE_APP_ID || '',
    };
    
    firebaseApp = firebase.initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp);
    auth = getAuth(firebaseApp);
    
    await signInAnonymously(auth);
    
    isInitialized = true;
    console.log('[Firebase] Initialized successfully');
  } catch (error) {
    console.error('[Firebase] Initialization failed:', error);
    console.log('[Firebase] Make sure to install firebase: npm install firebase');
  }
};

export const getFirebaseDb = () => {
  if (!isInitialized || !db) {
    initializeFirebase();
  }
  return db;
};

export const getCasesCollection = async () => {
  const database = getFirebaseDb();
  if (!database) return null;
  // @ts-ignore
  const { collection } = await import('firebase/firestore');
  return collection(database, 'cases');
};

export const getCaseDoc = async (caseId: string) => {
  const database = getFirebaseDb();
  if (!database) return null;
  // @ts-ignore
  const { doc } = await import('firebase/firestore');
  return doc(database, 'cases', caseId);
};

export { db, auth };
