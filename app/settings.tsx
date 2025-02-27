import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { API_URL } from './_constants';

interface UserProfile {
  userId: number;
  email: string;
  fullName: string;
  phoneNumber: string;
  gender: string;
  paymentPlans: any[];
  settings: number;
}

interface EditedProfile extends UserProfile {
  oldPassword?: string;
  newPassword?: string;
  newPasswordConfirm?: string;
}

export default function Settings() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingNotifications, setIsEditingNotifications] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<EditedProfile>>({});
  const [showOptions, setShowOptions] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/auth/profil`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setProfile(response.data);
    } catch (error) {
      console.error('Profil yükleme hatası:', error);
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Profil bilgileri yüklenirken bir hata oluştu',
      });
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Çıkış Yap",
      "Çıkış yapmak istediğinize emin misiniz?",
      [
        {
          text: "İptal",
          style: "cancel"
        },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem('userToken');
            router.replace('/login');
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    if (profile) {
      setEditedProfile({
        userId: profile.userId,
        email: profile.email,
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber,
        gender: profile.gender,
        paymentPlans: profile.paymentPlans,
        settings: profile.settings
      });
      setIsEditingProfile(true);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (editedProfile.newPassword && editedProfile.newPassword !== editedProfile.newPasswordConfirm) {
        setPasswordError('Yeni parolalar eşleşmiyor');
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: 500,
            animated: true
          });
        }, 100);
        return;
      }

      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await axios.put(
        `${API_URL}/auth/update-profile`,
        {
          email: editedProfile.email,
          fullName: editedProfile.fullName,
          phoneNumber: editedProfile.phoneNumber,
          gender: editedProfile.gender,
          oldPassword: editedProfile.oldPassword,
          newPassword: editedProfile.newPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.status === 200) {
        Toast.show({
          type: 'success',
          text1: 'Başarılı',
          text2: 'Profil bilgileriniz güncellendi',
          visibilityTime: 2000,
        });

        setProfile({
          ...profile,
          ...editedProfile,
          oldPassword: undefined,
          newPassword: undefined
        });
        setEditedProfile({
          ...editedProfile,
          oldPassword: '',
          newPassword: '',
          newPasswordConfirm: ''
        });
        setPasswordError('');
        setIsEditingProfile(false);
      }
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Profil güncellenirken bir hata oluştu',
        visibilityTime: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      if (!editedProfile.settings || editedProfile.settings <= 0) {
        Toast.show({
          type: 'error',
          text1: 'Hata',
          text2: 'Abonelik bitiş bildirim gün sayısı en az 1 gün olmalıdır!',
          visibilityTime: 2000,
        });
        return;
      }

      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      await axios.post(
        `${API_URL}/settings/${profile?.userId}/notification-days?days=${editedProfile.settings}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'Bildirim ayarlarınız güncellendi',
        visibilityTime: 2000,
      });

      setProfile({
        ...profile,
        settings: editedProfile.settings
      });
      setIsEditingNotifications(false);
    } catch (error) {
      console.error('Bildirim ayarları güncelleme hatası:', error);
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Bildirim ayarları güncellenirken bir hata oluştu',
        visibilityTime: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelProfile = () => {
    setEditedProfile(profile as UserProfile);
    setIsEditingProfile(false);
    setPasswordError(null);
  };

  const handleCancelNotifications = () => {
    setEditedProfile(profile as UserProfile);
    setIsEditingNotifications(false);
  };

  const handleEditNotifications = () => {
    if (profile) {
      setEditedProfile({
        ...profile,
        settings: profile.settings
      });
      setIsEditingNotifications(true);
    }
  };

  const genderOptions = [
    { label: 'Erkek', value: 'ERKEK' },
    { label: 'Kadın', value: 'KADIN' },
  ];

  const getGenderLabel = (value: string) => {
    return value === 'ERKEK' ? 'Erkek' : 'Kadın';
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Ayarlar</Text>
        </View>
      </View>

      <View style={styles.profileHeader}>
        <Image 
          source={require('../assets/images/default-user.jpg')} 
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>{profile?.fullName || 'Kullanıcı'}</Text>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profil Bilgileri</Text>
            {isEditingProfile ? (
              <View style={styles.editButtonsContainer}>
                <TouchableOpacity onPress={handleCancelProfile} style={styles.editButton}>
                  <Feather name="x" size={20} color="#FF4444" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveProfile} style={styles.editButton}>
                  <Feather name="check" size={20} color="#4649E5" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
                <Feather name="edit-2" size={20} color="#4649E5" />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Ad Soyad</Text>
            {isEditingProfile ? (
              <TextInput
                style={styles.input}
                value={editedProfile.fullName}
                onChangeText={(text) => setEditedProfile({...editedProfile, fullName: text})}
                placeholder="Ad Soyad"
                placeholderTextColor="#71727A"
              />
            ) : (
              <Text style={styles.value}>{profile.fullName}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>E-posta</Text>
            <Text style={styles.value}>{profile.email}</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Telefon Numarası</Text>
            {isEditingProfile ? (
              <TextInput
                style={styles.input}
                value={editedProfile.phoneNumber}
                onChangeText={(text) => setEditedProfile({...editedProfile, phoneNumber: text})}
                placeholder="Telefon Numarası"
                placeholderTextColor="#71727A"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.value}>{profile.phoneNumber}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Cinsiyet</Text>
            {isEditingProfile ? (
              <View style={styles.genderContainer}>
                {genderOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.genderButton,
                      editedProfile.gender === option.value && styles.genderButtonSelected
                    ]}
                    onPress={() => setEditedProfile({...editedProfile, gender: option.value})}
                  >
                    <Text style={[
                      styles.genderButtonText,
                      editedProfile.gender === option.value && styles.genderButtonTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.value}>{getGenderLabel(profile.gender)}</Text>
            )}
          </View>

          {isEditingProfile && (
            <View style={styles.passwordSection}>
              <Text style={styles.passwordTitle}>Parola Değiştirme (İsteğe Bağlı)</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Eski Parola</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.input}
                    value={editedProfile.oldPassword}
                    onChangeText={(text) => {
                      setEditedProfile({...editedProfile, oldPassword: text});
                      setPasswordError(null);
                    }}
                    placeholder="Eski parolanızı girin"
                    placeholderTextColor="#71727A"
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Feather 
                      name={showPassword ? "eye" : "eye-off"} 
                      size={20} 
                      color="#71727A" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Yeni Parola</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.input}
                    value={editedProfile.newPassword}
                    onChangeText={(text) => {
                      setEditedProfile({...editedProfile, newPassword: text});
                      setPasswordError(null);
                    }}
                    placeholder="Yeni parolanızı girin"
                    placeholderTextColor="#71727A"
                    secureTextEntry={!showNewPassword}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Feather 
                      name={showNewPassword ? "eye" : "eye-off"} 
                      size={20} 
                      color="#71727A" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Yeni Parola Tekrar</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.input}
                    value={editedProfile.newPasswordConfirm}
                    onChangeText={(text) => {
                      setEditedProfile({...editedProfile, newPasswordConfirm: text});
                      setPasswordError(null);
                    }}
                    placeholder="Yeni parolanızı tekrar girin"
                    placeholderTextColor="#71727A"
                    secureTextEntry={!showNewPasswordConfirm}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => setShowNewPasswordConfirm(!showNewPasswordConfirm)}
                  >
                    <Feather 
                      name={showNewPasswordConfirm ? "eye" : "eye-off"} 
                      size={20} 
                      color="#71727A" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {passwordError && (
                <View style={styles.errorContainer}>
                  <Feather name="alert-circle" size={16} color="#FF4444" />
                  <Text style={styles.errorText}>{passwordError}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bildirim Ayarları</Text>
            {isEditingNotifications ? (
              <View style={styles.editButtonsContainer}>
                <TouchableOpacity onPress={handleCancelNotifications} style={styles.editButton}>
                  <Feather name="x" size={20} color="#FF4444" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveNotifications} style={styles.editButton}>
                  <Feather name="check" size={20} color="#4649E5" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={handleEditNotifications} style={styles.editButton}>
                <Feather name="edit-2" size={20} color="#4649E5" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Abonelik Bitiş Bildirimi</Text>
            <Text style={styles.description}>
              Aboneliklerinizin bitiş tarihine kaç gün kala bildirim almak istiyorsunuz?
            </Text>
            {isEditingNotifications ? (
              <TextInput
                style={styles.input}
                value={editedProfile.settings?.toString()}
                onChangeText={(text) => {
                  const value = parseInt(text);
                  if (!text) {
                    setEditedProfile({...editedProfile, settings: undefined});
                  } else if (value > 0) {
                    setEditedProfile({...editedProfile, settings: value});
                  }
                }}
                placeholder="Gün sayısı"
                placeholderTextColor="#71727A"
                keyboardType="numeric"
              />
            ) : (
              <Text style={styles.value}>{profile.settings || 5} gün</Text>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Feather name="log-out" size={20} color="#FF4444" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>

      {showOptions && (
        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.optionButton}
            onPress={() => {
              router.push('/staticsubs');
              setShowOptions(false);
            }}
          >
            <Text style={styles.optionText}>Hazır aboneliklerden ekle</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.optionButton}
            onPress={() => {
              router.push('/subscriptioncreate');
              setShowOptions(false);
            }}
          >
            <Text style={styles.optionText}>Yeni Abonelik Oluştur</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <TouchableOpacity 
            style={styles.bottomBarItem}
            onPress={() => router.push('/home')}
          >
            <Feather name="home" size={24} color="#71727A" />
          </TouchableOpacity>

          

          <TouchableOpacity 
            style={styles.bottomBarItem}
            onPress={() => router.push('/statistics')}
          >
            <Feather name="bar-chart-2" size={24} color="#71727A" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowOptions(!showOptions)}
          >
            <Feather name={showOptions ? "x" : "plus"} size={32} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomBarItem}>
            <Feather name="settings" size={24} color="#9799FF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.bottomBarItem}
            onPress={handleLogout}
          >
            <Feather name="log-out" size={24} color="#FF4444" />
          </TouchableOpacity>
        </View>
      </View>
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050511',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
  },
  editButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 32,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#71727A',
    fontFamily: 'Poppins-Regular',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins-Medium',
  },
  input: {
    backgroundColor: '#050511',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  logoutText: {
    color: '#FF4444',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
    fontFamily: 'Poppins-Regular',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 84 : 84,
    backgroundColor: 'rgba(10, 10, 27, 0.95)',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 26, 46, 0.5)',
  },
  bottomBarContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  bottomBarItem: {
    padding: 12,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4649E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  optionsContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 104 : 84,
    left: 24,
    right: 24,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(70, 73, 229, 0.2)',
  },
  optionButton: {
    backgroundColor: '#4649E5',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#050511',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(70, 73, 229, 0.2)',
  },
  genderButtonSelected: {
    backgroundColor: '#4649E5',
    borderColor: '#4649E5',
  },
  genderButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  genderButtonTextSelected: {
    fontFamily: 'Poppins-SemiBold',
  },
  passwordSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(70, 73, 229, 0.2)',
  },
  passwordTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  description: {
    fontSize: 12,
    color: '#71727A',
    fontFamily: 'Poppins-Regular',
    marginBottom: 12,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(70, 73, 229, 0.1)',
    marginBottom: 24,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  profileName: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
}); 