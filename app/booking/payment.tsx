import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const orderNumber = params.orderNumber as string;
  const bikeName = params.bikeName as string;
  const bikePrice = parseFloat(params.bikePrice as string);
  const paymentMethod = params.paymentMethod as string;
  
  // ⭐ GUNAKAN total dari params (sudah dihitung di confirmbooking)
  const total = parseFloat(params.total as string);
  const subtotal = parseFloat(params.subtotal as string);
  const discount = parseFloat(params.discount as string);

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString("id-ID")}`;
  };

  const getMethodName = () => {
    const methods: { [key: string]: string } = {
      bca: "Bank BCA",
      mandiri: "Bank Mandiri",
      gopay: "GO-PAY",
      ovo: "OVO",
    };
    return methods[paymentMethod] || paymentMethod;
  };

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

  const handlePayNow = () => {
    router.push({
      pathname: "/booking/detailpayment",
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

        {/* Price Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rincian Harga</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{bikeName}</Text>
            <Text style={styles.priceValue}>{formatPrice(subtotal)}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Discount (10%)</Text>
            <Text style={[styles.priceValue, styles.discountText]}>
              -{formatPrice(discount)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total Pembayaran</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transfer Bank</Text>

          <View style={styles.methodRow}>
            {getMethodIcon() && (
              <Image source={getMethodIcon()!} style={styles.bankIcon} />
            )}
            <Text style={styles.methodName}>{getMethodName()}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <Text style={styles.agreementText}>
          Dengan menekan tombol di bawah ini, kamu telah menyetujui{" "}
          <Text style={styles.linkText}>Syarat dan Ketentuan</Text> dan{" "}
          <Text style={styles.linkText}>Kebijakan Privasi</Text>.
        </Text>

        <TouchableOpacity style={styles.payButton} onPress={handlePayNow}>
          <Text style={styles.payButtonText}>Bayar Sekarang</Text>
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
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  priceValue: {
    fontSize: 14,
    color: "#000",
  },
  discountText: {
    color: "#16A34A",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bankIcon: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  methodName: {
    fontSize: 14,
    color: "#000",
  },
  bottomSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  agreementText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 18,
  },
  linkText: {
    color: "#16A34A",
    textDecorationLine: "underline",
  },
  payButton: {
    backgroundColor: "#16A34A",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});