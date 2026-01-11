import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { supabase, supabaseAdmin } from "../../lib/supabase";
import { useBikesStore } from "../../store/useBikeStore";
import { TransactionStatus, useTransactionStore } from "../../store/useTransactionStore";

export default function AdminCRUDScreen() {
  const { bikes, setBikes, addBike, updateBike } = useBikesStore();
  const { transactions, updateTransactionStatus, fetchAllTransactions, subscribeToAllTransactions } = useTransactionStore();

  // State Management
  const [activeTab, setActiveTab] = useState<"motors" | "returns" | "transactions">("motors");
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentBikeId, setCurrentBikeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [returnQuantities, setReturnQuantities] = useState<{ [key: string]: string }>({});
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | 'all'>('all');

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "",
    fuel: "Bensin",
    cc: "",
    price: "",
    unit: "", // ✅ TAMBAH FIELD UNIT
    image: null as string | null,
  });
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") {
      ImagePicker.requestMediaLibraryPermissionsAsync();
      ImagePicker.requestCameraPermissionsAsync();
    }
  }, []);

  useEffect(() => {
    console.log('📥 Admin useEffect: Fetching all transactions');
    fetchAllTransactions();
    
    console.log('🔔 Admin: Setting up realtime subscription');
    const unsubscribe = subscribeToAllTransactions();
    
    return () => {
      console.log('🔕 Admin: Cleaning up subscription');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    console.log('📊 Transactions updated:', {
      total: transactions.length,
      pending: transactions.filter(t => t.status === 'pending').length,
      data: transactions
    });
  }, [transactions]);

  const resetForm = () => {
    setFormData({
      name: "",
      brand: "",
      category: "",
      fuel: "Bensin",
      cc: "",
      price: "",
      unit: "", // ✅ RESET UNIT
      image: null,
    });
    setEditMode(false);
    setCurrentBikeId(null);
    setImageUri(null);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // ✅ UPLOAD IMAGE KE SUPABASE STORAGE
  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      console.log('📤 Starting image upload...', uri);
      
      // Generate unique filename
      const fileName = `motor_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      
      // Read file as base64
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Convert blob to array buffer for React Native
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });

      console.log('📦 File prepared, uploading to Supabase...');
      
      // Upload using admin client
      const { data, error } = await supabaseAdmin.storage
        .from('motor-images')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
          cacheControl: '3600'
        });
      
      if (error) {
        console.error('❌ Supabase upload error:', error);
        throw error;
      }
      
      console.log('✅ Upload successful:', data);
      
      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('motor-images')
        .getPublicUrl(fileName);
      
      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }
      
      console.log('🔗 Public URL:', urlData.publicUrl);
      return urlData.publicUrl;
      
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      
      // Show user-friendly error
      Alert.alert(
        "Upload Gagal", 
        `Error: ${error.message}\n\nSilakan coba:\n1. Pilih gambar lagi\n2. Atau gunakan URL manual`,
        [{ text: 'OK' }]
      );
      
      return null;
    }
  };

  const filteredBikes = bikes.filter((bike) =>
    bike.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTransactions = transactions.filter((trx) => 
    filterStatus === 'all' ? true : trx.status === filterStatus
  );

  const handleReturnBike = async (bikeId: string, bikeName: string) => {
    const returnQty = parseInt(returnQuantities[bikeId] || '0');

    if (!returnQty || returnQty <= 0) {
      Alert.alert('Error', 'Masukkan jumlah unit yang valid');
      return;
    }

    Alert.alert(
      'Konfirmasi',
      `Tambahkan ${returnQty} unit ${bikeName} ke stok?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Tambahkan',
          onPress: () => {
            setReturnQuantities({ ...returnQuantities, [bikeId]: '' });
            Alert.alert('Sukses', `${returnQty} unit ${bikeName} berhasil ditambahkan ke stok`);
          },
        },
      ]
    );
  };

  const handleAddNew = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleEdit = (bike: any) => {
    setFormData({
      name: bike.name,
      brand: bike.brand,
      category: bike.category,
      fuel: bike.fuel,
      cc: bike.cc.toString(),
      price: bike.price.toString(),
      unit: bike.unit.toString(), // ✅ SET UNIT SAAT EDIT
      image: bike.image_url,
    });
    setCurrentBikeId(bike.id);
    setEditMode(true);
    setImageUri(bike.image_url);
    setModalVisible(true);
  };

  const handleSave = async () => {
    const cc = parseInt(formData.cc);
    const price = parseInt(formData.price);
    const unit = parseInt(formData.unit);

    // ✅ VALIDASI
    if (!formData.name || !formData.brand || !formData.category || !formData.unit) {
      Alert.alert("Error", "Lengkapi semua data termasuk jumlah unit");
      return;
    }

    if (isNaN(unit) || unit < 0) {
      Alert.alert("Error", "Jumlah unit harus berupa angka dan tidak boleh negatif");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      Alert.alert("Error", "Anda harus login terlebih dahulu");
      return;
    }

    setIsUploading(true);

    try {
      let imageUrl = formData.image;

      // ✅ PRIORITAS 1: Upload gambar baru dari galeri
      if (imageUri && imageUri !== formData.image) {
        console.log('🖼️ New image selected, uploading...');
        
        const uploadedUrl = await uploadImage(imageUri);
        
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
          console.log('✅ Image uploaded successfully:', imageUrl);
        } else {
          // Upload gagal, tanyakan user mau lanjut tanpa gambar atau batal
          Alert.alert(
            "Upload Gagal",
            "Gambar gagal diupload. Apakah Anda ingin:\n\n1. Simpan motor tanpa gambar\n2. Batalkan dan coba lagi",
            [
              { 
                text: "Simpan Tanpa Gambar", 
                onPress: () => {
                  imageUrl = null;
                }
              },
              { 
                text: "Batalkan", 
                style: "cancel",
                onPress: () => {
                  setIsUploading(false);
                  return;
                }
              }
            ]
          );
          
          setIsUploading(false);
          return;
        }
      } 
      // ✅ PRIORITAS 2: Gunakan URL manual jika ada
      else if (formData.image && formData.image.trim()) {
        imageUrl = formData.image.trim();
        console.log('🔗 Using manual URL:', imageUrl);
      }

      const bikeData = {
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        fuel: formData.fuel,
        cc: cc,
        price: price,
        unit: unit,
        image_url: imageUrl || null,
      };

      if (editMode && currentBikeId) {
        console.log('🔄 Updating bike:', currentBikeId, bikeData);
        await updateBike(currentBikeId, bikeData);
        Alert.alert('Sukses', '✅ Motor berhasil diupdate!');
      } else {
        console.log('➕ Adding new bike:', bikeData);
        await addBike(bikeData);
        Alert.alert('Sukses', '✅ Motor berhasil ditambahkan!');
      }

      setModalVisible(false);
      resetForm();
    } catch (error: any) {
      console.error('❌ Save error:', error);
      Alert.alert("Error", error.message || "Gagal menyimpan motor");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Hapus Motor", `Hapus ${name}?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: () => {
          setBikes(bikes.filter((b) => b.id !== id));
        },
      },
    ]);
  };

