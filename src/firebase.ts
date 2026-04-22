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
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey === 'TODO_KEYHERE') {
  console.error("Firebase configuration is missing or invalid. Please check firebase-applet-config.json");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
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
    console.error("Firebase Auth Error:", error.code, error.message, error);
    // If it's a generic internal error, it might be due to unauthorized domain
    if (error.code === 'auth/internal-error') {
      throw new Error('Internal authentication error. Try opening this app in a new tab.');
    }
    if (error.code === 'auth/unauthorized-domain') {
      const domain = window.location.hostname;
      throw new Error(`Domain "${domain}" is not authorized. Please add it to your Firebase Console > Authentication > Settings > Authorized Domains.`);
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
  } catch (error) {
    console.error("Error signing up with email", error);
    throw error;
  }
};

export const logInWithEmail = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error("Error logging in with email", error);
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

export const signInAnonymously = async () => {
  try {
    const result = await firebaseSignInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error("Error signing in anonymously", error);
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
