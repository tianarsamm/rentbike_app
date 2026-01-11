import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { useBikesStore } from "./useBikeStore";

export type TransactionStatus = 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  bikeId: string;
  bikeName: string;
  bikePrice: number;
  duration: number;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: TransactionStatus;
  orderNumber: string;
  createdAt: string;
}

interface TransactionStore {
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Omit<Transaction, "id" | "createdAt" | "orderNumber">) => Promise<void>;
  updateTransactionStatus: (id: string, status: TransactionStatus) => Promise<void>;
  fetchUserTransactions: (userId: string) => Promise<void>;
  fetchAllTransactions: () => Promise<void>;
  subscribeToAllTransactions: () => (() => void) | undefined;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],

  setTransactions: (transactions) => set({ transactions }),

  addTransaction: async (transaction) => {
    try {
      const orderNumber = `ORD-${Date.now()}`;
      
      const { data, error } = await supabase
        .from("transactions")
        .insert([
          {
            user_id: transaction.userId,
            user_name: transaction.userName,
            user_phone: transaction.userPhone,
            bike_id: transaction.bikeId,
            bike_name: transaction.bikeName,
            bike_price: transaction.bikePrice,
            duration: transaction.duration,
            start_date: transaction.startDate,
            end_date: transaction.endDate,
            total_price: transaction.totalPrice,
            status: transaction.status,
            order_number: orderNumber,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Transaction created:', data);
    } catch (error) {
      console.error("❌ Error adding transaction:", error);
      throw error;
    }
  },

  updateTransactionStatus: async (id: string, newStatus: TransactionStatus) => {
    try {
      const transaction = get().transactions.find(t => t.id === id);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      const oldStatus = transaction.status;
      console.log(`\n🔄 ===== UPDATE STATUS START =====`);
      console.log(`   Transaction ID: ${id}`);
      console.log(`   Status: ${oldStatus} → ${newStatus}`);
      console.log(`   Bike ID: ${transaction.bikeId}`);

      // ===== 1. UPDATE STATUS DI SUPABASE =====
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ status: newStatus })
        .eq("id", id);

      if (updateError) {
        console.error('❌ Error updating status in DB:', updateError);
        throw updateError;
      }
      console.log('✅ Status updated in DB');

      // ===== 2. UPDATE LOCAL STATE =====
      set((state) => ({
        transactions: state.transactions.map((t) =>
          t.id === id ? { ...t, status: newStatus } : t
        ),
      }));
      console.log('✅ Local state updated');

      // ===== 3. UPDATE INVENTORY - ONLY SAAT DIPERLUKAN =====
      console.log(`\n📦 Checking inventory update logic...`);
      
      const shouldUpdateInventory = 
        (oldStatus === 'pending' && newStatus === 'confirmed') ||
        (oldStatus === 'ongoing' && newStatus === 'completed') ||
        (oldStatus === 'confirmed' && newStatus === 'cancelled');

      console.log(`   Should update inventory: ${shouldUpdateInventory}`);

      if (shouldUpdateInventory) {
        const { updateBikeUnit } = useBikesStore.getState();
        
        let changeAmount = 0;
        if (oldStatus === 'pending' && newStatus === 'confirmed') {
          changeAmount = -1; // Kurangi stok saat dikonfirmasi
          console.log(`   Action: REDUCE stock by 1 (confirmed)`);
        } else if (oldStatus === 'ongoing' && newStatus === 'completed') {
          changeAmount = 1; // Kembalikan stok saat selesai
          console.log(`   Action: RESTORE stock by 1 (completed)`);
        } else if (oldStatus === 'confirmed' && newStatus === 'cancelled') {
          changeAmount = 1; // Kembalikan stok saat dibatalkan
          console.log(`   Action: RESTORE stock by 1 (cancelled)`);
        }

        try {
          console.log(`   Calling updateBikeUnit(${transaction.bikeId}, ${changeAmount})...`);
          await updateBikeUnit(transaction.bikeId, changeAmount);
          console.log(`✅ Inventory updated successfully`);
        } catch (inventoryError: any) {
          console.warn('⚠️ Inventory update failed:', inventoryError?.message);
          // Jangan throw, transaction status sudah berubah
        }
      } else {
        console.log(`   No inventory update needed for this status change`);
      }

      // ===== 4. REFRESH TRANSACTIONS SAJA (BUKAN BIKES) =====
      console.log(`\n🔄 Refreshing transaction data...`);
      try {
        await get().fetchAllTransactions();
        console.log('✅ Transaction data refreshed');
      } catch (refreshError) {
        console.warn('⚠️ Refresh failed:', refreshError);
      }

      console.log(`🔄 ===== UPDATE STATUS DONE =====\n`);

    } catch (error: any) {
      console.error("❌ Error in updateTransactionStatus:", error);
      throw error;
    }
  },

  fetchUserTransactions: async (userId: string) => {
    try {
      console.log('📥 Fetching transactions for user:', userId);
      
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((t) => ({
        id: t.id,
        userId: t.user_id,
        userName: t.user_name || '',
        userPhone: t.user_phone || '',
        bikeId: t.bike_id,
        bikeName: t.bike_name,
        bikePrice: t.bike_price,
        duration: t.duration,
        startDate: t.start_date,
        endDate: t.end_date,
        totalPrice: t.total_price,
        status: t.status,
        orderNumber: t.order_number || `ORD-${t.id}`,
        createdAt: t.created_at,
      }));

      set({ transactions: formatted });
      console.log('✅ User transactions loaded:', formatted.length);
    } catch (error) {
      console.error("❌ Error fetching user transactions:", error);
    }
  },

  fetchAllTransactions: async () => {
    try {
      console.log('📥 Fetching all transactions');
      
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((t) => ({
        id: t.id,
        userId: t.user_id,
        userName: t.user_name || '',
        userPhone: t.user_phone || '',
        bikeId: t.bike_id,
        bikeName: t.bike_name,
        bikePrice: t.bike_price,
        duration: t.duration,
        startDate: t.start_date,
        endDate: t.end_date,
        totalPrice: t.total_price,
        status: t.status,
        orderNumber: t.order_number || `ORD-${t.id}`,
        createdAt: t.created_at,
      }));

      set({ transactions: formatted });
      console.log('✅ All transactions loaded:', formatted.length);
    } catch (error) {
      console.error("❌ Error fetching all transactions:", error);
    }
  },

  subscribeToAllTransactions: () => {
    console.log('🔔 Setting up realtime subscription for all transactions');
    
    const channel = supabase
      .channel('all-transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
        },
        (payload: any) => {
          console.log('🔔 Realtime transaction update:', payload.eventType);
          get().fetchAllTransactions();
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Transaction subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Transaction subscription error');
        }
      });

    return () => {
      console.log('🔕 Cleaning up transaction subscription');
      supabase.removeChannel(channel);
    };
  },
}));