// ===== FILE: screens/admin/AdminCRUDScreen.tsx =====
// GANTI fungsi handleUpdateStatus dengan ini:

const handleUpdateStatus = async (transactionId: string, newStatus: TransactionStatus) => {
  const statusLabels = {
    pending: 'Menunggu',
    confirmed: 'Dikonfirmasi',
    ongoing: 'Berlangsung',
    completed: 'Selesai',
    cancelled: 'Dibatalkan'
  };

  Alert.alert(
    'Ubah Status',
    `Ubah status transaksi ke "${statusLabels[newStatus]}"?`,
    [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Ubah',
        onPress: async () => {
          try {
            console.log(`\n\n🔄 ===== START STATUS UPDATE =====`);
            console.log(`📍 Transaction ID: ${transactionId}`);
            console.log(`📊 New Status: ${newStatus}`);
            
            // GET CURRENT STATE SEBELUM UPDATE
            const currentBikes = bikes;
            const currentTransaction = transactions.find(t => t.id === transactionId);
            
            console.log(`\n📦 BEFORE UPDATE:`);
            console.log(`   Bike ID: ${currentTransaction?.bikeId}`);
            console.log(`   Bike Name: ${currentTransaction?.bikeName}`);
            console.log(`   Current Unit: ${currentBikes.find(b => b.id === currentTransaction?.bikeId)?.unit}`);
            console.log(`   Transaction Status: ${currentTransaction?.status} → ${newStatus}`);
            
            // CALL UPDATE
            await updateTransactionStatus(transactionId, newStatus);
            
            // DELAY UNTUK TUNGGU REAL-TIME
            console.log(`\n⏳ Waiting 2 seconds for real-time updates...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // GET CURRENT STATE SETELAH UPDATE - gunakan state langsung dari store
            const bikesAfter = useBikesStore.getState().bikes;
            const transactionAfter = transactions.find(t => t.id === transactionId);
            const bikeAfterUpdate = bikesAfter.find(b => b.id === currentTransaction?.bikeId);
            
            console.log(`\n📦 AFTER UPDATE:`);
            console.log(`   Bike Unit Now: ${bikeAfterUpdate?.unit}`);
            console.log(`   Transaction Status Now: ${transactionAfter?.status}`);
            console.log(`\n🔄 ===== END STATUS UPDATE =====\n`);
            
            const successMessages = {
              confirmed: 'Transaksi berhasil dikonfirmasi! Unit motor berkurang 1',
              ongoing: 'Status berhasil diubah ke Berlangsung!',
              completed: 'Transaksi selesai! Unit motor bertambah 1',
              cancelled: 'Transaksi dibatalkan! Unit motor dikembalikan',
              pending: 'Status berhasil diubah ke Menunggu!'
            };
            
            Alert.alert('Sukses', successMessages[newStatus] || 'Status transaksi berhasil diubah');
          } catch (error: any) {
            console.error('❌ Error updating status:', error);
            Alert.alert('Error', error.message || 'Gagal mengupdate status transaksi');
          }
        },
      },
    ]
  );
};


// ===== FILE: screens/home/HomeScreen.tsx =====
// GANTI useEffect yang monitor bikes dengan ini:

useEffect(() => {
  console.log(`\n🏠 ===== BIKES DATA CHANGED (HOME) =====`);
  console.log(`Total bikes: ${bikes.length}`);
  bikes.forEach(bike => {
    console.log(`   🏍️  ${bike.name} (ID: ${bike.id})`);
    console.log(`        Units: ${bike.unit} | Category: ${bike.category}`);
  });
  console.log(`🏠 ===== END BIKES DATA =====\n`);
}, [bikes]);


// ===== STEP 2: Di HomeScreen - Monitor perubahan bikes =====
// Ganti useEffect yang monitor bikes dengan ini:

useEffect(() => {
  console.log(`\n🏠 ===== BIKES DATA CHANGED =====`);
  bikes.forEach(bike => {
    console.log(`   🏍️  ${bike.name} (${bike.id}): ${bike.unit} units`);
  });
  console.log(`🏠 ===== END BIKES DATA =====\n`);
}, [bikes]);


// ===== STEP 3: Check real-time trigger di useBikesStore =====
// Di subscribeToBikes, tambahkan log di payload handling:

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
      console.log(`\n🔔 ===== REALTIME EVENT =====`);
      console.log(`   Event Type: ${payload.eventType}`);
      console.log(`   Bike ID: ${payload.new?.id}`);
      console.log(`   New Unit: ${payload.new?.unit}`);
      console.log(`   Old Unit: ${payload.old?.unit}`);
      
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
          const existsInState = state.bikes.some(b => b.id === updatedBike.id);
          let updatedBikes;
          
          if (existsInState) {
            updatedBikes = state.bikes.map((bike) =>
              bike.id === updatedBike.id ? updatedBike : bike
            );
          } else {
            // Jika bike belum di state, tambahkan
            updatedBikes = [updatedBike, ...state.bikes];
          }
          
          console.log(`   Updated bikes state:`, updatedBikes.map(b => ({ id: b.id, name: b.name, unit: b.unit })));
          return { bikes: updatedBikes };
        });

        console.log(`✅ Real-time state updated: ${updatedBike.name}`);
      }
      
      console.log(`🔔 ===== END REALTIME EVENT =====\n`);
    }
  )
  .subscribe((status: string, err?: any) => {
    console.log(`📡 Subscription status: ${status}`);
    if (status === 'SUBSCRIBED') {
      console.log('✅ Real-time is ACTIVE');
    }
  });

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'confirmed': return '#3B82F6';
      case 'ongoing': return '#8B5CF6';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: TransactionStatus) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'confirmed': return 'Dikonfirmasi';
      case 'ongoing': return 'Berlangsung';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const renderMotorsContent = () => (
    <ScrollView style={styles.contentContainer}>
      {bikes.map((bike) => (
        <View key={bike.id} style={styles.listItem}>
          <View style={styles.itemLeft}>
            {/* ✅ TAMPILKAN GAMBAR MOTOR */}
            {bike.image_url ? (
              <Image 
                source={{ uri: bike.image_url }} 
                style={styles.bikeImageThumb}
              />
            ) : (
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>🏍️</Text>
              </View>
            )}
            
            <View style={styles.itemInfo}>
              <Text style={styles.bikeName}>{bike.name}</Text>
              <Text style={styles.bikeSpec}>
                {bike.brand} • {bike.cc}cc • {bike.category}
              </Text>
              <Text style={styles.price}>
                Rp {bike.price.toLocaleString()} / hari
              </Text>
              {/* ✅ TAMPILKAN UNIT */}
              <Text style={styles.unitBadgeSmall}>
                Stok: {bike.unit || 0} unit
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleEdit(bike)}
            >
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleDelete(bike.id, bike.name)}
            >
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderTransactionsContent = () => (
    <View style={styles.transactionsContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        scrollEnabled={true}
        style={styles.filterContainer}
        contentContainerStyle={{flexGrow: 0}}
      >
        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'all' && styles.filterChipActive]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.filterText, filterStatus === 'all' && styles.filterTextActive]}>
            Semua ({transactions.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'pending' && styles.filterChipActive]}
          onPress={() => setFilterStatus('pending')}
        >
          <Text style={[styles.filterText, filterStatus === 'pending' && styles.filterTextActive]}>
            Menunggu ({transactions.filter(t => t.status === 'pending').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'confirmed' && styles.filterChipActive]}
          onPress={() => setFilterStatus('confirmed')}
        >
          <Text style={[styles.filterText, filterStatus === 'confirmed' && styles.filterTextActive]}>
            Dikonfirmasi ({transactions.filter(t => t.status === 'confirmed').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'ongoing' && styles.filterChipActive]}
          onPress={() => setFilterStatus('ongoing')}
        >
          <Text style={[styles.filterText, filterStatus === 'ongoing' && styles.filterTextActive]}>
            Berlangsung ({transactions.filter(t => t.status === 'ongoing').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'completed' && styles.filterChipActive]}
          onPress={() => setFilterStatus('completed')}
        >
          <Text style={[styles.filterText, filterStatus === 'completed' && styles.filterTextActive]}>
            Selesai ({transactions.filter(t => t.status === 'completed').length})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ScrollView style={styles.transactionsList}>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Tidak ada transaksi</Text>
            <Text style={styles.emptySubtext}>
              {filterStatus === 'all' 
                ? 'Belum ada transaksi yang masuk'
                : `Tidak ada transaksi dengan status "${getStatusLabel(filterStatus as TransactionStatus)}"`
              }
            </Text>
          </View>
        ) : (
          filteredTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <View>
                  <Text style={styles.orderNumber}>{transaction.orderNumber || 'N/A'}</Text>
                  <Text style={styles.transactionDate}>
                    {transaction.createdAt ? formatDate(transaction.createdAt) : 'N/A'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                    {getStatusLabel(transaction.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.customerSection}>
                <Text style={styles.sectionLabel}>Pelanggan</Text>
                <Text style={styles.customerName}>{transaction.userName || 'N/A'}</Text>
                <Text style={styles.customerPhone}>📱 {transaction.userPhone || 'N/A'}</Text>
              </View>

              <View style={styles.bikeInfoSection}>
                <View style={styles.iconCircleSmall}>
                  <Text style={styles.iconTextSmall}>🏍️</Text>
                </View>
                <View style={styles.bikeDetails}>
                  <Text style={styles.bikeName}>{transaction.bikeName || 'N/A'}</Text>
                  <Text style={styles.bikePrice}>
                    Rp {(transaction.bikePrice || 0).toLocaleString()} × {transaction.duration || 0} hari
                  </Text>
                </View>
              </View>

              <View style={styles.periodSection}>
                <View style={styles.periodItem}>
                  <Text style={styles.periodLabel}>Mulai</Text>
                  <Text style={styles.periodDate}>
                    {transaction.startDate ? formatDate(transaction.startDate) : 'N/A'}
                  </Text>
                </View>
                <Text style={styles.periodArrow}>→</Text>
                <View style={styles.periodItem}>
                  <Text style={styles.periodLabel}>Selesai</Text>
                  <Text style={styles.periodDate}>
                    {transaction.endDate ? formatDate(transaction.endDate) : 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>Total Pembayaran</Text>
                <Text style={styles.totalPrice}>
                  Rp {(transaction.totalPrice || 0).toLocaleString()}
                </Text>
              </View>

              <View style={styles.actionButtons}>
                {transaction.status === 'pending' && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.confirmButton]}
                      onPress={() => handleUpdateStatus(transaction.id, 'confirmed')}
                    >
                      <Text style={styles.actionButtonText}>✓ Konfirmasi</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleUpdateStatus(transaction.id, 'cancelled')}
                    >
                      <Text style={styles.actionButtonText}>✕ Tolak</Text>
                    </TouchableOpacity>
                  </>
                )}

                {transaction.status === 'confirmed' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.ongoingButton]}
                    onPress={() => handleUpdateStatus(transaction.id, 'ongoing')}
                  >
                    <Text style={styles.actionButtonText}>🚀 Mulai Sewa</Text>
                  </TouchableOpacity>
                )}

                {transaction.status === 'ongoing' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={() => handleUpdateStatus(transaction.id, 'completed')}
                  >
                    <Text style={styles.actionButtonText}>✓ Selesaikan</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );

  const renderReturnsContent = () => (
    <View style={styles.returnsContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Cari motor..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#9CA3AF"
      />

      <ScrollView style={styles.returnsList}>
        {filteredBikes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Tidak ada motor</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Motor tidak ditemukan' : 'Belum ada motor yang ditambahkan'}
            </Text>
          </View>
        ) : (
          filteredBikes.map((bike) => (
            <View key={bike.id} style={styles.returnCard}>
              <View style={styles.returnHeader}>
                <View style={styles.returnInfo}>
                  <Text style={styles.returnBikeName}>{bike.name}</Text>
                  <Text style={styles.returnBikeDetail}>
                    {bike.brand} • {bike.cc}cc • {bike.category}
                  </Text>
                  <View style={styles.unitBadge}>
                    <Text style={styles.unitText}>Stok: {bike.unit || 0} unit</Text>
                  </View>
                </View>
              </View>

              <View style={styles.returnInputContainer}>
                <TextInput
                  style={styles.returnInput}
                  placeholder="Jumlah unit yang dikembalikan"
                  keyboardType="numeric"
                  value={returnQuantities[bike.id] || ''}
                  onChangeText={(value) =>
                    setReturnQuantities({ ...returnQuantities, [bike.id]: value })
                  }
                  placeholderTextColor="#9CA3AF"
                />

                <TouchableOpacity
                  style={styles.returnButton}
                  onPress={() => handleReturnBike(bike.id, bike.name)}
                >
                  <Text style={styles.returnButtonText}>Tambah ke Stok</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hi Admin!</Text>
          <Text style={styles.subGreeting}>Welcome back to your panel.</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "motors" && styles.activeTab]}
            onPress={() => setActiveTab("motors")}
          >
            <Text style={[styles.tabText, activeTab === "motors" && styles.activeTabText]}>
              Tambah Motor
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "returns" && styles.activeTab]}
            onPress={() => setActiveTab("returns")}
          >
            <Text style={[styles.tabText, activeTab === "returns" && styles.activeTabText]}>
              Pengembalian
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "transactions" && styles.activeTab]}
            onPress={() => setActiveTab("transactions")}
          >
            <Text style={[styles.tabText, activeTab === "transactions" && styles.activeTabText]}>
              Transaksi
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "motors" && renderMotorsContent()}
        {activeTab === "returns" && renderReturnsContent()}
        {activeTab === "transactions" && renderTransactionsContent()}

        {activeTab === "motors" && (
          <TouchableOpacity style={styles.fab} onPress={handleAddNew}>
            <Text style={styles.fabIcon}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editMode ? "Edit Motor" : "Tambah Motor"}
              </Text>

              <TextInput 
                style={styles.input} 
                placeholder="Nama Motor" 
                value={formData.name}
                onChangeText={(t) => setFormData({ ...formData, name: t })} 
              />
              <TextInput 
                style={styles.input} 
                placeholder="Merk (Honda, Yamaha, dll)" 
                value={formData.brand}
                onChangeText={(t) => setFormData({ ...formData, brand: t })} 
              />
              <TextInput 
                style={styles.input} 
                placeholder="Kategori (Matic, Sport, Manual)" 
                value={formData.category}
                onChangeText={(t) => setFormData({ ...formData, category: t })} 
              />
              <TextInput 
                style={styles.input} 
                placeholder="CC (150, 250, dll)" 
                keyboardType="numeric"
                value={formData.cc} 
                onChangeText={(t) => setFormData({ ...formData, cc: t })} 
              />
              <TextInput 
                style={styles.input} 
                placeholder="Harga Sewa per Hari (Rp)" 
                keyboardType="numeric"
                value={formData.price} 
                onChangeText={(t) => setFormData({ ...formData, price: t })} 
              />

              {/* ✅ INPUT UNIT */}
              <TextInput 
                style={styles.input} 
                placeholder="Jumlah Unit yang Tersedia" 
                keyboardType="numeric"
                value={formData.unit} 
                onChangeText={(t) => setFormData({ ...formData, unit: t })} 
              />

              {/* ✅ IMAGE PICKER */}
              <Text style={styles.inputLabel}>📸 Gambar Motor</Text>
              
              <TouchableOpacity 
                style={styles.imagePickerButton} 
                onPress={pickImage}
              >
                <Text style={styles.imagePickerText}>
                  {imageUri ? "✅ Ganti Gambar" : "📷 Pilih Gambar dari Galeri"}
                </Text>
              </TouchableOpacity>
              
              {/* ✅ PREVIEW GAMBAR */}
              {imageUri && (
                <View style={styles.previewContainer}>
                  <Text style={styles.previewLabel}>Preview:</Text>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  <Text style={styles.successText}>
                    ✅ Gambar siap diupload saat Simpan Motor
                  </Text>
                </View>
              )}

              {/* Optional: Manual URL Input */}
              <Text style={styles.inputLabel}>🔗 Atau Gunakan URL Gambar (Opsional)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="https://example.com/motor.jpg (kosongkan jika pakai galeri)" 
                value={formData.image || ''}
                onChangeText={(t) => setFormData({ ...formData, image: t })} 
                multiline
              />

              <TouchableOpacity 
                style={[styles.saveButton, isUploading && styles.saveButtonDisabled]} 
                onPress={handleSave}
                disabled={isUploading}
              >
                <Text style={styles.saveButtonText}>
                  {isUploading ? "⏳ Menyimpan..." : "💾 Simpan Motor"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F3F4F6" 
  },
  
  header: {
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 2,
  },
  

  
  greeting: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: "#111827" 
  },
  
  subGreeting: { 
    fontSize: 14, 
    color: "#6B7280", 
    marginTop: 4 
  },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
    elevation: 2,
  },

  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },

  activeTab: {
    backgroundColor: "#16A34A",
  },

  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },

  activeTabText: {
    color: "#fff",
  },

  contentContainer: {
    flex: 1,
    padding: 16,
  },

  listItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 1,
  },

  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  iconText: {
    fontSize: 24,
  },

  itemInfo: {
    flex: 1,
  },

  bikeName: { 
    fontSize: 16, 
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  
  bikeSpec: { 
    fontSize: 12, 
    color: "#6B7280",
    marginBottom: 4,
  },
  
  price: { 
    fontSize: 13, 
    fontWeight: "600",
    color: "#16A34A",
  },

  actions: { 
    flexDirection: "row",
    gap: 8,
  },

  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  editIcon: {
    fontSize: 16,
  },

  deleteIcon: {
    fontSize: 16,
  },

rejectButton: {
  backgroundColor: "#EF4444",
},

  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  fabIcon: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "300",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },

  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },

  emptySubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContainer: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    width: "90%",
    maxHeight: "80%",
  },

  modalTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    marginBottom: 16,
    color: "#111827",
  },

  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },

  imagePickerButton: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },

  imagePickerText: {
    fontSize: 14,
    color: "#16A34A",
    fontWeight: "600",
  },

  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },

  saveButton: {
    backgroundColor: "#16A34A",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },

  saveButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },

  saveButtonText: { 
    color: "#fff", 
    fontWeight: "bold",
    fontSize: 16,
  },

  cancelButton: { 
    alignItems: "center", 
    marginTop: 12,
    padding: 12,
  },

  cancelButtonText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
  },

  // Returns Section Styles
  returnsContainer: {
    flex: 1,
    padding: 16,
  },

  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    color: "#111827",
  },

  returnsList: {
    flex: 1,
  },

  returnCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },

  returnHeader: {
    flexDirection: "row",
    marginBottom: 16,
  },

  returnInfo: {
    flex: 1,
  },

  returnBikeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },

  returnBikeDetail: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },

  unitBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },

  unitText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16A34A",
  },

  returnInputContainer: {
    gap: 8,
  },

  returnInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#F9FAFB",
  },

  returnButton: {
    backgroundColor: "#16A34A",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  returnButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },

  // Transactions Section Styles
  // transactionsContainer: {
  //   flex: 1,
  // },

  filterContainer: {
  paddingHorizontal: 12,
  paddingVertical: 8,
  backgroundColor: "#F3F4F6",
  // borderBottomWidth: 1,
  // borderBottomColor: "#ffffffff",
  marginTop: 10,
},

filterChip: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 20,
  borderWidth: 0.5,
  borderColor: "black",
  height: 32,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#F3F4F6",
  marginRight: 6,
},

transactionsContainer: {
  flex: 1,
  // flexDirection: "column",
  backgroundColor: "#F3F4F6",
},

transactionsList: {
  flex: 0,
  padding: 12,
  paddingVertical: 10,
  backgroundColor: "#F3F4F6",
},

  filterChipActive: {
    backgroundColor: "#16A34A",
  },

  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },

  filterTextActive: {
    color: "#fff",
  },

  // transactionsList: {
  //   flex: 1,
  //   padding: 16,
  // },

  transactionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },

  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },

  transactionDate: {
    fontSize: 12,
    color: "#6B7280",
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  customerSection: {
    marginBottom: 16,
  },

  sectionLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
    fontWeight: "600",
  },

  customerName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },

  customerPhone: {
    fontSize: 13,
    color: "#6B7280",
  },

  bikeInfoSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },

  iconCircleSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  iconTextSmall: {
    fontSize: 20,
  },

  bikeDetails: {
    flex: 1,
  },

  bikePrice: {
    fontSize: 12,
    color: "#6B7280",
  },

  periodSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },

  periodItem: {
    flex: 1,
  },

  periodLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 4,
  },

  periodDate: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },

  periodArrow: {
    fontSize: 20,
    color: "#9CA3AF",
    marginHorizontal: 8,
  },

  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginBottom: 12,
  },

  totalLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },

  totalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#16A34A",
  },

  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },

  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  confirmButton: {
    backgroundColor: "#3B82F6",
  },

  ongoingButton: {
    backgroundColor: "#8B5CF6",
  },

  completeButton: {
    backgroundColor: "#10B981",
  },

  // cancelButton: {
  //   flex: 1,
  //   paddingVertical: 12,
  //   borderRadius: 8,
  //   alignItems: "center",
  //   backgroundColor: "#fff",
  //   borderWidth: 1,
  //   borderColor: "#EF4444",
  // },

  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  // cancelButtonText: {
  //   color: "#EF4444",
  //   fontWeight: "600",
  //   fontSize: 14,
  // },
});