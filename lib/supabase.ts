import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Polyfill localStorage untuk Supabase
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    getItem: async (key: string) => {
      return await AsyncStorage.getItem(key);
    },
    setItem: async (key: string, value: string) => {
      return await AsyncStorage.setItem(key, value);
    },
    removeItem: async (key: string) => {
      return await AsyncStorage.removeItem(key);
    },
    clear: async () => {
      return await AsyncStorage.clear();
    },
  } as any;
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Client dengan service role untuk storage operations (bypass RLS)
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : supabase;

// Types
export type TransactionStatus = 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';

export interface Transaction {
  id: string;
  order_number: string;
  user_id: string;
  bike_id: string;
  bike_name: string;
  bike_price: number;
  start_date: string;
  end_date: string;
  duration: number;
  total_price: number;
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
  // Joined data
  user_name?: string;
  user_phone?: string;
  user_email?: string;
}

export interface CreateTransactionData {
  user_id: string;
  bike_id: string;
  bike_name: string;
  bike_price: number;
  start_date: string;
  end_date: string;
  duration: number;
  total_price: number;
}

// Transaction Service
export const transactionService = {
  // Generate order number
  generateOrderNumber: () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  },

  // Create new transaction
  createTransaction: async (data: CreateTransactionData) => {
    const orderNumber = transactionService.generateOrderNumber();
    
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        order_number: orderNumber,
        ...data,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return transaction;
  },

  // Get user transactions
  getUserTransactions: async (userId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        users:user_id (
          full_name,
          phone,
          email
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data.map(trx => ({
      ...trx,
      user_name: trx.users?.full_name,
      user_phone: trx.users?.phone,
      user_email: trx.users?.email
    }));
  },

  // Get all transactions (Admin only)
  getAllTransactions: async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        users:user_id (
          full_name,
          phone,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data.map(trx => ({
      ...trx,
      user_name: trx.users?.full_name,
      user_phone: trx.users?.phone,
      user_email: trx.users?.email
    }));
  },

  // Update transaction status (Admin only)
  updateTransactionStatus: async (transactionId: string, status: TransactionStatus) => {
    const { data, error } = await supabase
      .from('transactions')
      .update({ status })
      .eq('id', transactionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Subscribe to transaction changes
  subscribeToTransactions: (userId: string, callback: (payload: any) => void) => {
    const subscription = supabase
      .channel('transactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    return subscription;
  },

  // Subscribe to all transactions (Admin)
  subscribeToAllTransactions: (callback: (payload: any) => void) => {
    const subscription = supabase
      .channel('all_transactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        callback
      )
      .subscribe();

    return subscription;
  }
};