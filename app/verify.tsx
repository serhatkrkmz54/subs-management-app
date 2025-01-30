import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import BackButton from '../components/BackButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';

export default function Verify() {
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(900);
  const [email, setEmail] = useState('');
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    getEmailFromStorage();
    startTimer();
  }, []);

  const getEmailFromStorage = async () => {
    try {
      const storedEmail = await AsyncStorage.getItem('userEmail');
      if (storedEmail) {
        setEmail(storedEmail);
      } else {
        router.replace('/register');
      }
    } catch (error) {
      console.error('Email okuma hatası:', error);
    }
  };

  const startTimer = () => {
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  };

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text.length === 1 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const resendCode = async () => {
    if (timer > 0) return;
    
    try {
      setLoading(true);
      await axios.post('http://10.0.2.2:8080/auth/re-send-activation-code', { email });
      
      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'Yeni doğrulama kodu gönderildi.',
      });
      
      setTimer(900);
      startTimer();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: error.response?.data?.message || 'Kod gönderilemedi.',
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Lütfen 6 haneli kodu eksiksiz girin.',
      });
      return;
    }

    try {
      setLoading(true);
      await axios.get(`http://10.0.2.2:8080/auth/activate-account?token=${verificationCode}`);

      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'E-posta adresiniz doğrulandı!',
      });

      await AsyncStorage.removeItem('userEmail');
      
      setTimeout(() => {
        router.replace('login');
      }, 2000);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: error.response?.data?.message || 'Doğrulama başarısız.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.content}>
        <BackButton />
        
        <View style={styles.header}>
          <Text style={styles.title}>E-posta Doğrulama</Text>
          <Text style={styles.subtitle}>
            {email} adresine gönderilen 6 haneli doğrulama kodunu girin.
          </Text>
          <Text style={styles.timerText}>
            {timer > 0 ? `Kod ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')} içinde sona erecek` : 'Kodun süresi doldu'}
          </Text>
        </View>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => inputRefs.current[index] = ref}
              style={styles.codeInput}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.resendButton, timer > 0 && styles.resendButtonDisabled]}
          onPress={resendCode}
          disabled={timer > 0 || loading}
        >
          <Text style={styles.resendText}>
            {timer > 0 ? `${timer} saniye sonra tekrar gönder` : 'Kodu tekrar gönder'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonLoading]}
          onPress={verifyCode}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Doğrulanıyor...' : 'Doğrula'}
          </Text>
        </TouchableOpacity>
      </View>
      <Toast />
    </KeyboardAvoidingView>
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
    lineHeight: 20,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 24,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderColor: '#1A1A2E',
    borderRadius: 12,
    backgroundColor: '#0A0A1B',
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
  resendButton: {
    alignSelf: 'center',
    padding: 8,
    marginBottom: 32,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#9799FF',
  },
  button: {
    height: 56,
    backgroundColor: '#4649E5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLoading: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  timerText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#9799FF',
    marginTop: 8,
  },
}); 