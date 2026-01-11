import { useDeepLinkParams } from "@/hooks/useDeepLink";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useBikesStore } from "../../store/useBikeStore";

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { params: deepLinkParams } = useDeepLinkParams();
  
  const { bikes, fetchBikes, subscribeToBikes } = useBikesStore();
  const [search, setSearch] = useState("");
  const [highlightedBikeId, setHighlightedBikeId] = useState<string | null>(null);

  // ===== SETUP REAL-TIME SUBSCRIPTION =====
  useEffect(() => {
    console.log('🏠 HomeScreen mounted - Fetching bikes');
    fetchBikes();

    console.log('🔔 Setting up realtime subscription for bikes');
    const unsubscribe = subscribeToBikes();

    return () => {
      console.log('🔕 Cleaning up bike subscription');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [fetchBikes, subscribeToBikes]);

  // Log setiap kali bikes data berubah
  useEffect(() => {
    console.log('📊 Bikes data updated:', bikes.map(b => ({
      name: b.name,
      unit: b.unit,
      image_url: b.image_url
    })));
  }, [bikes]);

  // ===== HANDLE DEEP LINK =====
  useEffect(() => {
    const bikeIdFromDeepLink = deepLinkParams?.bikeId || params?.bikeId;
    
    if (bikeIdFromDeepLink) {
      console.log('🎯 Deep link detected - bikeId:', bikeIdFromDeepLink);
      setHighlightedBikeId(bikeIdFromDeepLink as string);
      
      const checkAndNavigate = () => {
        const bike = bikes.find(b => b.id === bikeIdFromDeepLink);
        
        if (bike) {
          console.log('🛵 Found bike from deep link:', bike.name);
          
          Alert.alert(
            'Booking Motor',
            `Apakah Anda ingin memesan ${bike.name}?`,
            [
              { text: 'Batal', style: 'cancel' },
              { 
                text: 'Lanjut', 
                onPress: () => {
                  handleBikePress(bike);
                  setHighlightedBikeId(null);
                }
              }
            ]
          );
        } else if (bikes.length > 0) {
          console.warn('⚠️ Bike not found from deep link:', bikeIdFromDeepLink);
        }
      };

      if (bikes.length > 0) {
        checkAndNavigate();
      } else {
        const unsubscribe = subscribeToBikes();
        const timeout = setTimeout(() => {
          unsubscribe();
          if (bikes.length === 0) {
            console.warn('⚠️ Timeout waiting for bikes');
          }
        }, 5000);

        return () => {
          clearTimeout(timeout);
          unsubscribe();
        };
      }
    }
  }, [deepLinkParams, params, bikes.length]);

  // ===== FILTER MOTOR (NAMA & CATEGORY) =====
  const filteredBikes = bikes.filter((bike) => {
    const keyword = search.toLowerCase();
    return (
      bike.name.toLowerCase().includes(keyword) ||
      bike.category?.toLowerCase().includes(keyword)
    );
  });

  // Split bikes into two sections
  const halfLength = Math.ceil(filteredBikes.length / 2);
  const rekomendasiBikes = filteredBikes.slice(0, halfLength);
  const terpopulerBikes = filteredBikes.slice(halfLength);

  const motorSections = [
    { title: "Rekomendasi", data: rekomendasiBikes },
    { title: "Terpopuler", data: terpopulerBikes },
  ];

  const banners = [
    require("./../../assets/images/banner1.png"),
    require("./../../assets/images/banner2.png"),
    require("./../../assets/images/banner3.png"),
  ];

  const scrollRef = useRef<ScrollView>(null);
  const screenWidth = Dimensions.get("window").width;
  let currentIndex = 0;

  useEffect(() => {
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % banners.length;
      scrollRef.current?.scrollTo({
        x: currentIndex * screenWidth,
        animated: true,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [banners.length, screenWidth]);

  const formatPrice = (price: number) => {
    return `Rp ${(price / 1000).toFixed(0)}K/hari`;
  };

  // ✅ IMPROVED: Render gambar dengan state management
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});

  const renderBikeImage = (imageUrl?: string, bikeId?: string, bikeName?: string) => {
    // Jika gambar pernah error, langsung pakai fallback
    if (bikeId && imageErrors[bikeId]) {
      return (
        <Image
          source={require("./../../assets/images/4.png")}
          style={styles.motorImage}
        />
      );
    }

    // Jika ada URL dan valid
    if (imageUrl && imageUrl.trim() !== '') {
      return (
        <Image
          source={{ uri: imageUrl }}
          style={styles.motorImage}
          onError={(error) => {
            console.error('❌ Image load error for', bikeName, error.nativeEvent.error);
            // Mark this bike as error
            if (bikeId) {
              setImageErrors(prev => ({ ...prev, [bikeId]: true }));
            }
          }}
          onLoad={() => {
            console.log('✅ Image loaded successfully for', bikeName);
          }}
        />
      );
    }
    
    // Fallback default
    return (
      <Image
        source={require("./../../assets/images/4.png")}
        style={styles.motorImage}
      />
    );
  };

  // ===== CHECK AUTH SEBELUM BOOKING =====
  const handleBikePress = async (bike: any) => {
    if (bike.unit <= 0) {
      return;
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/user/login');
      return;
    }
    
    router.push({
      pathname: "/booking/date",
      params: {
        bikeId: bike.id,
        bikeName: bike.name,
        bikePrice: bike.price,
        bikeCc: bike.cc,
        bikeImage: bike.image_url || "",
        bikeUnit: bike.unit.toString(),
      },
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* BANNER FULL WIDTH */}
      <View style={styles.bannerSection}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.bannerWrapper}
        >
          {banners.map((img, index) => (
            <View key={index} style={{ width: screenWidth }}>
              <Image
                source={img}
                style={[styles.bannerImage, { width: screenWidth }]}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* CONTENT */}
      <View style={styles.contentContainer}>
        {/* TITLE */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>
            Touring Bersama <Text style={styles.veluxaText}>Veluxa</Text>
          </Text>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#6B7280" />
          <TextInput
            placeholder="Cari motor (matic, sport, nmax...)"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* MOTOR SECTIONS */}
        {motorSections.map((section, index) => (
          <View key={index}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </View>

            <View style={styles.grid}>
              {section.data.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.card,
                    item.unit <= 0 && styles.cardDisabled
                  ]}
                  onPress={() => handleBikePress(item)}
                  activeOpacity={item.unit <= 0 ? 1 : 0.7}
                  disabled={item.unit <= 0}
                >
                  {/* ✅ GAMBAR MOTOR DENGAN OVERLAY */}
                  <View style={styles.imageContainer}>
                    {renderBikeImage(item.image_url, item.id, item.name)}
                    
                    {/* Overlay jika sold out */}
                    {item.unit <= 0 && (
                      <View style={styles.soldOutOverlay}>
                        <Text style={styles.soldOutText}>SOLD OUT</Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.motorName, item.unit <= 0 && styles.textDisabled]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.motorCc, item.unit <= 0 && styles.textDisabled]}>
                    {item.cc}cc
                  </Text>

                  {/* REAL-TIME STOCK INDICATOR */}
                  <View style={styles.unitInfo}>
                    <Ionicons 
                      name="bicycle" 
                      size={12} 
                      color={item.unit <= 0 ? "#EF4444" : "#16A34A"} 
                    />
                    <Text style={[
                      styles.unitText,
                      item.unit <= 0 ? styles.unitTextDisabled : styles.unitTextAvailable
                    ]}>
                      {item.unit > 0 ? `${item.unit} unit tersedia` : 'Stok habis'}
                    </Text>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.price}>{formatPrice(item.price)}</Text>
                    <View style={[
                      styles.arrowBtn,
                      item.unit <= 0 && styles.arrowBtnDisabled
                    ]}>
                      <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* ✅ Info Card - Hapus atau comment setelah testing */}
        {/* {bikes.length > 0 && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>ℹ️ Info Gambar Motor:</Text>
            <Text style={styles.infoText}>
              • Total motor: {bikes.length}
            </Text>
            <Text style={styles.infoText}>
              • Motor dengan gambar: {bikes.filter(b => b.image_url).length}
            </Text>
            <Text style={styles.infoText}>
              • Gambar error: {Object.keys(imageErrors).length}
            </Text>
            {bikes.filter(b => b.image_url).slice(0, 2).map((bike, idx) => (
              <Text key={idx} style={styles.infoTextSmall}>
                ✓ {bike.name}: Ada gambar
              </Text>
            ))}
          </View>
        )} */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  bannerSection: {
    height: Dimensions.get("window").width * 0.5,
  },

  bannerWrapper: {
    height: "100%",
    backgroundColor: "#F3F4F6",
  },

  bannerImage: {
    height: "100%",
    resizeMode: "cover",
  },

  contentContainer: {
    paddingHorizontal: 16,
  },

  titleContainer: {
    marginTop: 5,
    marginBottom: 5,
    alignItems: "flex-start",
  },

  titleText: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#111827",
  },

  veluxaText: {
    color: "#16A34A",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#111827",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },

  seeAll: {
    fontSize: 12,
    color: "#16A34A",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    elevation: 3,
  },

  imageContainer: {
    position: "relative",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    overflow: "hidden",
  },

  motorImage: {
    width: "100%",
    height: 100,
    resizeMode: "contain",
    backgroundColor: "#FFFFFF",
  },

  motorName: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    color: "#111827",
  },

  motorCc: {
    fontSize: 12,
    color: "#6B7280",
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  price: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#111827",
  },

  arrowBtn: {
    backgroundColor: "#16A34A",
    padding: 6,
    borderRadius: 8,
  },

  cardDisabled: {
    opacity: 0.6,
    backgroundColor: "#F3F4F6",
  },

  motorImageDisabled: {
    opacity: 0.5,
  },

  soldOutOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(239, 68, 68, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },

  soldOutText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
  },

  textDisabled: {
    color: "#9CA3AF",
  },

  unitInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },

  unitText: {
    fontSize: 10,
    fontWeight: "500",
  },

  unitTextDisabled: {
    color: "#EF4444",
  },

  unitTextAvailable: {
    color: "#16A34A",
  },

  arrowBtnDisabled: {
    backgroundColor: "#9CA3AF",
  },

  // ✅ Info container - untuk monitoring gambar
  infoContainer: {
    backgroundColor: "#DBEAFE",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#93C5FD",
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1E40AF",
    marginBottom: 6,
  },

  infoText: {
    fontSize: 11,
    color: "#1E40AF",
    marginBottom: 2,
  },

  infoTextSmall: {
    fontSize: 10,
    color: "#3B82F6",
    marginLeft: 8,
  },
});