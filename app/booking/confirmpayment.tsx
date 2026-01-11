import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useTransactionStore } from "../../store/useTransactionStore";

export default function ConfirmPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addTransaction } = useTransactionStore();
  
  const [isSaving, setIsSaving] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Data dari halaman sebelumnya
  const orderNumber = params.orderNumber as string;
  const bikeName = params.bikeName as string;
  const bikeId = params.bikeId as string; // Keep as string (UUID format)
  const bikePrice = params.bikePrice as string;
  const startDate = params.startDate as string;
  const endDate = params.endDate as string;
  const duration = parseInt(params.duration as string);
  const total = parseFloat(params.total as string);
  const userName = params.userName as string || "John Doe";
  const userPhone = params.userPhone as string || "081234567890";

  // Get user ID dan simpan transaksi
  useEffect(() => {
    const initTransaction = async () => {
      try {
        console.log('🔵 START: Getting user and creating transaction');
        
        // 1. Ambil user yang sedang login
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('❌ Auth Error:', authError);
          Alert.alert('Error', 'Tidak dapat mengambil data user');
          setIsSaving(false);
          return;
        }

        if (!user) {
          console.error('❌ No user logged in');
          Alert.alert('Error', 'Anda harus login terlebih dahulu');
          router.replace('/(auth)/login');
          return;
        }

        console.log('✅ User ID:', user.id);
        setCurrentUserId(user.id);

        // 2. Simpan transaksi
        console.log('📦 Transaction Data:', {
          orderNumber,
          userId: user.id,
          userName,
          userPhone,
          bikeId,
          bikeName,
          bikePrice: parseInt(bikePrice),
          startDate,
          endDate,
          duration,
          totalPrice: total,
        });

        await addTransaction({
          orderNumber,
          userId: user.id,
          userName,
          userPhone,
          bikeId,
          bikeName,
          bikePrice: parseInt(bikePrice),
          startDate,
          endDate,
          duration,
          totalPrice: total,
          status: 'pending',
        });

        console.log('✅ Transaction created successfully');
        setIsSaving(false);
        
      } catch (error) {
        console.error('❌ Error in initTransaction:', error);
        Alert.alert('Error', 'Gagal menyimpan transaksi');
        setIsSaving(false);
      }
    };

    initTransaction();
  }, []); // Empty dependency array - only run once

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString("id-ID")}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) {
      const date = new Date();
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleBackToHome = () => {
    router.push("/(tabs)/home");
  };

  const handleWhatsAppConfirmation = () => {
    const message = `Halo Admin! Saya ingin mengkonfirmasi pesanan saya:

📝 No. Pesanan: ${orderNumber}
🏍️ Motor: ${bikeName}
📅 Periode: ${formatDate(startDate)} - ${formatDate(endDate)} (${duration} hari)
💰 Total: ${formatPrice(total)}

Mohon segera diproses ya, terima kasih!`;

    const encodedMessage = encodeURIComponent(message);
    const adminPhoneNumber = "6281338858678";
    const whatsappUrl = `whatsapp://send?phone=${adminPhoneNumber}&text=${encodedMessage}`;
    const webWhatsappUrl = `https://wa.me/${adminPhoneNumber}?text=${encodedMessage}`;

    const openWhatsApp = async () => {
      try {
        const canOpenWhatsApp = await Linking.canOpenURL(whatsappUrl);
        
        if (canOpenWhatsApp) {
          await Linking.openURL(whatsappUrl);
        } else {
          await Linking.openURL(webWhatsappUrl);
        }
      } catch (error) {
        console.log('Error opening WhatsApp:', error);
        Alert.alert(
          "Error", 
          "Tidak dapat membuka WhatsApp. Pastikan WhatsApp terinstall atau gunakan browser.",
          [
            { text: "OK" },
            { 
              text: "Coba Lagi", 
              onPress: () => Linking.openURL(webWhatsappUrl) 
            }
          ]
        );
      }
    };

    openWhatsApp();
  };

  // Show loading while saving
  if (isSaving) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={{ marginTop: 16, color: '#6B7280' }}>Menyimpan transaksi...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pesanan</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Success Message */}
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Pesanan Berhasil!</Text>
          <Text style={styles.successSubtitle}>
            Pesanan Anda telah dikirim ke admin dan menunggu konfirmasi
          </Text>
        </View>

        {/* Order Info */}
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderLabel}>No. Pesanan</Text>
              <Text style={styles.orderNumber}>{orderNumber}</Text>
            </View>
            <View style={styles.dateContainer}>
              <Text style={styles.dateLabel}>{formatDate()}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.bikeSection}>
            <Text style={styles.bikeName}>{bikeName}</Text>
            <Text style={styles.bikePrice}>{formatPrice(parseInt(bikePrice))} / hari</Text>
          </View>

          <View style={styles.periodSection}>
            <View style={styles.periodItem}>
              <Text style={styles.periodLabel}>Mulai Sewa</Text>
              <Text style={styles.periodValue}>{formatDate(startDate)}</Text>
            </View>
            <View style={styles.periodItem}>
              <Text style={styles.periodLabel}>Selesai Sewa</Text>
              <Text style={styles.periodValue}>{formatDate(endDate)}</Text>
            </View>
          </View>

          <View style={styles.durationSection}>
            <Text style={styles.durationLabel}>Durasi</Text>
            <Text style={styles.durationValue}>{duration} hari</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total Pembayaran</Text>
            <Text style={styles.totalPrice}>{formatPrice(total)}</Text>
          </View>

          <View style={styles.statusSection}>
            <View style={styles.statusBadge}>
              <Ionicons name="time-outline" size={16} color="#F59E0B" />
              <Text style={styles.statusText}>Menunggu Konfirmasi</Text>
            </View>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#3B82F6" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Langkah Selanjutnya</Text>
            <Text style={styles.infoText}>
              Klik tombol &quot;Konfirmasi via WhatsApp&quot; untuk menghubungi admin dan mengonfirmasi pesanan Anda. Admin akan memproses pesanan Anda segera.
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.whatsAppButton} onPress={handleWhatsAppConfirmation}>
          <Ionicons name="logo-whatsapp" size={24} color="#fff" />
          <Text style={styles.whatsAppButtonText}>Konfirmasi via WhatsApp</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.backButton} onPress={handleBackToHome}>
          <Ionicons name="arrow-back" size={20} color="#6B7280" />
          <Text style={styles.backButtonText}>Kembali ke Beranda</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  content: {
    flex: 1,
  },
  successCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  orderCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  orderLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  dateContainer: {
    alignItems: "flex-end",
  },
  dateLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  bikeSection: {
    marginBottom: 16,
  },
  bikeName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  bikePrice: {
    fontSize: 14,
    color: "#6B7280",
  },
  periodSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  periodItem: {
    flex: 1,
  },
  periodLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  periodValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  durationSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  durationLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  durationValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#16A34A",
  },
  statusSection: {
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#F59E0B",
  },
  infoCard: {
    backgroundColor: "#EFF6FF",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E40AF",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: "#3B82F6",
    lineHeight: 18,
  },
  bottomSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  whatsAppButton: {
    backgroundColor: "#25D366",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  whatsAppButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
});