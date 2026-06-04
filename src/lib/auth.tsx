'use client';

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getFirebaseAuth, hasFirebaseConfig } from '@/lib/firebase';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = hasFirebaseConfig();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    return onAuthStateChanged(getFirebaseAuth(), currentUser => {
      setUser(currentUser);
      setLoading(false);
    });
  }, [configured]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    configured,
    signIn: async (email, password) => {
      await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    },
    signUp: async (email, password) => {
      await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
    },
    signOut: async () => {
      await firebaseSignOut(getFirebaseAuth());
    },
  }), [configured, loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return value;
}
