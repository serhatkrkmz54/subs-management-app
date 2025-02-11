import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image, TextInput, ScrollView, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function StaticSubsAdd() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  
  const frequencyOptions = [
    { label: 'Aylık', value: 'AYLIK' },
    { label: 'Yıllık', value: 'YILLIK' }
  ];

  const [formData, setFormData] = useState({
    platformName: params.platformName as string,
    packageName: params.packageName as string,
    amount: params.amount as string,
    currency: params.currency as string,
    frequency: params.frequency as string,
    displayFrequency: frequencyOptions.find(opt => opt.value === params.frequency)?.label || '',
    cardName: '',
    last4Digits: '',
    bitisTarihi: '',
    displayBitisTarihi: ''
  });

  const formatDateForDisplay = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateForBackend = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({
        ...formData,
        bitisTarihi: formatDateForBackend(selectedDate),
        displayBitisTarihi: formatDateForDisplay(selectedDate)
      });
    }
  };

  const getLogoPath = (platformName: string) => {
    const logoMap: { [key: string]: any } = {
      'Netflix': require('../../assets/images/platform-logo/netflix-big-logo.png'),
      'Spotify Premium': require('../../assets/images/platform-logo/spotify-big-logo.png'),
      'Youtube Premium': require('../../assets/images/platform-logo/youtube-big-logo.png'),
      'Amazon Prime': require('../../assets/images/platform-logo/prime-big-logo.png'),
      'Disney+': require('../../assets/images/platform-logo/disneyplus-big-logo.png'),
      'Apple Music': require('../../assets/images/platform-logo/applemusic-big-logo.png'),
      'Tabii': require('../../assets/images/platform-logo/tabii-big-logo.png'),
      'ChatGPT': require('../../assets/images/platform-logo/chatgpt-big-logo.png')
    };
    return logoMap[platformName] || require('../../assets/images/default-user.jpg');
  };

  const handleSubmit = async () => {
    if (!formData.cardName || !formData.last4Digits || !formData.bitisTarihi) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Lütfen tüm alanları doldurun.',
      });
      return;
    }

    if (formData.last4Digits.length !== 4) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Kart numarasının son 4 hanesi 4 karakter olmalıdır.',
      });
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      await axios.post(
        `http://10.0.2.2:8080/payment-plan/add/${params.id}`,
        {
          platformName: formData.platformName,
          packageName: formData.packageName,
          amount: formData.amount,
          currency: formData.currency,
          frequency: formData.frequency,
          cardName: formData.cardName,
          last4Digits: formData.last4Digits,
          bitisTarihi: formData.bitisTarihi
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'Abonelik başarıyla eklendi.',
      });

      setTimeout(() => {
        router.replace('/home');
      }, 2000);

    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Abonelik eklenirken bir hata oluştu.',
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
        <Text style={styles.title}>Abonelik Ekle</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image 
            source={getLogoPath(formData.platformName)} 
            style={styles.platformLogo}
          />
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Abonelik Adı</Text>
            <TextInput
              style={styles.input}
              value={formData.platformName}
              onChangeText={(text: string) => setFormData({ ...formData, platformName: text })}
              placeholder="Abonelik adını girin"
              placeholderTextColor="#71727A"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Paket Adı</Text>
            <TextInput
              style={styles.input}
              value={formData.packageName}
              onChangeText={(text: string) => setFormData({ ...formData, packageName: text })}
              placeholder="Paket adını girin"
              placeholderTextColor="#71727A"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Ödeme Miktarı</Text>
              <TextInput
                style={styles.input}
                value={formData.amount}
                onChangeText={(text: string) => setFormData({ ...formData, amount: text })}
                placeholder="Miktar"
                placeholderTextColor="#71727A"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Ödeme Birimi</Text>
              <TextInput
                style={styles.input}
                value={formData.currency}
                onChangeText={(text: string) => setFormData({ ...formData, currency: text })}
                placeholder="Birim"
                placeholderTextColor="#71727A"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ödeme Sıklığı</Text>
            <TouchableOpacity 
              style={[styles.input, styles.selectInput]}
              onPress={() => setShowFrequencyModal(true)}
            >
              <Text style={[
                styles.selectText,
                formData.displayFrequency ? styles.selectedText : styles.placeholderText
              ]}>
                {formData.displayFrequency || 'Ödeme sıklığını seçin'}
              </Text>
              <Feather name="chevron-down" size={20} color="#71727A" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kartınızın İsmi (Kart üzerinden hatırlamak için)</Text>
            <TextInput
              style={styles.input}
              value={formData.cardName}
              onChangeText={(text: string) => setFormData({ ...formData, cardName: text })}
              placeholder="Kartınızın ismini girin"
              placeholderTextColor="#71727A"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Son 4 Hane</Text>
              <TextInput
                style={styles.input}
                value={formData.last4Digits}
                onChangeText={(text: string) => setFormData({ ...formData, last4Digits: text.replace(/[^0-9]/g, '').slice(0, 4) })}
                placeholder="****"
                placeholderTextColor="#71727A"
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Abonelik Bitiş Tarihi</Text>
              <TouchableOpacity 
                onPress={() => setShowDatePicker(true)}
                style={styles.datePickerButton}
              >
                <TextInput
                  style={styles.input}
                  value={formData.displayBitisTarihi}
                  placeholder="GG-AA-YYYY"
                  placeholderTextColor="#71727A"
                  editable={false}
                />
                <Feather 
                  name="calendar" 
                  size={20} 
                  color="#71727A" 
                  style={styles.calendarIcon}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Ekleniyor...' : 'Aboneliği Ekle'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
   
      <Modal
        visible={showFrequencyModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ödeme Sıklığı Seçin</Text>
              <TouchableOpacity 
                onPress={() => setShowFrequencyModal(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {frequencyOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.optionItem}
                onPress={() => {
                  setFormData({
                    ...formData,
                    frequency: option.value,
                    displayFrequency: option.label
                  });
                  setShowFrequencyModal(false);
                }}
              >
                <Text style={[
                  styles.optionText,
                  formData.frequency === option.value && styles.selectedOption
                ]}>
                  {option.label}
                </Text>
                {formData.frequency === option.value && (
                  <Feather name="check" size={20} color="#4649E5" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
      
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
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  platformLogo: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Poppins-Medium',
  },
  input: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    backgroundColor: '#4649E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  datePickerButton: {
    position: 'relative',
  },
  calendarIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '50%',
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
    color: '#FFFFFF',
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
    borderBottomColor: 'rgba(70, 73, 229, 0.2)',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
  },
  selectedOption: {
    color: '#4649E5',
    fontFamily: 'Poppins-Medium',
  },
  selectText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  selectedText: {
    color: '#FFFFFF',
  },
  placeholderText: {
    color: '#71727A',
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
}); 