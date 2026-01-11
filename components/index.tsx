import { Link } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Animatable from "react-native-animatable";

export default function DashboardScreen() {
  return (
    <>
      {/* <Navbar /> */}

      {/* Animasi container utama */}
      <Animatable.View
        animation="fadeInUp"
        duration={1000}
        easing="ease-out"
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Animatable.Text animation="fadeInDown" duration={1000} style={styles.title}>
            Selamat Datang di RentRider!
          </Animatable.Text>

          <Animatable.Text animation="fadeIn" delay={300} duration={1000} style={styles.subtitle}>
            Aplikasi penyewaan motor terpercaya untuk perjalanan Anda yang tak terlupakan.
          </Animatable.Text>

          {/* Tombol Sewa Sekarang */}
          <Animatable.View animation="zoomIn" delay={500} duration={900}>
            <Link href="/explore" asChild>
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Sewa Sekarang</Text>
              </TouchableOpacity>
            </Link>
          </Animatable.View>

          {/* Properti */}
          <Animatable.View animation="fadeInUp" delay={600} style={styles.propertiContainer}>
            <Text style={styles.testimoniTitle}>Fasilitas Yang Kami Sediakan</Text>

            {[
              { img: require("./../../assets/images/4.png"), label: "Helmet Standar SNI" },
              { img: require("./../../assets/images/5.png"), label: "Mantel Hujan" },
              { img: require("./../../assets/images/6.png"), label: "Phone Holder" },
            ].map((item, index) => (
              <Animatable.View
                key={index}
                animation="fadeInUp"
                delay={700 + index * 200}
                style={styles.card}
              >
                <View style={styles.testimoniWrapper}>
                  <Image source={item.img} style={styles.testimoniIcon} />
                </View>
                <Text style={styles.namaItem}>{item.label}</Text>
              </Animatable.View>
            ))}
          </Animatable.View>

          {/* Testimoni Pelanggan */}
          <Animatable.View animation="fadeInUp" delay={1000} style={styles.testimoniContainer}>
            <Text style={styles.testimoniTitle}>Apa Kata Pelanggan Kami?</Text>

            <Animatable.View animation="fadeInUp" delay={1100} style={styles.card}>
              <View style={styles.testimoniWrapper}>
                <Image source={require("./../../assets/images/7.png")} style={styles.testimoniPic} />
                <Text style={styles.testimoniText}>
                  “Pelayanannya cepat dan motor dalam kondisi sangat baik. Saya puas banget!”
                </Text>
              </View>
              <Text style={styles.namaPelanggan}>– Andi, Denpasar</Text>
            </Animatable.View>

            <Animatable.View animation="fadeInUp" delay={1300} style={styles.card}>
              <View style={styles.testimoniWrapper}>
                <Image source={require("./../../assets/images/8.png")} style={styles.testimoniPic} />
                <Text style={styles.testimoniText}>
                  “Harga terjangkau dan prosesnya mudah banget. Recommended buat wisatawan!”
                </Text>
              </View>
              <Text style={styles.namaPelanggan}>– Rina, Jakarta</Text>
            </Animatable.View>
          </Animatable.View>

          <Animatable.Text animation="fadeIn" delay={1600} style={styles.footer}>
            Dibuat Oleh RentRider dengan ❤️
          </Animatable.Text>
        </ScrollView>
      </Animatable.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f9f9f9",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 35,
    fontWeight: "bold",
    color: "#1E3A8A",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: 25,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderColor: "#1E3A8A",
    borderWidth: 2,
    marginBottom: 40,
  },
  buttonText: {
    color: "#1E3A8A",
    fontWeight: "bold",
    fontSize: 16,
  },
  testimoniContainer: {
    width: "100%",
  },
  propertiContainer: {
    width: "50%",
    marginBottom: 40,
  },
  testimoniTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 15,
  },
  testimoniWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  testimoniIcon: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginTop: 2,
  },
  testimoniPic: {
    width: 30,
    height: 30,
    resizeMode: "contain",
    marginTop: 2,
  },
  testimoniText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    marginBottom: 10,
    fontStyle: "italic",
  },
  namaItem: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E3A8A",
    textAlign: "center",
  },
  namaPelanggan: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E3A8A",
    textAlign: "right",
  },
  footer: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 20,
  },
});
