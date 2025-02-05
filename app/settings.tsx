import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

interface UserProfile {
  userId: number;
  email: string;
  fullName: string;
  phoneNumber: string;
  gender: string;
  paymentPlans: any[];
}

interface EditedProfile extends UserProfile {
  oldPassword?: string;
  newPassword?: string;
}

export default function Settings() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<EditedProfile>>({});
  const [showOptions, setShowOptions] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

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

      const response = await axios.get('http://10.0.2.2:8080/auth/profil', {
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

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      if ((editedProfile.oldPassword && !editedProfile.newPassword) || 
          (!editedProfile.oldPassword && editedProfile.newPassword)) {
        setPasswordError('Lütfen hem eski hem de yeni parolayı girin');
        return;
      }
      if (editedProfile.newPassword && editedProfile.newPassword.length < 6) {
        setPasswordError('Yeni parola en az 6 karakter olmalıdır');
        return;
      }

      await axios.put('http://10.0.2.2:8080/auth/update-profile', editedProfile, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setProfile({
        ...editedProfile,
        userId: profile!.userId,
        email: profile!.email,
        paymentPlans: profile!.paymentPlans
      } as UserProfile);
      
      setIsEditing(false);
      setPasswordError(null);

      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: editedProfile.newPassword 
          ? 'Profil bilgileriniz ve parolanız güncellendi'
          : 'Profil bilgileriniz güncellendi',
      });
    } catch (error: any) {
      
      const errorMessage = error.response?.data?.hata;
      
      if (errorMessage === 'Eski şifre hatalı.') {
        setPasswordError('Eski şifreniz hatalı');
        Toast.show({
          type: 'error',
          text1: 'Hata',
          text2: 'Eski şifreniz hatalı',
          visibilityTime: 3000,
          position: 'top',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Hata',
          text2: errorMessage || 'Profil güncellenirken bir hata oluştu',
        });
      }
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile as UserProfile);
    setIsEditing(false);
    setPasswordError(null);
  };

  const handleEdit = () => {
    if (profile) {
      setEditedProfile({
        userId: profile.userId,
        email: profile.email,
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber,
        gender: profile.gender,
        paymentPlans: profile.paymentPlans
      });
      setIsEditing(true);
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
        <Text style={styles.title}>Ayarlar</Text>
        {isEditing ? (
          <View style={styles.editButtonsContainer}>
            <TouchableOpacity onPress={handleCancel} style={styles.editButton}>
              <Feather name="x" size={20} color="#FF4444" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.editButton}>
              <Feather name="check" size={20} color="#4649E5" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
            <Feather name="edit-2" size={20} color="#4649E5" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil Bilgileri</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Ad Soyad</Text>
            {isEditing ? (
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
            {isEditing ? (
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
            {isEditing ? (
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

          {isEditing && (
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

              {passwordError && (
                <View style={styles.errorContainer}>
                  <Feather name="alert-circle" size={16} color="#FF4444" />
                  <Text style={styles.errorText}>{passwordError}</Text>
                </View>
              )}
            </View>
          )}
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
            style={styles.addButton}
            onPress={() => setShowOptions(!showOptions)}
          >
            <Feather name={showOptions ? "x" : "plus"} size={32} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomBarItem}>
            <Feather name="settings" size={24} color="#9799FF" />
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
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
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
  sectionTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 16,
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
    height: Platform.OS === 'ios' ? 84 : 64,
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
    paddingHorizontal: 32,
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
}); 