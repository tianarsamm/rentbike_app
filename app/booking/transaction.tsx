import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { TransactionStatus, useTransactionStore } from "../../store/useTransactionStore";

export default function UserTransactionsScreen() {
  const router = useRouter();
  const { transactions } = useTransactionStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | 'all'>('all');

  // Ambil user ID dari auth (sementara hardcode)
  const currentUserId = "user-123";

  // Filter transaksi berdasarkan user dan status
  const userTransactions = transactions
    .filter((trx) => trx.userId === currentUserId)
    .filter((trx) => filterStatus === 'all' ? true : trx.status === filterStatus);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulasi refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

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

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'confirmed': return 'checkmark-circle-outline';
      case 'ongoing': return 'bicycle-outline';
      case 'completed': return 'checkmark-done-circle';
      case 'cancelled': return 'close-circle-outline';
      default: return 'help-circle-outline';
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

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString("id-ID")}`;
  };

  const getStatusCounts = () => {
    const userTrx = transactions.filter((trx) => trx.userId === currentUserId);
    return {
      all: userTrx.length,
      pending: userTrx.filter(t => t.status === 'pending').length,
      confirmed: userTrx.filter(t => t.status === 'confirmed').length,
      ongoing: userTrx.filter(t => t.status === 'ongoing').length,
      completed: userTrx.filter(t => t.status === 'completed').length,
    };
  };

  const counts = getStatusCounts();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaksi Saya</Text>
        <View style={styles.backButton} />
      </View>

      {/* Status Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'all' && styles.filterChipActive]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.filterText, filterStatus === 'all' && styles.filterTextActive]}>
            Semua ({counts.all})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'pending' && styles.filterChipActive]}
          onPress={() => setFilterStatus('pending')}
        >
          <Text style={[styles.filterText, filterStatus === 'pending' && styles.filterTextActive]}>
            Menunggu ({counts.pending})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'confirmed' && styles.filterChipActive]}
          onPress={() => setFilterStatus('confirmed')}
        >
          <Text style={[styles.filterText, filterStatus === 'confirmed' && styles.filterTextActive]}>
            Dikonfirmasi ({counts.confirmed})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'ongoing' && styles.filterChipActive]}
          onPress={() => setFilterStatus('ongoing')}
        >
          <Text style={[styles.filterText, filterStatus === 'ongoing' && styles.filterTextActive]}>
            Berlangsung ({counts.ongoing})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'completed' && styles.filterChipActive]}
          onPress={() => setFilterStatus('completed')}
        >
          <Text style={[styles.filterText, filterStatus === 'completed' && styles.filterTextActive]}>
            Selesai ({counts.completed})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Transaction List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {userTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>Tidak ada transaksi</Text>
            <Text style={styles.emptySubtext}>
              {filterStatus === 'all' 
                ? 'Anda belum memiliki transaksi'
                : `Tidak ada transaksi dengan status "${getStatusLabel(filterStatus as TransactionStatus)}"`
              }
            </Text>
            <TouchableOpacity 
              style={styles.browseBikesButton}
              onPress={() => router.push('/(tabs)/home')}
            >
              <Text style={styles.browseBikesText}>Cari Motor</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {userTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderNumber}>{transaction.orderNumber}</Text>
                    <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) + '15' }]}>
                    <Ionicons 
                      name={getStatusIcon(transaction.status) as any} 
                      size={14} 
                      color={getStatusColor(transaction.status)} 
                    />
                    <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                      {getStatusLabel(transaction.status)}
                    </Text>
                  </View>
                </View>

                {/* Bike Info */}
                <View style={styles.bikeSection}>
                  <View style={styles.bikeIcon}>
                    <Text style={styles.bikeEmoji}>🏍️</Text>
                  </View>
                  <View style={styles.bikeInfo}>
                    <Text style={styles.bikeName}>{transaction.bikeName}</Text>
                    <Text style={styles.bikePrice}>
                      {formatPrice(transaction.bikePrice)} × {transaction.duration} hari
                    </Text>
                  </View>
                </View>

                {/* Rental Period */}
                <View style={styles.periodSection}>
                  <View style={styles.periodRow}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.periodText}>
                      {formatDate(transaction.startDate)} - {formatDate(transaction.endDate)}
                    </Text>
                  </View>
                </View>

                {/* Total Price */}
                <View style={styles.priceSection}>
                  <Text style={styles.priceLabel}>Total Pembayaran</Text>
                  <Text style={styles.priceValue}>{formatPrice(transaction.totalPrice)}</Text>
                </View>

                {/* Status Message */}
                {transaction.status === 'pending' && (
                  <View style={styles.messageBox}>
                    <Ionicons name="information-circle" size={16} color="#F59E0B" />
                    <Text style={styles.messageText}>
                      Menunggu konfirmasi dari admin
                    </Text>
                  </View>
                )}

                {transaction.status === 'confirmed' && (
                  <View style={[styles.messageBox, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />
                    <Text style={[styles.messageText, { color: '#3B82F6' }]}>
                      Pesanan dikonfirmasi! Siap untuk diambil
                    </Text>
                  </View>
                )}

                {transaction.status === 'ongoing' && (
                  <View style={[styles.messageBox, { backgroundColor: '#F5F3FF' }]}>
                    <Ionicons name="time" size={16} color="#8B5CF6" />
                    <Text style={[styles.messageText, { color: '#8B5CF6' }]}>
                      Rental sedang berlangsung
                    </Text>
                  </View>
                )}

                {transaction.status === 'completed' && (
                  <View style={[styles.messageBox, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="checkmark-done-circle" size={16} color="#10B981" />
                    <Text style={[styles.messageText, { color: '#10B981' }]}>
                      Transaksi selesai. Terima kasih!
                    </Text>
                  </View>
                )}

                {transaction.status === 'cancelled' && (
                  <View style={[styles.messageBox, { backgroundColor: '#FEF2F2' }]}>
                    <Ionicons name="close-circle" size={16} color="#EF4444" />
                    <Text style={[styles.messageText, { color: '#EF4444' }]}>
                      Pesanan dibatalkan
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  filterContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
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
  content: {
    flex: 1,
  },
  transactionsList: {
    padding: 16,
  },
  transactionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  bikeSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  bikeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  bikeEmoji: {
    fontSize: 24,
  },
  bikeInfo: {
    flex: 1,
  },
  bikeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  bikePrice: {
    fontSize: 13,
    color: "#6B7280",
  },
  periodSection: {
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  periodText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  priceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#16A34A",
  },
  messageBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  messageText: {
    fontSize: 12,
    color: "#F59E0B",
    fontWeight: "500",
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  browseBikesButton: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseBikesText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});