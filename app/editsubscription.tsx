import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function EditSubscription() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const getLogoPath = (platformName: string) => {
    const logoMap: { [key: string]: any } = {
      'Netflix': require('../assets/images/platform-logo/netflix-big-logo.png'),
      'Spotify Premium': require('../assets/images/platform-logo/spotify-big-logo.png'),
      'Youtube Premium': require('../assets/images/platform-logo/youtube-big-logo.png'),
      'Amazon Prime': require('../assets/images/platform-logo/prime-big-logo.png'),
      'Disney+': require('../assets/images/platform-logo/disneyplus-big-logo.png'),
      'Apple Music': require('../assets/images/platform-logo/applemusic-big-logo.png'),
      'Tabii': require('../assets/images/platform-logo/tabii-big-logo.png'),
      'ChatGPT': require('../assets/images/platform-logo/chatgpt-big-logo.png')
    };
    return logoMap[platformName] || require('../assets/images/default-user.jpg');
  };

  const [formData, setFormData] = useState({
    id: params.id as string,
    abonelikAdi: params.abonelikAdi as string,
    odemeMiktari: params.odemeMiktari as string,
    odemeBirimi: params.odemeBirimi as string,
    baslangicTarihi: params.baslangicTarihi as string,
    bitisTarihi: params.bitisTarihi as string,
    frequency: params.frequency as string,
    last4Digits: params.last4Digits as string || '',
    cardName: params.cardName as string || ''
  });

  const formatDateForDisplay = (date: string) => {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatDateForBackend = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setFormData({
        ...formData,
        baslangicTarihi: formatDateForBackend(selectedDate)
      });
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setFormData({
        ...formData,
        bitisTarihi: formatDateForBackend(selectedDate)
      });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await axios.put(
        `http://10.0.2.2:8080/payment-plan/duzenle/${formData.id}`,
        {
          abonelikAdi: formData.abonelikAdi,
          odemeMiktari: Number(formData.odemeMiktari),
          odemeBirimi: formData.odemeBirimi,
          baslangicTarihi: formData.baslangicTarihi,
          bitisTarihi: formData.bitisTarihi,
          frequency: formData.frequency,
          last4Digits: formData.last4Digits,
          cardName: formData.cardName
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
          text2: 'Abonelik başarıyla güncellendi',
          visibilityTime: 2000,
        });

        setTimeout(() => {
          router.replace('/home');
        }, 2000);
      }
    } catch (error) {
      console.error('Düzenleme hatası:', error);
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Abonelik güncellenirken bir hata oluştu',
        visibilityTime: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Abonelik Düzenle</Text>
      </View>

      <View style={styles.logoContainer}>
        <Image 
          source={getLogoPath(formData.abonelikAdi)} 
          style={styles.platformLogo}
          resizeMode="contain"
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Abonelik Adı</Text>
          <TextInput
            style={styles.input}
            value={formData.abonelikAdi}
            onChangeText={(text) => setFormData({...formData, abonelikAdi: text})}
            placeholder="Abonelik adını girin"
            placeholderTextColor="#71727A"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Ödeme Miktarı</Text>
            <TextInput
              style={styles.input}
              value={formData.odemeMiktari.toString()}
              onChangeText={(text) => setFormData({...formData, odemeMiktari: text})}
              placeholder="Miktar"
              placeholderTextColor="#71727A"
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Ödeme Birimi</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity 
                style={[
                  styles.radioButton,
                  formData.odemeBirimi === 'TRY' && styles.radioButtonSelected
                ]}
                onPress={() => setFormData({...formData, odemeBirimi: 'TRY'})}
              >
                <Text style={[
                  styles.radioText,
                  formData.odemeBirimi === 'TRY' && styles.radioTextSelected
                ]}>TRY</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.radioButton,
                  formData.odemeBirimi === 'USD' && styles.radioButtonSelected
                ]}
                onPress={() => setFormData({...formData, odemeBirimi: 'USD'})}
              >
                <Text style={[
                  styles.radioText,
                  formData.odemeBirimi === 'USD' && styles.radioTextSelected
                ]}>USD</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Ödeme Sıklığı</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity 
              style={[
                styles.radioButton,
                formData.frequency === 'AYLIK' && styles.radioButtonSelected
              ]}
              onPress={() => setFormData({...formData, frequency: 'AYLIK'})}
            >
              <Text style={[
                styles.radioText,
                formData.frequency === 'AYLIK' && styles.radioTextSelected
              ]}>Aylık</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.radioButton,
                formData.frequency === 'YILLIK' && styles.radioButtonSelected
              ]}
              onPress={() => setFormData({...formData, frequency: 'YILLIK'})}
            >
              <Text style={[
                styles.radioText,
                formData.frequency === 'YILLIK' && styles.radioTextSelected
              ]}>Yıllık</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Kart İsmi</Text>
          <TextInput
            style={styles.input}
            value={formData.cardName}
            onChangeText={(text) => setFormData({...formData, cardName: text})}
            placeholder="Kart ismini girin"
            placeholderTextColor="#71727A"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Son 4 Hane</Text>
          <TextInput
            style={styles.input}
            value={formData.last4Digits}
            onChangeText={(text) => setFormData({...formData, last4Digits: text})}
            placeholder="Son 4 haneyi girin"
            placeholderTextColor="#71727A"
            keyboardType="numeric"
            maxLength={4}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Başlangıç Tarihi</Text>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {formData.baslangicTarihi ? formatDateForDisplay(formData.baslangicTarihi) : 'Seçin'}
              </Text>
              <Feather name="calendar" size={20} color="#71727A" />
            </TouchableOpacity>
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Bitiş Tarihi</Text>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {formData.bitisTarihi ? formatDateForDisplay(formData.bitisTarihi) : 'Seçin'}
              </Text>
              <Feather name="calendar" size={20} color="#71727A" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {showStartDatePicker && (
        <DateTimePicker
          value={formData.baslangicTarihi ? new Date(formData.baslangicTarihi) : new Date()}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={formData.bitisTarihi ? new Date(formData.bitisTarihi) : new Date()}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
          minimumDate={formData.baslangicTarihi ? new Date(formData.baslangicTarihi) : new Date()}
        />
      )}

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
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#9799FF',
    fontFamily: 'Poppins-Medium',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(70, 73, 229, 0.2)',
    minHeight: 48,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioButton: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(70, 73, 229, 0.2)',
    minHeight: 48,
  },
  radioButtonSelected: {
    backgroundColor: '#4649E5',
    borderColor: '#4649E5',
  },
  radioText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  radioTextSelected: {
    fontFamily: 'Poppins-SemiBold',
  },
  dateInput: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(70, 73, 229, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  dateText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#4649E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 100,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    paddingHorizontal: 24,
  },
  platformLogo: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
}); 