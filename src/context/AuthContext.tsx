import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Initial setup for document if it doesn't exist
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            // Create a "Demo" profile for guests to make it feel like a real account
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              name: firebaseUser.isAnonymous || firebaseUser.email?.includes('demo') ? 'Alex (Demo)' : (firebaseUser.displayName || 'User'),
              email: firebaseUser.email || (firebaseUser.isAnonymous ? 'alex.demo@booxie.app' : ''),
              photoURL: firebaseUser.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
              role: 'user', // Set as 'user' so they can access all features
              rewardPoints: (firebaseUser.isAnonymous || firebaseUser.email?.includes('demo')) ? 1250 : 0,
              purchasedCount: (firebaseUser.isAnonymous || firebaseUser.email?.includes('demo')) ? 5 : 0,
              soldCount: (firebaseUser.isAnonymous || firebaseUser.email?.includes('demo')) ? 2 : 0,
              donatedCount: (firebaseUser.isAnonymous || firebaseUser.email?.includes('demo')) ? 8 : 0,
              isDemo: true,
              bio: 'Reading enthusiast & Booxie explorer! 📚✨',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
        } catch (error) {
          console.warn("AuthContext: Error checking/creating user doc", error);
        }

        // Real-time listener for profile
        unsubscribeProfile = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data());
          } else {
            // Fallback if document is getting created or fails
            setProfile({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Demo Reader',
              role: 'user',
              rewardPoints: 0
            });
          }
          setLoading(false);
        }, (error: any) => {
          console.warn("AuthContext: Profile listener error (likely quota limit reached)", error.message);
          
          // If we hit quota, try to at least set a basic profile from what we know
          setProfile(prev => prev || {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'Alex (Offline)',
            role: 'user',
            rewardPoints: 0,
            isOffline: true
          });
          setLoading(false);
          
          // Still register the error for the global warning
          try { handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`); } catch(e) {}
        });
      } else {
        if (unsubscribeProfile) unsubscribeProfile();
        
        // Check for local guest mode fallback
        const localGuest = localStorage.getItem('guestMode');
        if (localGuest === 'true') {
          setUser(null);
          setProfile({
            uid: 'local-guest',
            name: 'Alex (Guest)',
            email: 'guest@booxie.local',
            photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
            role: 'user',
            rewardPoints: 750,
            purchasedCount: 2,
            soldCount: 0,
            donatedCount: 3,
            isDemo: true,
            isLocalGuest: true,
            bio: 'Browsing Booxie as a local guest!'
          });
          setLoading(false);
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
