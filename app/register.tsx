import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import BackButton from '../components/BackButton';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Register() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState<boolean | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const limited = cleaned.slice(0, 10);
    const match = limited.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!match) return '';
    const formatted = [match[1], match[2], match[3]]
      .filter(Boolean)
      .join('-');
    return formatted;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhone(formatted);
  };

  const genderOptions = [
    { label: 'Erkek', value: 'ERKEK' },
    { label: 'Kadın', value: 'KADIN' },
  ];

  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (text.length > 0) {
      setIsEmailValid(validateEmail(text));
    } else {
      setIsEmailValid(null);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setGender('');
    setAcceptTerms(false);
  };

  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !gender || !acceptTerms) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Lütfen tüm alanları doldurun.',
      });
      return;
    }

    if (!isEmailValid) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Geçerli bir e-posta adresi girin.',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('http://10.0.2.2:8080/auth/register', {
        fullName: name,
        email,
        phoneNumber: phone.replace(/-/g, ''),
        password,
        gender
      });

      await AsyncStorage.setItem('userEmail', email);

      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'Kayıt işleminiz tamamlandı!',
      });

      resetForm();
      
      setTimeout(() => {
        router.replace('/verify');
      }, 2000);

    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: error.response?.data?.message || 'Bir hata oluştu.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.content}>
            <BackButton />
            
            <View style={styles.header}>
              <Text style={styles.title}>Hesap Oluştur</Text>
              <Text style={styles.subtitle}>Hızlıca hesap oluşturup, aboneliklerinizi yönetin!</Text>
            </View>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Adınız ve Soyadınız"
                placeholderTextColor="#A0A0A0"
                value={name}
                onChangeText={setName}
              />

              <TextInput
                style={[
                  styles.input,
                  isEmailValid !== null && {
                    borderColor: isEmailValid ? '#4CAF50' : '#FF3B30',
                    borderWidth: 1.5
                  }
                ]}
                placeholder="E-Posta Adresiniz"
                placeholderTextColor="#A0A0A0"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={handleEmailChange}
              />

              <TextInput
                style={styles.input}
                placeholder="Telefon Numaranız"
                placeholderTextColor="#A0A0A0"
                keyboardType="numeric"
                value={phone}
                onChangeText={handlePhoneChange}
                maxLength={12}
              />
              
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Şifre belirleyin"
                  placeholderTextColor="#A0A0A0"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Feather 
                    name={showPassword ? "eye" : "eye-off"} 
                    size={20} 
                    color="#A0A0A0" 
                  />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.input}
                onPress={() => setShowGenderModal(true)}
              >
                <Text style={[styles.dateText, gender && styles.selectedText]}>
                  {gender ? genderOptions.find(opt => opt.value === gender)?.label : 'Cinsiyetiniz'}
                </Text>
                <Feather name="chevron-down" size={20} color="#A0A0A0" />
              </TouchableOpacity>

              <View style={styles.termsContainer}>
                <TouchableOpacity 
                  style={styles.checkbox}
                  onPress={() => setAcceptTerms(!acceptTerms)}
                >
                  {acceptTerms && <Feather name="check" size={14} color="#7F3DFF" />}
                </TouchableOpacity>
                <Text style={styles.termsText}>
                  <Text 
                    style={styles.termsLink}
                    onPress={() => setShowTermsModal(true)}
                  >
                    Üyelik şartlarını
                  </Text> okudum ve kabul ediyorum.{' '}
                </Text>
              </View>

              <TouchableOpacity 
                style={[
                  styles.button, 
                  !acceptTerms && styles.buttonDisabled,
                  loading && styles.buttonLoading
                ]}
                disabled={!acceptTerms || loading}
                onPress={handleRegister}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Kaydediliyor...' : 'Hesabımı Oluştur'}
                </Text>
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Hesabınız var mı? </Text>
                <TouchableOpacity onPress={() => router.replace('login')}>
                  <Text style={styles.loginLink}>Giriş Yapın</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        <Modal
          visible={showGenderModal}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Cinsiyet Seçin</Text>
                <TouchableOpacity 
                  onPress={() => setShowGenderModal(false)}
                  style={styles.closeButton}
                >
                  <Feather name="x" size={24} color="#000000" />
                </TouchableOpacity>
              </View>
              
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.optionItem}
                  onPress={() => {
                    setGender(option.value);
                    setShowGenderModal(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    gender === option.value && styles.selectedOption
                  ]}>
                    {option.label}
                  </Text>
                  {gender === option.value && (
                    <Feather name="check" size={20} color="#7F3DFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        <Modal
          visible={showTermsModal}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.termsModalContent]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Üyelik Şartları</Text>
                <TouchableOpacity 
                  onPress={() => setShowTermsModal(false)}
                  style={styles.closeButton}
                >
                  <Feather name="x" size={24} color="#000000" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.termsScrollView}>
                <Text style={styles.termsModalText}>
                  {/* Buraya üyelik şartları metni gelecek */}
                  Üyelik şartları metni buraya eklenecek...
                </Text>
              </ScrollView>

              <TouchableOpacity 
                style={styles.termsAcceptButton}
                onPress={() => {
                  setAcceptTerms(true);
                  setShowTermsModal(false);
                }}
              >
                <Text style={styles.termsAcceptButtonText}>Kabul Ediyorum</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050511',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#BBBBC8',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#9799FF',
  },
  form: {
    gap: 16,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#1A1A2E',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
    backgroundColor: '#0A0A1B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    height: 56,
    borderWidth: 1,
    borderColor: '#1A1A2E',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
    backgroundColor: '#0A0A1B',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 18,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#A0A0A0',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#7F3DFF',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  termsLink: {
    color: '#9799FF',
    fontFamily: 'Poppins-Medium',
  },
  button: {
    height: 56,
    backgroundColor: '#4649E5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
  },
  loginLink: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#9799FF',
  },
  selectedText: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#000000',
  },
  selectedOption: {
    color: '#7F3DFF',
    fontFamily: 'Poppins-Medium',
  },
  termsModalContent: {
    maxHeight: '80%',
  },
  termsScrollView: {
    marginVertical: 16,
  },
  termsModalText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#000000',
    lineHeight: 24,
  },
  termsAcceptButton: {
    height: 56,
    backgroundColor: '#4649E5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  termsAcceptButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  buttonLoading: {
    opacity: 0.7,
  },
}); 