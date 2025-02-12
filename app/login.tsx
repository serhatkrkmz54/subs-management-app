import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import BackButton from '../components/BackButton';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { API_URL } from './constants';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState<boolean | null>(null);


  async function getExpoPushToken() {
  let token = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Bildirim izni verilmedi!');
    return null;
  }

  if (Device.isDevice) {
    const { data } = await Notifications.getExpoPushTokenAsync();
    token = data;
  } else {
    console.log('Fiziksel bir cihazda çalıştırmalısın!');
  }

  return token;
}
  
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

  const handleLogin = async () => {
    if (!email || !password) {
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

      const expoPushToken = await getExpoPushToken();

      const response = await axios.post(`${API_URL}/auth/authenticate`, {
        email,
        password,
        expoPushToken,
      });

      await AsyncStorage.setItem('userToken', response.data.token);
      console.log(expoPushToken);
      
      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'Giriş yapıldı!',
      });

      setTimeout(() => {
        router.replace('/home');
      }, 1000);

    } catch (error: any) {
      let errorMessage = 'Giriş yapılamadı.';
      
      if (error.response?.data?.hata === 'User is disabled') {
        try {
          await axios.post(`${API_URL}/auth/re-send-activation-code`, { email });
          await AsyncStorage.setItem('userEmail', email);
          
          Toast.show({
            type: 'info',
            text1: 'Doğrulama Gerekli',
            text2: 'E-posta adresiniz doğrulanmamış, yeni bir doğrulama kodu gönderdik.',
          });

          setTimeout(() => {
            router.replace('/verify');
          }, 2000);
          return;
        } catch (resendError) {
          errorMessage = 'Doğrulama kodu gönderilirken bir hata oluştu.';
        }
      } else if (error.response?.data?.hata === 'Bad credentials') {
        errorMessage = 'E-posta adresi veya şifre hatalı.';
      } else if (error.response?.data?.hataKoduAciklama) {
        errorMessage = error.response.data.hataKoduAciklama;
      }

      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <BackButton />
        
        <View style={styles.header}>
          <Text style={styles.title}>Hoş Geldiniz</Text>
          <Text style={styles.subtitle}>Hesabınıza giriş yapın ve aboneliklerinizi yönetin!</Text>
        </View>

        <View style={styles.form}>
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

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Şifreniz"
              placeholderTextColor="#A0A0A0"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              returnKeyType="done"
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
            style={[styles.button, loading && styles.buttonLoading]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Hesabınız yok mu? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.registerLink}>Kayıt Olun</Text>
            </TouchableOpacity>
          </View>
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
  content: {
    flex: 1,
    padding: 24,
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
  button: {
    height: 56,
    backgroundColor: '#4649E5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  buttonLoading: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  registerText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
  },
  registerLink: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#9799FF',
  },
});