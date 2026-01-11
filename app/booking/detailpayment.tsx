import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Clipboard,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function DetailPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const orderNumber = params.orderNumber as string;
  const bikeName = params.bikeName as string;
  const paymentMethod = params.paymentMethod as string;
  const total = parseFloat(params.total as string);

  const [showInstructions, setShowInstructions] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(2 * 60 * 60); // 2 jam dalam detik

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          Alert.alert(
            "Waktu Habis",
            "Waktu pembayaran telah habis. Silakan buat pesanan baru.",
            [
              {
                text: "OK",
                onPress: () => router.push("/(tabs)/home"),
              },
            ]
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format waktu
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours} Jam ${minutes} Menit ${secs} Detik`;
    }
    return `${minutes} Menit ${secs} Detik`;
  };

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString("id-ID")}`;
  };

  // Data rekening berdasarkan metode pembayaran
  const getAccountInfo = () => {
    const accounts: {
      [key: string]: { name: string; number: string; holder: string };
    } = {
      bca: {
        name: "Bank BCA",
        number: "8648492015",
        holder: "Dadang Suharjo",
      },
      mandiri: {
        name: "Bank Mandiri",
        number: "1234567890",
        holder: "Dadang Suharjo",
      },
      gopay: {
        name: "GO-PAY",
        number: "081234567890",
        holder: "Dadang Suharjo",
      },
      ovo: { name: "OVO", number: "081234567890", holder: "Dadang Suharjo" },
    };
    return (
      accounts[paymentMethod] || {
        name: "Unknown",
        number: "0000000000",
        holder: "Unknown",
      }
    );
  };

  const accountInfo = getAccountInfo();

  const getMethodIcon = () => {
    try {
      if (paymentMethod === "bca")
        return require("../../assets/images/bca.png");
      if (paymentMethod === "mandiri")
        return require("../../assets/images/mandiri.png");
      if (paymentMethod === "gopay")
        return require("../../assets/images/gopay.png");
      if (paymentMethod === "ovo") return require("../../assets/images/ovo.png");
    } catch {
      return null;
    }
    return null;
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert("Tersalin", `${label} telah disalin ke clipboard`);
  };

  const handlePaymentConfirm = () => {
    router.push({
      pathname: "/booking/confirmpayment",
      params: {
        ...params,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Pesanan</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.subtitle}>No. Pesanan {orderNumber}</Text>

        {/* Warning Message */}
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            Selesaikan pembayaran kamu dalam{" "}
            <Text style={styles.warningBold}>{formatTime(timeRemaining)}</Text>
          </Text>
        </View>

        {/* Payment Method */}
        <View style={styles.card}>
          <View style={styles.methodHeader}>
            <Text style={styles.cardTitle}>{accountInfo.name}</Text>
            {getMethodIcon() && (
              <Image source={getMethodIcon()!} style={styles.bankIcon} />
            )}
          </View>

          <View style={styles.accountSection}>
            <View style={styles.accountRow}>
              <View style={styles.accountInfo}>
                <Text style={styles.accountLabel}>Nomor Rekening</Text>
                <Text style={styles.accountNumber}>{accountInfo.number}</Text>
              </View>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() =>
                  copyToClipboard(accountInfo.number, "Nomor rekening")
                }
              >
                <Ionicons name="copy-outline" size={20} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.accountSection}>
            <View style={styles.accountRow}>
              <View style={styles.accountInfo}>
                <Text style={styles.accountLabel}>Jumlah Total Bayar</Text>
                <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
              </View>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() =>
                  copyToClipboard(total.toString(), "Jumlah pembayaran")
                }
              >
                <Ionicons name="copy-outline" size={20} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.noteSection}>
            <Text style={styles.noteText}>
              Transfer persis sama sampai 3 digit terakhir ya!
            </Text>
          </View>

          <View style={styles.holderSection}>
            <Text style={styles.holderLabel}>Atas nama penerima</Text>
            <Text style={styles.holderName}>{accountInfo.holder}</Text>
          </View>

          <TouchableOpacity
            style={styles.instructionButton}
            onPress={() => setShowInstructions(!showInstructions)}
          >
            <Text style={styles.instructionText}>
              Cara Transfer {accountInfo.name}
            </Text>
            <Ionicons
              name={showInstructions ? "chevron-up" : "chevron-down"}
              size={20}
              color="#3B82F6"
            />
          </TouchableOpacity>

          {showInstructions && (
            <View style={styles.instructionContent}>
              <Text style={styles.instructionStep}>
                1. Login ke aplikasi {accountInfo.name}
              </Text>
              <Text style={styles.instructionStep}>
                2. Pilih menu Transfer
              </Text>
              <Text style={styles.instructionStep}>
                3. Masukkan nomor rekening tujuan
              </Text>
              <Text style={styles.instructionStep}>
                4. Masukkan nominal transfer
              </Text>
              <Text style={styles.instructionStep}>
                5. Konfirmasi transaksi
              </Text>
            </View>
          )}
        </View>

        {/* Help Section */}
        <View style={styles.helpCard}>
          <Text style={styles.helpText}>
            Bantu kami mengkonfirmasi pembayaran kamu dengan mengetuk tombol
            &quot;Sudah Bayar&quot; di bawah.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.confirmButton} onPress={handlePaymentConfirm}>
          <Text style={styles.confirmButtonText}>Sudah Bayar</Text>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#16A34A",
    gap: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    flex: 1,
  },
  subtitle: {
    fontSize: 12,
    color: "#6B7280",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  warningCard: {
    backgroundColor: "#FEF3C7",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  warningText: {
    fontSize: 12,
    color: "#92400E",
  },
  warningBold: {
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
  },
  methodHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  bankIcon: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  accountSection: {
    marginBottom: 16,
  },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accountInfo: {
    flex: 1,
  },
  accountLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  copyButton: {
    padding: 8,
  },
  noteSection: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  noteText: {
    fontSize: 12,
    color: "#92400E",
    textAlign: "center",
  },
  holderSection: {
    marginBottom: 16,
  },
  holderLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  holderName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  instructionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  instructionText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "500",
  },
  instructionContent: {
    paddingTop: 12,
  },
  instructionStep: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
    lineHeight: 20,
  },
  helpCard: {
    backgroundColor: "#E0F2FE",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  helpText: {
    fontSize: 12,
    color: "#075985",
    lineHeight: 18,
  },
  bottomSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  confirmButton: {
    backgroundColor: "#16A34A",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});