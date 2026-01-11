import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useGlobalSearchParams, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { handleIncomingUrl } from '@/lib/deeplink';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Airbridge = require('airbridge-react-native-sdk') as { init?: (appName: string, apiKey: string) => void };

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const params = useGlobalSearchParams();

  useEffect(() => {
    if (Airbridge && typeof Airbridge.init === 'function') {
      Airbridge.init("rentbike", "029fbd35e9df4b1c886dd6f6a033e3c8");
    } else {
      console.log("Airbridge is not available");
    }
  }, []);

  // Handle URL changes saat app sudah terbuka (runtime deep links)
  useEffect(() => {
    if (pathname && pathname !== '/') {
      // Konstruksi URL lengkap dengan scheme
      const queryString = Object.keys(params).length > 0
        ? '?' + Object.entries(params)
            .map(([key, value]) => `${key}=${value}`)
            .join('&')
        : '';
      
      // Tambahkan scheme untuk membuat URL valid
      const fullUrl = `myapp:/${pathname}${queryString}`;
      
      console.log('🔗 Runtime URL detected:', fullUrl);
      handleIncomingUrl(fullUrl);
    }
  }, [pathname, params]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          contentStyle: { marginTop: 0 }
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="booking" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}