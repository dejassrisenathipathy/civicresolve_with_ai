'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  UserCredential,
} from 'firebase/auth';
import { clientAuth } from '@/lib/firebase/clientConfig';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
  signInAdmin: (email: string, pass: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  getIdToken: async () => null,
  signInAdmin: async () => {
    throw new Error('AuthProvider not initialized');
  },
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(clientAuth, async (currentUser) => {
      if (!currentUser) {
        // Automatic anonymous sign-in for citizens
        try {
          const anonCred = await signInAnonymously(clientAuth);
          setUser(anonCred.user);
          setIsAdmin(false);
        } catch (err) {
          console.error('Anonymous authentication failed:', err);
          setUser(null);
          setIsAdmin(false);
        }
      } else {
        setUser(currentUser);
        try {
          const idTokenResult = await currentUser.getIdTokenResult();
          setIsAdmin(Boolean(idTokenResult.claims.admin));
        } catch {
          setIsAdmin(false);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getIdToken = useCallback(
    async (forceRefresh = false): Promise<string | null> => {
      if (!user) {
        if (clientAuth.currentUser) {
          return clientAuth.currentUser.getIdToken(forceRefresh);
        }
        return null;
      }
      return user.getIdToken(forceRefresh);
    },
    [user]
  );

  const signInAdmin = useCallback(
    async (email: string, pass: string): Promise<UserCredential> => {
      setLoading(true);
      try {
        const cred = await signInWithEmailAndPassword(clientAuth, email, pass);
        const tokenResult = await cred.user.getIdTokenResult(true);
        if (!tokenResult.claims.admin) {
          // Not an admin: reject and restore anonymous session
          await firebaseSignOut(clientAuth);
          await signInAnonymously(clientAuth);
          throw new Error('Access denied: User does not possess administrator privileges.');
        }
        setUser(cred.user);
        setIsAdmin(true);
        return cred;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signOut = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      await firebaseSignOut(clientAuth);
      const anonCred = await signInAnonymously(clientAuth);
      setUser(anonCred.user);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin,
      getIdToken,
      signInAdmin,
      signOut,
    }),
    [user, loading, isAdmin, getIdToken, signInAdmin, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
