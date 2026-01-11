import { router, useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useBikesStore } from '../../store/useBikeStore';

export default function ReturnMotorScreen() {
  const navigation = useNavigation();
  const { bikes, incrementBikeUnit } = useBikesStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [returnQuantities, setReturnQuantities] = useState<{ [key: string]: string }>({});

  // Hide header
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const filteredBikes = bikes.filter((bike) =>
    bike.name.toLowerCase().includes(searchQuery.toLowerCase())
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
          onPress: async () => {
            const success = await incrementBikeUnit(bikeId, returnQty);
            if (success) {
              setReturnQuantities({ ...returnQuantities, [bikeId]: '' });
              Alert.alert('Sukses', `${returnQty} unit ${bikeName} berhasil ditambahkan ke stok`);
            } else {
              Alert.alert('Error', 'Gagal menambahkan unit ke stok');
            }
          },
        },
      ]
    );
  };

  const handleBackToAdmin = () => {
    router.push('/(tabs)/AdminCRUDScreen');
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
        <View style={styles.container}>
          {/* Header dengan tombol kembali */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackToAdmin}>
              <Text style={styles.backButtonText}>Kembali</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Pengembalian Motor</Text>
          </View>

          <Text style={styles.subtitle}>
            Admin dapat menambahkan unit motor yang sudah dikembalikan.
          </Text>

          {/* Search Input */}
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama motor..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Motor List */}
          <ScrollView style={styles.scrollView}>
            {filteredBikes.map((bike) => (
              <View key={bike.id} style={styles.card}>
                <Text style={styles.bikeName}>{bike.name}</Text>
                <Text style={styles.bikeInfo}>Merk: {bike.brand}</Text>
                <Text style={styles.bikeInfo}>Unit Sekarang: {bike.unit}</Text>

                <TextInput
                  style={styles.quantityInput}
                  placeholder="Jumlah unit dikembalikan"
                  keyboardType="numeric"
                  value={returnQuantities[bike.id] || ''}
                  onChangeText={(text) =>
                    setReturnQuantities({ ...returnQuantities, [bike.id]: text })
                  }
                />

                <TouchableOpacity
                  style={styles.returnButton}
                  onPress={() => handleReturnBike(bike.id, bike.name)}
                >
                  <Text style={styles.returnButtonText}>Kembalikan</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  backButtonText: {
    color: '#2563EB',
    fontWeight: 'bold',
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#111827',
  },
  subtitle: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bikeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  bikeInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  returnButton: {
    backgroundColor: '#22C55E',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  returnButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});