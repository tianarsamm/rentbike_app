import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  role: string;
}

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndLoadUser();
  }, []);

  const checkAuthAndLoadUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        router.replace('/user/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setUser({
          id: session.user.id,
          full_name: session.user.user_metadata?.full_name || 'User',
          email: session.user.email || '',
          phone: session.user.phone || '',
          avatar_url: session.user.user_metadata?.avatar_url,
          role: 'user',
        });
      } else {
        setUser(profile);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      router.replace('/user/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) throw error;
              
              setUser(null);
              router.replace('/user/login');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Gagal logout');
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('Info', 'Fitur edit profil akan segera hadir');
  };

  const handleChangePassword = () => {
    Alert.alert('Info', 'Fitur ganti password akan segera hadir');
  };

  const handleMyRentals = () => {
    router.push('/booking/history');
  };

  const handleHelp = () => {
    Alert.alert('Bantuan', 'Hubungi kami di support@rentride.com');
  };

  const handleAbout = () => {
    Alert.alert('Tentang RentRide', 'RentRide v1.0.0\nAplikasi rental motor terpercaya');
  };

  if (loading) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={loadingStyles.text}>Memuat profil...</Text>
      </View>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ScrollView style={containerStyles.main}>
      {/* Header */}
      <View style={headerStyles.container}>
        <Text style={headerStyles.title}>Profil Saya</Text>
      </View>

      {/* Profile Card */}
      <View style={profileCardStyles.container}>
        <View style={avatarStyles.container}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={avatarStyles.image} />
          ) : (
            <View style={avatarStyles.placeholder}>
              <Ionicons name="person" size={40} color="#16A34A" />
            </View>
          )}
        </View>

        <Text style={profileCardStyles.name}>{user.full_name}</Text>
        <Text style={profileCardStyles.email}>{user.email}</Text>

        {user.role === 'admin' && (
          <View style={badgeStyles.container}>
            <Text style={badgeStyles.text}>Admin</Text>
          </View>
        )}

        <TouchableOpacity style={editButtonStyles.container} onPress={handleEditProfile}>
          <Ionicons name="create-outline" size={18} color="#16A34A" />
          <Text style={editButtonStyles.text}>Edit Profil</Text>
        </TouchableOpacity>
      </View>

      {/* User Info Section */}
      <View style={sectionStyles.container}>
        <Text style={sectionStyles.title}>Informasi Akun</Text>

        <View style={infoCardStyles.container}>
          <View style={infoRowStyles.container}>
            <View style={infoIconStyles.container}>
              <Ionicons name="mail-outline" size={20} color="#16A34A" />
            </View>
            <View style={infoContentStyles.container}>
              <Text style={infoContentStyles.label}>Email</Text>
              <Text style={infoContentStyles.value}>{user.email}</Text>
            </View>
          </View>

          <View style={dividerStyles.line} />

          <View style={infoRowStyles.container}>
            <View style={infoIconStyles.container}>
              <Ionicons name="call-outline" size={20} color="#16A34A" />
            </View>
            <View style={infoContentStyles.container}>
              <Text style={infoContentStyles.label}>No. Telepon</Text>
              <Text style={infoContentStyles.value}>{user.phone || '-'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Menu Section */}
      <View style={sectionStyles.container}>
        <Text style={sectionStyles.title}>Menu</Text>

        <View style={menuCardStyles.container}>
          {/* Riwayat Sewa */}
          <TouchableOpacity style={menuItemStyles.container} onPress={handleMyRentals}>
            <View style={menuItemStyles.left}>
              <View style={menuIconContainerStyles.wrapper}>
                <Ionicons name="time-outline" size={22} color="#16A34A" />
              </View>
              <Text style={menuItemStyles.text}>Riwayat Sewa</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={dividerStyles.line} />

          {/* Ganti Password */}
          <TouchableOpacity style={menuItemStyles.container} onPress={handleChangePassword}>
            <View style={menuItemStyles.left}>
              <View style={menuIconContainerStyles.wrapper}>
                <Ionicons name="lock-closed-outline" size={22} color="#16A34A" />
              </View>
              <Text style={menuItemStyles.text}>Ganti Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={dividerStyles.line} />

          {/* Bantuan */}
          <TouchableOpacity style={menuItemStyles.container} onPress={handleHelp}>
            <View style={menuItemStyles.left}>
              <View style={menuIconContainerStyles.wrapper}>
                <Ionicons name="help-circle-outline" size={22} color="#16A34A" />
              </View>
              <Text style={menuItemStyles.text}>Bantuan</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={dividerStyles.line} />

          {/* Tentang Aplikasi */}
          <TouchableOpacity style={menuItemStyles.container} onPress={handleAbout}>
            <View style={menuItemStyles.left}>
              <View style={menuIconContainerStyles.wrapper}>
                <Ionicons name="information-circle-outline" size={22} color="#16A34A" />
              </View>
              <Text style={menuItemStyles.text}>Tentang Aplikasi</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Button */}
      <View style={sectionStyles.container}>
        <TouchableOpacity style={logoutButtonStyles.container} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={logoutButtonStyles.text}>Keluar</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={footerStyles.container}>
        <Text style={footerStyles.text}>RentRide v1.0.0</Text>
      </View>
    </ScrollView>
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

// Loading Styles
const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
});

// Header Styles
const headerStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
});

// Profile Card Styles
const profileCardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 24,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
});

// Avatar Styles
const avatarStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Badge Styles
const badgeStyles = StyleSheet.create({
  container: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

// Edit Button Styles
const editButtonStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#16A34A',
    borderRadius: 12,
  },
  text: {
    color: '#16A34A',
    fontSize: 14,
    fontWeight: '600',
  },
});

// Section Styles
const sectionStyles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
});

// Info Card Styles
const infoCardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
});

// Info Row Styles
const infoRowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
});

// Info Icon Styles
const infoIconStyles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
});

// Info Content Styles
const infoContentStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});

// Menu Card Styles
const menuCardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
});

// Menu Item Styles
const menuItemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
});

// Menu Icon Container Styles
const menuIconContainerStyles = StyleSheet.create({
  wrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
});

// Divider Styles
const dividerStyles = StyleSheet.create({
  line: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
});

// Logout Button Styles
const logoutButtonStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  text: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// Footer Styles
const footerStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  text: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});