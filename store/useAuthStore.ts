import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: {
    full_name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  loadUser: () => Promise<void>;
}

const AUTH_STORAGE_KEY = '@rentride_auth';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },

  login: async (email: string, password: string) => {
    try {
      // TODO: Implement Supabase login
      // const { data, error } = await supabase.auth.signInWithPassword({
      //   email,
      //   password,
      // });

      // if (error) throw error;

      // // Get user profile
      // const { data: profile } = await supabase
      //   .from('users')
      //   .select('*')
      //   .eq('id', data.user.id)
      //   .single();

      // const user: User = {
      //   id: data.user.id,
      //   full_name: profile.full_name,
      //   email: profile.email,
      //   phone: profile.phone,
      //   avatar_url: profile.avatar_url,
      //   role: profile.role,
      // };

      // Mock user for now - using proper UUID format
      const user: User = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        full_name: 'John Doe',
        email: email,
        phone: '081234567890',
        role: 'user',
      };

      // Save to state
      set({ user, isAuthenticated: true });

      // Save to AsyncStorage
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  },

  register: async (userData) => {
    try {
      // TODO: Implement Supabase registration
      // 1. Create auth user
      // const { data: authData, error: authError } = await supabase.auth.signUp({
      //   email: userData.email,
      //   password: userData.password,
      // });

      // if (authError) throw authError;

      // 2. Insert user profile
      // const { error: profileError } = await supabase
      //   .from('users')
      //   .insert([
      //     {
      //       id: authData.user?.id,
      //       full_name: userData.full_name,
      //       email: userData.email,
      //       phone: userData.phone,
      //       role: 'user',
      //     }
      //   ]);

      // if (profileError) throw profileError;

      // For now, just return success
      return true;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  },

  logout: async () => {
    try {
      // TODO: Implement Supabase logout
      // await supabase.auth.signOut();

      // Clear state
      set({ user: null, isAuthenticated: false });

      // Clear AsyncStorage
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  checkAuth: async () => {
    try {
      // TODO: Check Supabase session
      // const { data: { user } } = await supabase.auth.getUser();
      // 
      // if (!user) {
      //   set({ isAuthenticated: false, user: null });
      //   return false;
      // }

      // Check AsyncStorage for now
      const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      
      if (storedUser) {
        const user = JSON.parse(storedUser);
        set({ user, isAuthenticated: true });
        return true;
      }

      set({ isAuthenticated: false, user: null });
      return false;
    } catch (error) {
      console.error('Check auth error:', error);
      set({ isAuthenticated: false, user: null });
      return false;
    }
  },

  loadUser: async () => {
    set({ isLoading: true });
    
    try {
      // TODO: Load from Supabase
      // const { data: { user } } = await supabase.auth.getUser();
      
      // if (user) {
      //   const { data: profile } = await supabase
      //     .from('users')
      //     .select('*')
      //     .eq('id', user.id)
      //     .single();
      
      //   set({
      //     user: profile,
      //     isAuthenticated: true,
      //     isLoading: false,
      //   });
      // } else {
      //   set({ user: null, isAuthenticated: false, isLoading: false });
      // }

      // Load from AsyncStorage for now
      const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      
      if (storedUser) {
        const user = JSON.parse(storedUser);
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error('Load user error:', error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));