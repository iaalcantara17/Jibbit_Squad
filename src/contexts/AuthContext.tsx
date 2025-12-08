import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithToken: (token: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: (password: string, isOAuthUser?: boolean) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      return;
    }

    // Fetch profile data from profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

  const importLinkedInProfile = async (user: any) => {
    try {
      // Check if user authenticated via LinkedIn
      if (user.app_metadata?.provider === 'linkedin_oidc') {
        const metadata = user.user_metadata;
        
        // Update profile with LinkedIn data
        const { error } = await supabase
          .from('profiles')
          .update({
            name: metadata.name || metadata.full_name,
            avatar_url: metadata.avatar_url || metadata.picture,
          })
          .eq('user_id', user.id);

        if (error) console.error('LinkedIn import error:', error);
      }
    } catch (error) {
      console.error('Failed to import LinkedIn profile:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Fetch profile and import LinkedIn data when user signs in
      if (session?.user) {
        setTimeout(() => {
          // Import LinkedIn profile on first login
          if (event === 'SIGNED_IN' && session.user.app_metadata?.provider === 'linkedin_oidc') {
            importLinkedInProfile(session.user);
          }
          refreshProfile();
        }, 0);
      } else {
        setProfile(null);
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      if (session?.user) {
        refreshProfile();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      toast.success('Signed in successfully!');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  };

  const loginWithToken = async (token: string) => {
    try {
      // For OAuth, we need to set the session with the token
      localStorage.setItem('auth_token', token);
      
      const { data, error } = await supabase.auth.getUser();
      
      if (error || !data.user) {
        return { success: false, error: 'Invalid or expired token' };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  };

  const deleteAccount = async (password: string, isOAuthUser: boolean = false) => {
    try {
      if (!user) {
        return { success: false, error: 'No user logged in' };
      }

      // Call the delete-account edge function with server-side verification
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: isOAuthUser 
          ? { confirmationText: password, isOAuthUser: true }
          : { password, isOAuthUser: false }
      });
      
      if (error) {
        return { success: false, error: error.message };
      }

      if (!data?.success) {
        return { success: false, error: data?.error || 'Failed to delete account' };
      }

      await logout();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete account'
      };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      toast.success('Account created successfully!');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully!');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      toast.success('Password reset email sent!');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to send reset email'
      };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      toast.success('Password updated successfully!');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update password'
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isLoading, login, loginWithToken, register, logout, resetPassword, updatePassword, deleteAccount, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
