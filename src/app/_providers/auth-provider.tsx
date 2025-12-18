/* AuthProvider (mock) */
'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

export type User = {
  id: string;
  email: string;
};

interface AuthContextValue {
  user: User | null;
  login: (email: string, pw: string) => Promise<void>;
  signup: (email: string, pw: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// in-memory fake DB
const fakeDB: Record<string, User> = {};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string) => {
    let found = fakeDB[email];
    if (!found) {
      found = { id: crypto.randomUUID(), email };
      fakeDB[email] = found;
    }
    setUser(found);
  };

  const signup = async (email: string) => {
    const newbie = { id: crypto.randomUUID(), email };
    fakeDB[email] = newbie;
    setUser(newbie);
  };

  const logout = () => setUser(null);

  const value: AuthContextValue = { user, login, signup, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
