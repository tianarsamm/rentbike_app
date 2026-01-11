import { useDeepLink } from '@/hooks/useDeepLink';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function Index() {
  const { isDeepLink, isLoading, processDeferredLink, attributionParams } = useDeepLink({
    autoNavigate: false, // Manual navigation di sini
  });

  useEffect(() => {
    const init = async () => {
      // Process deferred link jika ada (app dibuka dari link setelah install)
      await processDeferredLink();
    };

    init();
  }, []);

  useEffect(() => {
    // Redirect ke home setelah processing (dengan atau tanpa deep link)
    // Delay sebentar agar deep link sempat diproses
    const timer = setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 100);

    return () => clearTimeout(timer);
  }, [isLoading]);

  // Debug info
  useEffect(() => {
    if (attributionParams && Object.keys(attributionParams).length > 0) {
      console.log('🎯 Attribution from deep link:', attributionParams);
    }
  }, [attributionParams]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#16A34A" />
      <Text style={styles.text}>Memuat RentBike...</Text>
      
      {isDeepLink && (
        <Text style={styles.deepLinkText}>Memproses deep link...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  deepLinkText: {
    marginTop: 8,
    fontSize: 12,
    color: '#16A34A',
  },
});
