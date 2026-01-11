import { useDeepLinkParams } from "@/hooks/useDeepLink";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function BookingDateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { params: deepLinkParams, attributionParams } = useDeepLinkParams();
  
  // Data motor yang dipilih
  const bikeId = params.bikeId as string || deepLinkParams?.bikeId as string;
  const bikeName = params.bikeName as string;
  const bikePrice = params.bikePrice as string;
  const bikeUnit = params.bikeUnit as string;

  // Deep link attribution state
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Initialize dari deep link
  useEffect(() => {
    if (attributionParams) {
      if (attributionParams.promo) {
        setPromoCode(attributionParams.promo);
        console.log('🎁 Promo dari deep link:', attributionParams.promo);
      }
      if (attributionParams.discount) {
        const discount = parseInt(attributionParams.discount, 10);
        if (!isNaN(discount)) {
          setDiscountPercent(discount);
          console.log('💰 Discount dari deep link:', discount, '%');
        }
      }
      if (attributionParams.ref) {
        console.log('👤 Referral dari deep link:', attributionParams.ref);
      }
    }
  }, [attributionParams]);

  const [selectedMonth, setSelectedMonth] = useState("December");
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedStartDate, setSelectedStartDate] = useState(28);
  const [selectedEndDate, setSelectedEndDate] = useState(0);
  const [startTime, setStartTime] = useState("11:00");
  const [endTime, setEndTime] = useState("11:00");

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (month: string, year: number) => {
    const monthIndex = months.indexOf(month);
    return new Date(year, monthIndex + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: string, year: number) => {
    const monthIndex = months.indexOf(month);
    return new Date(year, monthIndex, 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    const days = [];

    // Empty cells untuk hari sebelum tanggal 1
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Tanggal aktual
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = day === selectedStartDate || day === selectedEndDate;
      const isInRange = selectedStartDate && selectedEndDate && 
                        day > Math.min(selectedStartDate, selectedEndDate) && 
                        day < Math.max(selectedStartDate, selectedEndDate);
      
      days.push(
        <TouchableOpacity
          key={day}
          style={styles.dayCell}
          onPress={() => handleDatePress(day)}
        >
          <View
            style={[
              styles.dayButton,
              isSelected && styles.selectedDay,
              isInRange && styles.rangeDay,
            ]}
          >
            <Text
              style={[
                styles.dayText,
                (isSelected || isInRange) && styles.selectedDayText,
              ]}
            >
              {day}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const handleDatePress = (day: number) => {
    // Logic: klik pertama = start date, klik kedua = end date
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // Reset: pilih start date baru
      setSelectedStartDate(day);
      setSelectedEndDate(0);
    } else {
      // Set end date
      if (day < selectedStartDate) {
        // Jika pilih tanggal sebelum start date, tukar
        setSelectedEndDate(selectedStartDate);
        setSelectedStartDate(day);
      } else {
        setSelectedEndDate(day);
      }
    }
  };

  const calculateDuration = () => {
    if (!selectedStartDate) return 0;
    if (!selectedEndDate) return 1; // Minimal 1 hari
    
    const start = Math.min(selectedStartDate, selectedEndDate);
    const end = Math.max(selectedStartDate, selectedEndDate);
    const duration = end - start + 1; // +1 karena termasuk hari pertama
    
    return duration;
  };

  const formatDate = (year: number, month: string, day: number) => {
    const monthIndex = months.indexOf(month) + 1;
    const paddedMonth = monthIndex.toString().padStart(2, '0');
    const paddedDay = day.toString().padStart(2, '0');
    return `${year}-${paddedMonth}-${paddedDay}`;
  };

  const handleAddToCart = () => {
    // Validasi
    if (!selectedStartDate) {
      Alert.alert('Error', 'Pilih tanggal mulai sewa');
      return;
    }

    const duration = calculateDuration();
    const startDateStr = formatDate(selectedYear, selectedMonth, selectedStartDate);
    const endDateStr = selectedEndDate 
      ? formatDate(selectedYear, selectedMonth, selectedEndDate)
      : startDateStr;

    console.log('📅 Booking Data:', {
      bikeId,
      bikeName,
      bikePrice,
      startDate: startDateStr,
      endDate: endDateStr,
      duration,
      startTime,
      endTime,
    });

    // Navigate ke detail booking
    router.push({
      pathname: "/booking/detailbooking",
      params: {
        bikeId,
        bikeName,
        bikePrice,
        bikeUnit,
        startDate: startDateStr,
        endDate: endDateStr,
        duration: duration.toString(), // ✅ TAMBAHKAN DURATION!
        startTime,
        endTime,
      },
    });
  };

  const duration = calculateDuration();
  const totalPrice = parseInt(bikePrice) * duration;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Time</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Month & Year Selector */}
        <View style={styles.dateSelector}>
          <TouchableOpacity style={styles.dropdown}>
            <Text style={styles.dropdownText}>{selectedMonth}</Text>
            <Ionicons name="chevron-down" size={20} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.dropdown}>
            <Text style={styles.dropdownText}>{selectedYear}</Text>
            <Ionicons name="chevron-down" size={20} color="#000" />
          </TouchableOpacity>

          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => {
                const currentIndex = months.indexOf(selectedMonth);
                if (currentIndex > 0) {
                  setSelectedMonth(months[currentIndex - 1]);
                }
              }}
            >
              <Ionicons name="chevron-back" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => {
                const currentIndex = months.indexOf(selectedMonth);
                if (currentIndex < 11) {
                  setSelectedMonth(months[currentIndex + 1]);
                }
              }}
            >
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Selected Dates Summary */}
        {selectedStartDate > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tanggal Mulai:</Text>
              <Text style={styles.summaryValue}>
                {selectedStartDate} {selectedMonth} {selectedYear}
              </Text>
            </View>
            {selectedEndDate > 0 && (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tanggal Selesai:</Text>
                  <Text style={styles.summaryValue}>
                    {selectedEndDate} {selectedMonth} {selectedYear}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Durasi:</Text>
                  <Text style={styles.summaryValueHighlight}>
                    {duration} hari
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Harga:</Text>
                  <Text style={styles.summaryPrice}>
                    Rp {totalPrice.toLocaleString('id-ID')}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Calendar */}
        <View style={styles.calendar}>
          {/* Day Headers */}
          <View style={styles.dayHeaders}>
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <View key={index} style={styles.dayHeaderCell}>
                <Text style={styles.dayHeaderText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>{renderCalendar()}</View>
        </View>

        {/* Time Selection */}
        <View style={styles.timeSection}>
          <View style={styles.timeInput}>
            <Text style={styles.timeLabel}>Start Time</Text>
            <TextInput
              style={styles.timeValue}
              value={startTime}
              onChangeText={setStartTime}
            />
          </View>

          <View style={styles.timeInput}>
            <Text style={styles.timeLabel}>End Time</Text>
            <TextInput
              style={styles.timeValue}
              value={endTime}
              onChangeText={setEndTime}
            />
          </View>
        </View>
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
          style={styles.addButton}
          onPress={handleAddToCart}
        >
          <Text style={styles.addButtonText}>Add to Cart</Text>
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
    paddingTop: 50,
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
  dateSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: "600",
  },
  navigationButtons: {
    flexDirection: "row",
    gap: 8,
  },
  navButton: {
    padding: 8,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#16A34A",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  summaryValueHighlight: {
    fontSize: 16,
    color: "#16A34A",
    fontWeight: "bold",
  },
  summaryPrice: {
    fontSize: 18,
    color: "#16A34A",
    fontWeight: "bold",
  },
  calendar: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  dayHeaders: {
    flexDirection: "row",
    marginBottom: 16,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: "center",
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedDay: {
    borderRadius: 18,
    backgroundColor: "#16A34A",
  },
  rangeDay: {
    borderRadius: 18,
    backgroundColor: "#86EFAC",
  },
  dayText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  selectedDayText: {
    color: "#fff",
    fontWeight: "600",
  },
  timeSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 100,
  },
  timeInput: {
    flex: 1,
    marginHorizontal: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: "600",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 8,
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
  addButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#16A34A",
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});