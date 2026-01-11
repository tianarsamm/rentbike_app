import { Tabs } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, useColorScheme } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const renderIcon = (src: any, color: string) => (
    <Image
      source={src}
      style={[
        styles.iconImage,
        { tintColor: color }
      ]}
    />
  );

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        // Gunakan warna dari Colors.ts
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tabIconSelected,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        
        headerShown: false,
        tabBarButton: HapticTab,
        
        tabBarStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.98)', // Semi transparan
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 60 + insets.bottom, // Tinggi tab bar + safe area bottom
          paddingBottom: insets.bottom + 8, // Padding bottom + safe area untuk避开 navigation bar
          paddingTop: 8,
        },
        
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Transaksi',
          tabBarIcon: ({ color }) => 
            renderIcon(require('../../assets/images/transaksi.png'), color),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => 
            renderIcon(require('../../assets/images/profile.png'), color),
        }}
      />

      <Tabs.Screen
        name="AdminCRUDScreen"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color }) => 
            renderIcon(require('../../assets/images/profile.png'), color),
        }}
      />
      
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconImage: {
    width: 28,
    height: 28,
  },
});