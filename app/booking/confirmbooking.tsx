import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ConfirmBookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Data dari halaman sebelumnya
  const bikeId = params.bikeId as string;
  const bikeName = params.bikeName as string;
  const bikePrice = params.bikePrice as string;
  const bikeUnit = params.bikeUnit as string;
  const duration = params.duration as string;
  const startDate = params.startDate as string;
  const endDate = params.endDate as string;
  const startTime = params.startTime as string;
  const endTime = params.endTime as string;
  // ⭐ TAMBAHKAN userName dan userPhone
  const userName = params.userName as string;
  const userPhone = params.userPhone as string;
  const quantity = params.quantity as string;
  const deliveryAddress = params.deliveryAddress as string;
  const returnAddress = params.returnAddress as string;
  const helm = params.helm as string;
  const phoneHolder = params.phoneHolder as string;
  const note = params.note as string;
  const subtotal = parseFloat(params.subtotal as string);
  const discount = parseFloat(params.discount as string);
  const total = parseFloat(params.total as string);

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString("id-ID")}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleBookNow = () => {
    console.log('📦 Confirm Booking - Sending:', {
      bikeId,
      userName,
      userPhone,
      duration,
    });

    // Navigate ke payment method
    router.push({
      pathname: "/booking/paymentmethod",
      params: {
        bikeId,
        bikeName,
        bikePrice,
        bikeUnit,
        duration,
        startDate,
        endDate,
        startTime,
        endTime,
        userName,           // ⭐ PASS userName
        userPhone,          // ⭐ PASS userPhone
        quantity,
        deliveryAddress,
        returnAddress,
        helm,
        phoneHolder,
        note,
        subtotal: subtotal.toString(),
        discount: discount.toString(),
        total: total.toString(),
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Summary</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* ⭐ PERSONAL INFORMATION SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{userName || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{userPhone || "-"}</Text>
            </View>
          </View>
        </View>

        {/* Delivery Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Delivery Address</Text>
              <Text style={styles.value}>{deliveryAddress || "-"}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Return Address</Text>
              <Text style={styles.value}>{returnAddress || "-"}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Helm</Text>
              <Text style={styles.value}>{helm}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Phone Holder</Text>
              <Text style={styles.value}>{phoneHolder}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Note</Text>
              <Text style={styles.value}>{note || "-"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Booking Details */}
        <View style={styles.bookingDetail}>
          <View style={styles.bookingHeader}>
            <Text style={styles.bookingQuantity}>{quantity}x</Text>
            <Text style={styles.bookingName}>{bikeName}</Text>
            <Text style={styles.bookingPrice}>{formatPrice(parseInt(bikePrice))}</Text>
          </View>
          <Text style={styles.bookingDate}>
            {formatDate(startDate)} {startTime} - {formatDate(endDate)} {endTime}
          </Text>
          <Text style={styles.bookingDuration}>Duration: {duration} day(s)</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Summary */}
      <View style={styles.bottomSection}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Sub Total</Text>
          <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Discount (10%)</Text>
          <Text style={[styles.summaryValue, styles.discountText]}>
            -{formatPrice(discount)}
          </Text>
        </View>

        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>

        {/* Bottom Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bookButton} onPress={handleBookNow}>
            <Text style={styles.bookText}>Book Now</Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#111827",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },
  infoRow: {
    marginBottom: 12,
  
  },
  label: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  infoLabel: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 24,
  },
  bookingDetail: {
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },
  bookingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  bookingQuantity: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 4,
  },
  bookingName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  bookingPrice: {
    fontSize: 16,
    fontWeight: "bold",
  },
  bookingDate: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  bookingDuration: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  bottomSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  discountText: {
    color: "#16A34A",
  },
  totalRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  backButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#000",
    gap: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: "600",
  },
  bookButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#000",
    backgroundColor: "#ffffffff",
    gap: 8,
  },
  bookText: {
    fontSize: 16,
    fontWeight: "600",
  },
});