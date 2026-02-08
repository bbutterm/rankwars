import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import type { User, Session } from '@supabase/supabase-js';

// ============================================================
// Types
// ============================================================

export interface AppUser {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  is_admin: boolean;
  is_moderator: boolean;
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  isAdmin: boolean;
  isModerator: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================
// Provider Component
// ============================================================

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data from Supabase auth and public.users table
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    const loadUser = async () => {
      const { data: { session } } = await supabase!.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        await loadAppUser(session.user.id);
      }
      setIsLoading(false);
    };

    loadUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadAppUser(session.user.id);
        } else {
          setAppUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Load user data from public.users table
  const loadAppUser = async (userId: string) => {
    try {
      const { data, error } = await supabase!
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading app user:', error);
        setAppUser(null);
        return;
      }

      setAppUser(data as AppUser);
    } catch (error) {
      console.error('Error loading app user:', error);
      setAppUser(null);
    }
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
    setUser(null);
    setAppUser(null);
  };

  const refreshUser = async () => {
    if (user) {
      await loadAppUser(user.id);
    }
  };

  const value: AuthContextType = {
    user,
    appUser,
    isAdmin: appUser?.is_admin || false,
    isModerator: appUser?.is_moderator || false,
    isLoading,
    isAuthenticated: !!user,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================
// Custom Hook
// ============================================================

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// ============================================================
// HOC for Protected Routes
// ============================================================

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  fallback?: ReactNode;
}

export const ProtectedRoute = ({ 
  children, 
  requireAdmin = false,
  fallback 
}: ProtectedRouteProps) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center py-20 text-slate-500">Loading...</div>;
  }

  if (!isAuthenticated) {
    return fallback || <div className="text-center py-20">Please sign in</div>;
  }

  if (requireAdmin && !isAdmin) {
    return fallback || <div className="text-center py-20 text-red-400">Access denied</div>;
  }

  return <>{children}</>;
};

// ============================================================
// HOC for Admin Only
// ============================================================

export const AdminOnly = ({ children, fallback }: ProtectedRouteProps) => {
  return <ProtectedRoute requireAdmin={true} fallback={fallback}>{children}</ProtectedRoute>;
};
