import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function DetailBookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Data dari halaman sebelumnya
  const bikeName = params.bikeName as string;
  const bikePrice = params.bikePrice as string;
  const bikeUnit = parseInt(params.bikeUnit as string) || 0;
  const startDate = params.startDate as string;
  const endDate = params.endDate as string;
  const startTime = params.startTime as string;
  const endTime = params.endTime as string;

  // User personal info
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [returnAddress, setReturnAddress] = useState("");
  const [helm, setHelm] = useState("0");
  const [phoneHolder, setPhoneHolder] = useState("0");
  const [note, setNote] = useState("");

  // Hitung total hari
  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const days = calculateDays();
  const pricePerDay = parseInt(bikePrice) || 125000;
  // Fixed: 1 unit per transaksi
  const subtotal = pricePerDay * days * 1;
  const discount = subtotal * 0.1;
  const total = subtotal - discount;

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

  const handleContinue = () => {
    if (!userName.trim()) {
      Alert.alert("Name Required", "Please enter your full name to continue.");
      return;
    }

    if (!userPhone.trim()) {
      Alert.alert("Phone Required", "Please enter your phone number to continue.");
      return;
    }

    if (!deliveryAddress.trim()) {
      Alert.alert("Delivery Address Required", "Please enter your delivery address to continue.");
      return;
    }

    if (!returnAddress.trim()) {
      Alert.alert("Return Address Required", "Please enter your return address to continue.");
      return;
    }

    console.log('📦 DetailBooking → ConfirmBooking:', {
      bikeId: params.bikeId,
      userName,
      userPhone,
      duration: days,
    });

    router.push({
      pathname: "/booking/confirmbooking",
      params: {
        bikeId: params.bikeId as string,
        bikeName,
        bikePrice,
        bikeUnit: bikeUnit.toString(),
        duration: days.toString(),
        startDate,
        endDate,
        startTime,
        endTime,
        userName,
        userPhone,
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
          <Ionicons name="arrow-back" size={24} color="#ffffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Personal Info Section */}
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              !userName && styles.inputRequired
            ]}
            placeholder="Full Name *"
            placeholderTextColor="#9CA3AF"
            value={userName}
            onChangeText={setUserName}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              !userPhone && styles.inputRequired
            ]}
            placeholder="Phone Number *"
            placeholderTextColor="#9CA3AF"
            value={userPhone}
            onChangeText={setUserPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Item Section */}
        <Text style={styles.sectionTitle}>Item</Text>

        <View style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <View>
              <Text style={styles.itemName}>
                {bikeName} ({formatPrice(pricePerDay)}/day)
              </Text>
              <Text style={styles.itemDate}>
                {formatDate(startDate)} {startTime} - {formatDate(endDate)}{" "}
                {endTime}
              </Text>
            </View>
          </View>

          {/* Info: 1 unit per transaksi */}
          <View style={styles.quantityInfo}>
            <Ionicons name="information-circle" size={16} color="#3B82F6" />
            <Text style={styles.quantityInfoText}>
              1 unit motor per transaksi
            </Text>
          </View>

          {/* Stock Information */}
          <View style={styles.stockInfo}>
            <Ionicons 
              name="bicycle" 
              size={14} 
              color="#16A34A" 
            />
            <Text style={styles.stockText}>
              Stok tersedia: {bikeUnit} unit
            </Text>
          </View>
        </View>

        {/* Shipping Section */}
        <Text style={styles.sectionTitle}>Shipping</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              !deliveryAddress && styles.inputRequired
            ]}
            placeholder="Delivery Address *"
            placeholderTextColor="#9CA3AF"
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              !returnAddress && styles.inputRequired
            ]}
            placeholder="Return Address *"
            placeholderTextColor="#9CA3AF"
            value={returnAddress}
            onChangeText={setReturnAddress}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Helm</Text>
            <TextInput
              style={styles.input}
              value={helm}
              onChangeText={setHelm}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.halfInput}>
            <Text style={styles.label}>Phone Holder</Text>
            <TextInput
              style={styles.input}
              value={phoneHolder}
              onChangeText={setPhoneHolder}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add Note"
            placeholderTextColor="#9CA3AF"
            value={note}
            onChangeText={setNote}
            multiline
          />
        </View>

        {/* Price Summary */}
        <View style={styles.summaryContainer}>
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
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.continueButton,
            (!userName.trim() || !userPhone.trim() || !deliveryAddress.trim() || !returnAddress.trim()) && styles.continueButtonDisabled
          ]} 
          onPress={handleContinue}
          disabled={!userName.trim() || !userPhone.trim() || !deliveryAddress.trim() || !returnAddress.trim()}
        >
          <Text style={styles.continueText}>Continue</Text>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#16A34A",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemHeader: {
    marginBottom: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  quantityInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  quantityInfoText: {
    fontSize: 13,
    color: "#3B82F6",
    fontWeight: "500",
    flex: 1,
  },
  stockInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 6,
  },
  stockText: {
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  inputRequired: {
    borderBottomColor: "#000000ff",
    borderBottomWidth: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  summaryContainer: {
    marginTop: 24,
    marginBottom: 16,
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
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  bottomButtons: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  cancelButton: {
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
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
  continueButton: {
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
  continueButtonDisabled: {
    borderRadius: 12,
    borderWidth: 0,
    borderColor: "#000000ff",
    backgroundColor: "#E5E7EB",
    opacity: 0.6,
  },
  continueText: {
    fontSize: 16,
    fontWeight: "600",
  },
});