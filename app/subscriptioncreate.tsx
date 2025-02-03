import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';

export default function SubscriptionCreate() {
  const router = useRouter();
  
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    abonelikAdi: '',
    odemeMiktari: '',
    odemeBirimi: 'TRY',
    bitisTarihi: '',
    frequency: 'AYLIK',
    last4Digits: '',
    cardName: '',
    baslangicTarihi: formatDate(new Date())
  });

  const [showBitisPicker, setShowBitisPicker] = useState(false);
  const [showBaslangicPicker, setShowBaslangicPicker] = useState(false);

  const handleBitisDateChange = (event: any, selectedDate?: Date) => {
    setShowBitisPicker(false);
    if (selectedDate) {
      setFormData({...formData, bitisTarihi: formatDate(selectedDate)});
    }
  };

  const handleBaslangicDateChange = (event: any, selectedDate?: Date) => {
    setShowBaslangicPicker(false);
    if (selectedDate) {
      setFormData({...formData, baslangicTarihi: formatDate(selectedDate)});
    }
  };

  const handleSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await axios.post(
        'http://10.0.2.2:8080/payment-plan/add',
        {
          ...formData,
          odemeMiktari: parseFloat(formData.odemeMiktari),
          last4Digits: formData.last4Digits.toString(),
          odemeTarihi: formData.baslangicTarihi
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        Toast.show({
          type: 'success',
          text1: 'Başarılı',
          text2: 'Abonelik başarıyla eklendi',
          visibilityTime: 2000,
          autoHide: true,
          topOffset: 30,
          bottomOffset: 40,
        });

        setTimeout(() => {
          router.push('/home');
        }, 2000);
      }
    } catch (error) {
      console.error('Abonelik oluşturma hatası:', error);
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Abonelik eklenirken bir hata oluştu',
        visibilityTime: 2000,
        autoHide: true,
        topOffset: 30,
        bottomOffset: 40,
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Abonelik Oluştur</Text>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formGroup}>
          <Text style={styles.label}>Abonelik Adı</Text>
          <TextInput
            style={styles.input}
            value={formData.abonelikAdi}
            onChangeText={(text) => setFormData({...formData, abonelikAdi: text})}
            placeholder="Örn: Elektrik"
            placeholderTextColor="#71727A"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Ödeme Miktarı</Text>
          <TextInput
            style={styles.input}
            value={formData.odemeMiktari}
            onChangeText={(text) => setFormData({...formData, odemeMiktari: text})}
            placeholder="Örn: 3000.00"
            placeholderTextColor="#71727A"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.formGroup}>
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
          <Text style={styles.label}>Başlangıç Tarihi</Text>
          <TouchableOpacity 
            style={styles.input}
            onPress={() => setShowBaslangicPicker(true)}
          >
            <Text style={[styles.inputText, !formData.baslangicTarihi && styles.placeholderText]}>
              {formData.baslangicTarihi || 'YYYY-AA-GG'}
            </Text>
          </TouchableOpacity>
          {showBaslangicPicker && (
            <DateTimePicker
              value={formData.baslangicTarihi ? new Date(formData.baslangicTarihi) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleBaslangicDateChange}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Bitiş Tarihi</Text>
          <TouchableOpacity 
            style={styles.input}
            onPress={() => setShowBitisPicker(true)}
          >
            <Text style={[styles.inputText, !formData.bitisTarihi && styles.placeholderText]}>
              {formData.bitisTarihi || 'YYYY-AA-GG'}
            </Text>
          </TouchableOpacity>
          {showBitisPicker && (
            <DateTimePicker
              value={formData.bitisTarihi ? new Date(formData.bitisTarihi) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleBitisDateChange}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Kart Son 4 Hane</Text>
          <TextInput
            style={styles.input}
            value={formData.last4Digits}
            onChangeText={(text) => setFormData({...formData, last4Digits: text})}
            placeholder="Örn: 6680"
            placeholderTextColor="#71727A"
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Kart İsmi</Text>
          <TextInput
            style={styles.input}
            value={formData.cardName}
            onChangeText={(text) => setFormData({...formData, cardName: text})}
            placeholder="Örn: Vakıfbank"
            placeholderTextColor="#71727A"
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Abonelik Oluştur</Text>
        </TouchableOpacity>
      </ScrollView>
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
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 32,
  },
  formGroup: {
    marginBottom: 24,
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
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(70, 73, 229, 0.2)',
  },
  submitButton: {
    backgroundColor: '#4649E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
  },
  inputText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
  },
  placeholderText: {
    color: '#71727A',
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
  },
  radioButtonSelected: {
    backgroundColor: '#4649E5',
    borderColor: '#4649E5',
  },
  radioText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  radioTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
  },
}); 