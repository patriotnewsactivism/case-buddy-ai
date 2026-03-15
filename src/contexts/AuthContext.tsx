import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured, checkSupabaseHealth, getHealthStatus, translateAuthError, directSignIn, directSignUp } from '../services/supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';

export type SubscriptionPlan = 'free' | 'pro' | 'firm';

export interface UserUsage {
  cases_created: number;
  ai_generations_this_month: number;
  trial_sessions_this_month: number;
  last_reset_date: string;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  firmName?: string;
  createdAt: string;
  plan: SubscriptionPlan;
  usage: UserUsage;
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, firmName?: string) => Promise<{ autoLoggedIn: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateUsage: (updates: Partial<UserUsage>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const DEFAULT_USAGE: UserUsage = {
    cases_created: 0,
    ai_generations_this_month: 0,
    trial_sessions_this_month: 0,
    last_reset_date: new Date().toISOString()
  };

  const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`${label} timed out. The authentication service may be unavailable. Please try again later.`)), ms)
      ),
    ]);
  };

  const requireSupabase = () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Authentication service is not configured. Please set up Supabase credentials in your environment.');
    }
  };

  useEffect(() => {
    // Check active sessions and sets up the listener
    const initAuth = async () => {
      try {
        if (!isSupabaseConfigured()) {
          console.warn('[Auth] Supabase not configured, skipping auth initialization');
          setSupabaseUser(null);
          setUser(null);
          return;
        }
        // Pre-warm health check so we can detect paused/unreachable projects early
        checkSupabaseHealth().catch(() => {});
        const { data: { session }, error: sessionError } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Session check timed out')), 8000)),
        ]);
        if (sessionError) {
          console.warn('[Auth] Failed to get session:', sessionError.message);
        }
        setSupabaseUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user);
        }
      } catch (err) {
        console.error('[Auth] initAuth failed:', err);
        setSupabaseUser(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Add a safety timeout so loading never gets stuck
    const timeout = setTimeout(() => {
      setLoading((current) => {
        if (current) {
          console.warn('[Auth] Loading timed out after 10s, forcing complete');
          return false;
        }
        return current;
      });
    }, 10000);

    initAuth().finally(() => clearTimeout(timeout));

    let subscription: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured()) {
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setSupabaseUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      subscription = data.subscription;
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const fetchProfile = async (sUser: SupabaseUser) => {
    try {
      const { data, error: profileError } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', sUser.id)
          .single(),
        5000,
        'Profile fetch'
      );

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // Profile doesn't exist yet, create a default one
          const newProfile = {
            id: sUser.id,
            email: sUser.email || '',
            full_name: sUser.user_metadata?.full_name || sUser.email?.split('@')[0] || 'User',
            firm_name: sUser.user_metadata?.firm_name || '',
            preferences: { plan: 'free', usage: DEFAULT_USAGE }
          };
          
          const { error: insertError } = await withTimeout(
            supabase.from('profiles').insert(newProfile),
            5000,
            'Profile creation'
          );
          if (insertError) throw insertError;
          
          setUser({
            id: sUser.id,
            email: sUser.email || '',
            fullName: newProfile.full_name,
            firmName: newProfile.firm_name,
            createdAt: sUser.created_at,
            plan: 'free',
            usage: DEFAULT_USAGE
          });
        } else {
          throw profileError;
        }
      } else {
        setUser({
          id: sUser.id,
          email: sUser.email || '',
          fullName: data.full_name,
          firmName: data.firm_name,
          createdAt: data.created_at,
          plan: (data.preferences?.plan as SubscriptionPlan) || 'free',
          usage: (data.preferences?.usage as UserUsage) || DEFAULT_USAGE
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      // Fallback to minimal user info if profile fetch fails
      setUser({
        id: sUser.id,
        email: sUser.email || '',
        fullName: sUser.user_metadata?.full_name || sUser.email?.split('@')[0] || 'User',
        createdAt: sUser.created_at,
        plan: 'free',
        usage: DEFAULT_USAGE
      });
    }
  };

  const updateUsage = async (updates: Partial<UserUsage>): Promise<void> => {
    if (!user || !supabaseUser || !isSupabaseConfigured()) return;
    
    const newUsage = { ...user.usage, ...updates };
    const newPreferences = { plan: user.plan, usage: newUsage };
    
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ preferences: newPreferences })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      setUser({
        ...user,
        usage: newUsage
      });
    } catch (err) {
      console.error('Failed to update usage:', err);
      setError('Failed to update usage data');
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      requireSupabase();
      // Use direct fetch to bypass Supabase client's navigator.locks
      // which can deadlock if getSession() is still holding the lock
      const { data, error: signInError } = await withTimeout(
        directSignIn(email, password),
        15000,
        'Sign in'
      );
      if (signInError) throw new Error(signInError.message);
      // If setSession was blocked by navigator.locks, onAuthStateChange won't fire.
      // Manually update React state from the token response so the user gets logged in.
      if (data?.user) {
        const sUser = data.user as SupabaseUser;
        setSupabaseUser(sUser);
        setUser({
          id: sUser.id,
          email: sUser.email || '',
          fullName: sUser.user_metadata?.full_name || sUser.email?.split('@')[0] || 'User',
          firmName: sUser.user_metadata?.firm_name || '',
          createdAt: sUser.created_at,
          plan: 'free',
          usage: DEFAULT_USAGE
        });

        // Don't block login UX on profile network latency.
        // Fire and forget so route navigation can complete immediately.
        fetchProfile(sUser).catch((profileError) => {
          console.warn('[Auth] Deferred profile fetch failed after sign in:', profileError);
        });
      }
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : 'Failed to sign in';
      const message = translateAuthError(rawMessage);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, firmName?: string): Promise<{ autoLoggedIn: boolean }> => {
    setLoading(true);
    setError(null);
    try {
      requireSupabase();
      // Use direct fetch to bypass Supabase client's navigator.locks
      const { data, error: signUpError } = await withTimeout(
        directSignUp(email, password, {
          full_name: fullName,
          firm_name: firmName || '',
        }),
        15000,
        'Sign up'
      );
      if (signUpError) throw new Error(signUpError.message);
      // Manually update state if setSession was blocked (same as signIn)
      if (data?.access_token && data?.user) {
        const sUser = data.user as SupabaseUser;
        setSupabaseUser(sUser);
        setUser({
          id: sUser.id,
          email: sUser.email || '',
          fullName: sUser.user_metadata?.full_name || fullName || sUser.email?.split('@')[0] || 'User',
          firmName: sUser.user_metadata?.firm_name || firmName,
          createdAt: sUser.created_at,
          plan: 'free',
          usage: DEFAULT_USAGE
        });
        fetchProfile(sUser).catch((profileError) => {
          console.warn('[Auth] Deferred profile fetch failed after sign up:', profileError);
        });
      }
      return { autoLoggedIn: !!data?.access_token };
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : 'Failed to create account';
      const message = translateAuthError(rawMessage);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
      setUser(null);
      setSupabaseUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      requireSupabase();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
      if (resetError) throw resetError;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      requireSupabase();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (updateError) throw updateError;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    supabaseUser,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateUsage,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
