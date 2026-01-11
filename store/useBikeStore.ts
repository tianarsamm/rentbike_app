import { create } from "zustand";
import { supabase } from "../lib/supabase";

export interface Bike {
  id: string;
  name: string;
  brand: string;
  category: string;
  fuel: string;
  cc: number;
  price: number;
  unit: number;
  image_url?: string;
}

interface BikeStore {
  bikes: Bike[];
  setBikes: (bikes: Bike[]) => void;
  fetchBikes: () => Promise<void>;
  addBike: (bike: Omit<Bike, "id">) => Promise<void>;
  updateBike: (id: string, updates: Partial<Bike>) => Promise<void>;
  updateBikeUnit: (bikeId: string, change: number) => Promise<void>;
  subscribeToBikes: () => (() => void) | undefined;
}

export const useBikesStore = create<BikeStore>((set, get) => ({
  bikes: [],

  setBikes: (bikes) => set({ bikes }),

  fetchBikes: async () => {
    try {
      console.log('📥 Fetching bikes from Supabase');
      
      const { data, error } = await supabase
        .from("bikes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((bike) => ({
        id: bike.id,
        name: bike.name,
        brand: bike.brand,
        category: bike.category,
        fuel: bike.fuel,
        cc: bike.cc,
        price: bike.price,
        unit: bike.unit || 0,
        image_url: bike.image_url,
      }));

      set({ bikes: formatted });
      console.log('✅ Bikes loaded:', formatted.length);
    } catch (error) {
      console.error("Error fetching bikes:", error);
    }
  },

  addBike: async (bike) => {
    try {
      const { data, error } = await supabase
        .from("bikes")
        .insert([bike])
        .select()
        .single();

      if (error) throw error;

      const newBike = {
        id: data.id,
        name: data.name,
        brand: data.brand,
        category: data.category,
        fuel: data.fuel,
        cc: data.cc,
        price: data.price,
        unit: data.unit || 0,
        image_url: data.image_url,
      };

      set((state) => ({ bikes: [newBike, ...state.bikes] }));
      console.log('✅ Bike added:', newBike);
    } catch (error) {
      console.error("Error adding bike:", error);
      throw error;
    }
  },

  updateBike: async (id, updates) => {
    try {
      const { error } = await supabase
        .from("bikes")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      set((state) => ({
        bikes: state.bikes.map((bike) =>
          bike.id === id ? { ...bike, ...updates } : bike
        ),
      }));

      console.log('✅ Bike updated:', id);
    } catch (error) {
      console.error("Error updating bike:", error);
      throw error;
    }
  },

// FILE: store/useBikeStore.ts
// GANTI SELURUH FUNCTION updateBikeUnit dengan ini:

updateBikeUnit: async (bikeId: string, change: number) => {
  try {
    console.log(`\n📦 updateBikeUnit called`);
    console.log(`   Bike ID: ${bikeId}, Change: ${change}`);
    
    if (!bikeId) {
      throw new Error('Bike ID is required');
    }

    // Get current data dari database
    const { data: bike, error: fetchError } = await supabase
      .from("bikes")
      .select("unit")
      .eq("id", bikeId)
      .single();

    if (fetchError) {
      console.error('❌ Fetch error:', fetchError);
      throw fetchError;
    }

    const currentUnit = bike?.unit || 0;
    const newUnit = Math.max(0, currentUnit + change);

    console.log(`   Current: ${currentUnit}, New: ${newUnit}`);

    if (newUnit === currentUnit) {
      console.log('ℹ️ No change needed');
      return;
    }

    // Update database
    const { error: updateError } = await supabase
      .from("bikes")
      .update({ unit: newUnit })
      .eq("id", bikeId);

    if (updateError) {
      console.error('❌ Update error:', updateError);
      throw updateError;
    }

    console.log(`✅ Updated: ${currentUnit} → ${newUnit}`);

    // Refresh bikes state dengan fetchBikes
    console.log('🔄 Refreshing bikes...');
    await get().fetchBikes();
    
  } catch (error: any) {
    console.error("❌ Error in updateBikeUnit:", error?.message);
    throw error;
  }
},

  subscribeToBikes: () => {
    console.log('🔔 Setting up realtime subscription for bikes');
    
    const channel = supabase
      .channel('bikes-changes', { config: { broadcast: { self: true } } })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bikes',
        },
        (payload: any) => {
          console.log('🔔 REALTIME EVENT FIRED!', {
            eventType: payload.eventType,
            oldData: payload.old,
            newData: payload.new
          });
          
          // Handle semua event type (INSERT, UPDATE, DELETE)
          if (payload.new) {
            const newData = payload.new as any;
            const updatedBike: Bike = {
              id: newData.id,
              name: newData.name,
              brand: newData.brand,
              category: newData.category,
              fuel: newData.fuel,
              cc: newData.cc,
              price: newData.price,
              unit: newData.unit || 0,
              image_url: newData.image_url,
            };

            set((state) => {
              const updatedBikes = state.bikes.map((bike) =>
                bike.id === updatedBike.id ? updatedBike : bike
              );
              console.log('📝 Updated bikes state:', updatedBikes.map(b => ({ id: b.id, name: b.name, unit: b.unit })));
              return { bikes: updatedBikes };
            });

            console.log('✅ Real-time state updated:', updatedBike.name, `unit: ${updatedBike.unit}`);
          } else if (payload.old && !payload.new) {
            // DELETE event
            set((state) => ({
              bikes: state.bikes.filter((bike) => bike.id !== payload.old.id),
            }));
            console.log('🗑️ Bike deleted:', payload.old.id);
          }
        }
      )
      .subscribe((status: string, err?: any) => {
        console.log('📡 Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ SUBSCRIBED - Real-time is now ACTIVE');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ CHANNEL_ERROR:', err);
        } else if (status === 'CLOSED') {
          console.log('🔕 Subscription closed');
        } else if (status === 'TIMED_OUT') {
          console.warn('⏱️ Subscription timed out');
        }
      });

    // Return proper cleanup function
    return () => {
      console.log('🔕 Cleaning up bike subscription');
      supabase.removeChannel(channel);
    };
  },
}));