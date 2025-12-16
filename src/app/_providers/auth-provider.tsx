"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase-browser";
import { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  email: string;
  real_name: string | null;
  phone: string | null;
  language: string | null;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  signup: (email: string, pw: string) => Promise<void>;
  login: (email: string, pw: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // 최초 세션 로드 및 변화 감지
  useEffect(() => {
    const session = supabase.auth.session();
    setUser(session?.user ?? null);
    if (session?.user) fetchProfile(session.user.id);

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      listener?.unsubscribe();
    };
  }, []);

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase
      .from<Profile>('signup')
      .select('*')
      .eq('id', uid)
      .single();
    setProfile(data ?? null);
  };

  const signup = async (email: string, pw: string) => {
    const { user, error } = await supabase.auth.signUp({ email, password: pw });
    if (error) throw error;
    setUser(user);
    if (user) fetchProfile(user.id);
  };

  const login = async (email: string, pw: string) => {
    const { user, error } = await supabase.auth.signIn({ email, password: pw });
    if (error) throw error;
    setUser(user);
    if (user) fetchProfile(user.id);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const value: AuthContextValue = { user, profile, signup, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

