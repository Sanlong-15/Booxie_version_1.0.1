import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  signInAnonymously as firebaseSignInAnonymously
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey === 'TODO_KEYHERE') {
  console.error("Firebase configuration is missing or invalid. Please check firebase-applet-config.json");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with persistent cache
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
}, firebaseConfig.firestoreDatabaseId);

export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGoogle = async () => {
  try {
    // Simplify: only handle auth here. AuthContext handles firestore syncing.
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      // User closed the popup, not an actual error we need to show
      return null;
    }
    console.error("Firebase Auth Error:", error.code, error.message, error);
    // If it's a generic internal error, it might be due to unauthorized domain
    if (error.code === 'auth/internal-error') {
      throw new Error('Internal authentication error. Try opening this app in a new tab.');
    }
    if (error.code === 'auth/unauthorized-domain') {
      const domain = window.location.hostname;
      throw new Error(`Domain "${domain}" is not authorized. Please add it to your Firebase Console > Authentication > Settings > Authorized Domains.`);
    }
    if (error.code === 'auth/network-request-failed') {
      throw new Error('Network request failed. This often happens due to cross-site tracking protections or browser extensions. Try opening in a new tab or incognito.');
    }
    throw error;
  }
};

export const signUpWithEmail = async (
  email: string, 
  pass: string, 
  name: string, 
  phone: string, 
  birthday?: string, 
  gender?: string, 
  profileImage?: string | null,
  studentIdImage?: string | null
) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(result.user, { displayName: name });
    
    // Create user document immediately to ensure name is correct
    const userRef = doc(db, 'users', result.user.uid);
    await setDoc(userRef, {
      uid: result.user.uid,
      name: name,
      email: email,
      phone: phone,
      birthday: birthday || '',
      gender: gender || '',
      photoURL: profileImage || '',
      studentIdImage: studentIdImage || '',
      role: 'user',
      rewardPoints: 0,
      createdAt: serverTimestamp()
    });
    
    return result.user;
  } catch (error: any) {
    console.error("Error signing up with email", error);
    if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection or add this domain to Authorized Domains in Firebase Console.');
    }
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Email/Password authentication is not enabled. Please enable it in your Firebase Console > Authentication > Sign-in method.');
    }
    throw error;
  }
};

export const logInWithEmail = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error: any) {
    console.error("Error logging in with email", error);
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Email/Password authentication is not enabled. Please enable it in your Firebase Console > Authentication > Sign-in method.');
    }
    throw error;
  }
};

/**
 * Log in as a pre-configured demo user.
 * This bypasses the 'anonymous auth disabled' error by using a real email/pass account.
 */
export const logInAsDemo = async () => {
  const demoEmail = 'alex.demo@booxie.app';
  const demoPass = 'booxie123demo';
  const demoName = 'Alex (Demo)';

  try {
    // Try logging in
    const result = await signInWithEmailAndPassword(auth, demoEmail, demoPass);
    return result.user;
  } catch (error: any) {
    // If user doesn't exist, create the demo account automatically
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      try {
        const result = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
        await updateProfile(result.user, { displayName: demoName });
        
        // Profile creation is handled by AuthContext or we can do it here
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, {
          uid: result.user.uid,
          name: demoName,
          email: demoEmail,
          role: 'user',
          rewardPoints: 1250,
          purchasedCount: 5,
          soldCount: 2,
          donatedCount: 8,
          isDemo: true,
          bio: 'Reading enthusiast & Booxie explorer! 📚✨',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return result.user;
      } catch (signUpError) {
        console.error("Failed to create demo account", signUpError);
        throw signUpError;
      }
    }
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

export const deleteBook = async (bookId: string) => {
  try {
    const bookRef = doc(db, 'books', bookId);
    await deleteDoc(bookRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `books/${bookId}`);
  }
};

export const signInAnonymously = async () => {
  try {
    const result = await firebaseSignInAnonymously(auth);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in anonymously", error);
    if (error.code === 'auth/admin-restricted-operation') {
      throw new Error('Anonymous authentication is not enabled. Please enable it in your Firebase Console > Authentication > Sign-in method.');
    }
    throw error;
  }
};

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
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo?: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export const quotaState = {
  isExceeded: false,
  timestamp: 0,
  lastError: null as string | null
};

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const normalizedMsg = errorMessage.toLowerCase();
  
  // Specific check for Firestore Spark plan limits
  const isQuotaError = 
    normalizedMsg.includes('quota') || 
    normalizedMsg.includes('limit exceeded') || 
    normalizedMsg.includes('resource-exhausted') ||
    normalizedMsg.includes('exceeded its limit');
  
  if (isQuotaError) {
    quotaState.isExceeded = true;
    quotaState.timestamp = Date.now();
    quotaState.lastError = errorMessage;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }

  if (isQuotaError) {
    console.warn('Daily database limit reached (Quota Exceeded). Using offline cache.');
    
    // Set the state so the UI can show the banner
    quotaState.isExceeded = true;
    quotaState.timestamp = Date.now();
    quotaState.lastError = errorMessage;

    // Return a descriptive error but don't just throw blindly if it's a list/get that can fail silently
    const userFriendlyError = new Error('Daily database limit reached. Some live updates may be unavailable.');
    (userFriendlyError as any).isQuota = true;
    (userFriendlyError as any).details = errInfo;
    
    // If it's a LIST or GET, we might want to just warn and let the cache handle it
    if (operationType === OperationType.LIST || operationType === OperationType.GET) {
      return; 
    }

    throw userFriendlyError;
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
