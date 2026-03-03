import { useState, useEffect } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../firebase';

// Detect if running inside Electron
const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (isElectron) {
        // Use main process auth window for Electron
        const result = await (window as any).electronAPI.googleSignIn();
        if (!result.success) {
          return { success: false, error: result.error || 'Google sign-in cancelled' };
        }
        // Use the access token to sign in to Firebase
        const credential = GoogleAuthProvider.credential(result.idToken, result.accessToken);
        const firebaseResult = await signInWithCredential(auth, credential);
        return { success: true, user: firebaseResult.user };
      } else {
        // Web: use popup as normal
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        return { success: true, user: result.user };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return { user, loading, signIn, signUp, signInWithGoogle, signOut };
}
