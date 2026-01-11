import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Harap isi email dan password');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Cek email confirmation
      if (!data.user?.email_confirmed_at) {
        router.replace({
          pathname: '/user/verify',
          params: { email }
        });
        return;
      }

      // Login berhasil
      Alert.alert('Sukses', 'Login berhasil!', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/home')
        }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  const navigateToRegister = () => {
    router.push('/user/register');
  };

  const handleForgotPassword = () => {
    Alert.alert('Info', 'Fitur lupa password akan segera hadir');
  };

  return (
    <KeyboardAvoidingView
      style={containerStyles.main}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={scrollStyles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={headerStyles.container}>
          <View style={logoStyles.container}>
            <Text style={logoStyles.icon}>🏍️</Text>
          </View>
          <Text style={headerStyles.title}>RentRide</Text>
          <Text style={headerStyles.subtitle}>Masuk ke akun Anda</Text>
        </View>

        {/* Form Section */}
        <View style={formStyles.container}>
          {/* Email Input */}
          <View style={inputGroupStyles.container}>
            <Text style={inputGroupStyles.label}>Email</Text>
            <TextInput
              style={inputStyles.field}
              placeholder="nama@email.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
            />
          </View>

          {/* Password Input */}
          <View style={inputGroupStyles.container}>
            <Text style={inputGroupStyles.label}>Password</Text>
            <TextInput
              style={inputStyles.field}
              placeholder="Masukkan password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {/* Forgot Password */}
          <TouchableOpacity 
            style={forgotPasswordStyles.container} 
            onPress={handleForgotPassword}
            disabled={loading}
          >
            <Text style={forgotPasswordStyles.text}>Lupa Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              loginButtonStyles.container,
              loading && loginButtonStyles.disabled
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <View style={loginButtonStyles.loadingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={loginButtonStyles.loadingText}>Memproses...</Text>
              </View>
            ) : (
              <Text style={loginButtonStyles.text}>Masuk</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={dividerStyles.container}>
            <View style={dividerStyles.line} />
            <Text style={dividerStyles.text}>ATAU</Text>
            <View style={dividerStyles.line} />
          </View>

          {/* Register Link */}
          <View style={registerLinkStyles.container}>
            <Text style={registerLinkStyles.text}>Belum punya akun? </Text>
            <TouchableOpacity onPress={navigateToRegister} disabled={loading}>
              <Text style={registerLinkStyles.link}>Daftar Sekarang</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ==================== STYLES ====================

// Container Styles
const containerStyles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});

// Scroll Styles
const scrollStyles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
});

// Header Styles
const headerStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
});

// Logo Styles
const logoStyles = StyleSheet.create({
  container: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  icon: {
    fontSize: 40,
  },
});

// Form Styles
const formStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
});

// Input Group Styles
const inputGroupStyles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
});

// Input Styles
const inputStyles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
});

// Forgot Password Styles
const forgotPasswordStyles = StyleSheet.create({
  container: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  text: {
    color: '#16A34A',
    fontSize: 14,
    fontWeight: '600',
  },
});

// Login Button Styles
const loginButtonStyles = StyleSheet.create({
  container: {
    backgroundColor: '#16A34A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  disabled: {
    backgroundColor: '#9CA3AF',
    elevation: 0,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// Divider Styles
const dividerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  text: {
    marginHorizontal: 16,
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
});

// Register Link Styles
const registerLinkStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#6B7280',
    fontSize: 14,
  },
  link: {
    color: '#16A34A',
    fontSize: 14,
    fontWeight: 'bold',
  },
});