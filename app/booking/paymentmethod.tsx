import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PaymentMethodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [selectedMethod, setSelectedMethod] = useState<string>("");

  // Data booking
  const orderNumber = "SM000233";
  const bikeName = params.bikeName as string;
  const total = parseFloat(params.total as string);

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString("id-ID")}`;
  };

  const paymentMethods = [
    {
      id: "cash",
      name: "Cash",
      type: "cash",
      icon: null,
    },
    {
      id: "bca",
      name: "Bank BCA",
      type: "transfer",
      icon: require("../../assets/images/bca.png"), 
    },
    {
      id: "mandiri",
      name: "Bank Mandiri",
      type: "transfer",
      icon: require("../../assets/images/mandiri.png"),
    },
    {
      id: "gopay",
      name: "GO-PAY",
      type: "instant",
      icon: require("../../assets/images/gopay.png"),
    },
    {
      id: "ovo",
      name: "OVO",
      type: "instant",
      icon: require("../../assets/images/ovo.png"),
    },
  ];

  const handleSelectMethod = (methodId: string, methodType: string) => {
  setSelectedMethod(methodId);

  console.log('📦 PaymentMethod → ConfirmPayment:', {
    bikeId: params.bikeId,
    duration: params.duration,
    allParams: params,
  });

  if (methodType === "transfer" || methodType === "instant") {
    router.push({
      pathname: "/booking/payment",
      params: {
        ...params, // ✅ Ini sudah benar, akan teruskan semua params termasuk bikeId & duration
        orderNumber,
        paymentMethod: methodId,
        paymentType: methodType,
      },
    });
  } else if (methodType === "cash") {
    router.push({
      pathname: "/booking/confirmpayment",
      params: {
        ...params, // ✅ Ini sudah benar
        orderNumber,
        paymentMethod: methodId,
      },
    });
  }
};

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pembayaran</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{bikeName}</Text>
            <TouchableOpacity>
              <Text style={styles.detailLink}>Detail</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.orderLabel}>No. Pesanan</Text>
            <Text style={styles.orderNumber}>{orderNumber}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Pembayaran</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cash</Text>
          <TouchableOpacity
            style={styles.methodItem}
            onPress={() => handleSelectMethod("cash", "cash")}
          >
            <Text style={styles.methodName}>Cash</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transfer</Text>
          {paymentMethods
            .filter((m) => m.type === "transfer")
            .map((method) => (
              <TouchableOpacity
                key={method.id}
                style={styles.methodItem}
                onPress={() => handleSelectMethod(method.id, method.type)}
              >
                {method.icon && (
                  <Image source={method.icon} style={styles.methodIcon} />
                )}
                <Text style={styles.methodName}>{method.name}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#9CA3AF"
                  style={styles.chevron}
                />
              </TouchableOpacity>
            ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pembayaran Instan</Text>
          {paymentMethods
            .filter((m) => m.type === "instant")
            .map((method) => (
              <TouchableOpacity
                key={method.id}
                style={styles.methodItem}
                onPress={() => handleSelectMethod(method.id, method.type)}
              >
                {method.icon && (
                  <Image source={method.icon} style={styles.methodIcon} />
                )}
                <Text style={styles.methodName}>{method.name}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#9CA3AF"
                  style={styles.chevron}
                />
              </TouchableOpacity>
            ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  summaryCard: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 18,
    color: "#000",
    flex: 1,
  },
  detailLink: {
    fontSize: 16,
    color: "#16A34A",
    textDecorationLine: "underline",
  },
  orderLabel: {
    fontSize: 15,
    color: "#6B7280",
  },
  orderNumber: {
    fontSize: 15,
    color: "#000",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F3F4F6",
  },
  methodItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  methodIcon: {
    width: 50,
    height: 50,
    marginRight: 12,
    resizeMode: "contain",
  },
  methodName: {
    fontSize: 14,
    color: "#000",
    flex: 1,
  },
  chevron: {
    marginLeft: "auto",
  },
});