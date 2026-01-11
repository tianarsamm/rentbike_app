import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [loading, setLoading] = useState(false);

  const resendVerification = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;

      Alert.alert(
        'Email Terkirim',
        'Link verifikasi telah dikirim ulang. Silakan cek email Anda.'
      );
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkAgain = async () => {
    const { data } = await supabase.auth.getUser();

    if (data.user?.email_confirmed_at) {
      router.replace('/(tabs)/home');
    } else {
      Alert.alert(
        'Belum Terverifikasi',
        'Silakan klik link di email terlebih dahulu.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📧</Text>
      <Text style={styles.title}>Verifikasi Email</Text>
      <Text style={styles.desc}>
        Kami telah mengirim link verifikasi ke:
      </Text>
      <Text style={styles.email}>{email}</Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={resendVerification}
        disabled={loading}
      >
        <Text style={styles.primaryText}>
          {loading ? 'Mengirim...' : 'Kirim Ulang Email'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={checkAgain}>
        <Text style={styles.secondaryText}>Saya Sudah Verifikasi</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/user/login')}>
        <Text style={styles.back}>← Kembali ke Login</Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  icon: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  desc: { color: '#6B7280', textAlign: 'center' },
  email: { fontWeight: 'bold', marginVertical: 8 },
  primaryButton: {
    backgroundColor: '#16A34A',
    padding: 14,
    borderRadius: 10,
    width: '100%',
    marginTop: 24,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: 'bold' },
  secondaryButton: {
    marginTop: 12,
  },
  secondaryText: {
    color: '#16A34A',
    fontWeight: '600',
  },
  back: {
    marginTop: 32,
    color: '#6B7280',
  },
});
