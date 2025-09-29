import { supabase } from '../config/supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

class AuthService {
  private authState: AuthState = {
    user: null,
    session: null,
    loading: true,
  };

  private listeners: ((state: AuthState) => void)[] = [];

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      }

      this.updateAuthState({
        user: session?.user || null,
        session,
        loading: false,
      });

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        this.updateAuthState({
          user: session?.user || null,
          session,
          loading: false,
        });
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      this.updateAuthState({
        user: null,
        session: null,
        loading: false,
      });
    }
  }

  private updateAuthState(newState: AuthState): void {
    this.authState = newState;
    this.listeners.forEach(listener => listener(newState));
  }

  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    
    // Call immediately with current state
    listener(this.authState);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getCurrentUser(): User | null {
    return this.authState.user;
  }

  public getCurrentSession(): Session | null {
    return this.authState.session;
  }

  public isAuthenticated(): boolean {
    return this.authState.user !== null;
  }

  public isLoading(): boolean {
    return this.authState.loading;
  }

  public async signUp(data: SignUpData): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });

      return {
        user: authData.user,
        error,
      };
    } catch (error) {
      return {
        user: null,
        error: error as AuthError,
      };
    }
  }

  public async signIn(data: SignInData): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      return {
        user: authData.user,
        error,
      };
    } catch (error) {
      return {
        user: null,
        error: error as AuthError,
      };
    }
  }

  public async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return {
        error: error as AuthError,
      };
    }
  }

  public async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'com.habittracker://reset-password',
      });

      return { error };
    } catch (error) {
      return {
        error: error as AuthError,
      };
    }
  }

  public async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      return { error };
    } catch (error) {
      return {
        error: error as AuthError,
      };
    }
  }

  public async updateProfile(updates: { fullName?: string }): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: updates.fullName,
        },
      });

      return { error };
    } catch (error) {
      return {
        error: error as AuthError,
      };
    }
  }
}

export const authService = new AuthService();
