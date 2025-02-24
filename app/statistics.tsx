import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Feather } from '@expo/vector-icons';
import { API_URL } from './_constants';

interface Statistics {
  monthlySpending: number;
  yearlySpending: number;
  monthlyChangePercentage: number;
  yearlyChangePercentage: number;
  year: number;
}

export default function Statistics() {
  const router = useRouter();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/api/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setStatistics(response.data);
      setError(null);
    } catch (error: any) {
      console.error('İstatistik yükleme hatası:', error);
      if (error.response?.status === 404 || error.message.includes('bulunamadı')) {
        setError('İstatistik bilgileriniz bulunmamaktadır.');
      } else {
        setError('İstatistikler yüklenirken bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getTrendIcon = (percentage: number) => {
    if (percentage > 0) return { name: "trending-up", color: "#4CAF50" };
    if (percentage < 0) return { name: "trending-down", color: "#FF3B30" };
    return { name: "minus", color: "#71727A" };
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>İstatistikler</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  const monthlyChangePercentage = statistics?.monthlyChangePercentage || 0;
  const yearlyChangePercentage = statistics?.yearlyChangePercentage || 0;
  const monthlyTrend = getTrendIcon(monthlyChangePercentage);
  const yearlyTrend = getTrendIcon(yearlyChangePercentage);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>İstatistikler</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardBackground}>
            <Feather name="trending-up" size={100} color="rgba(70, 73, 229, 0.05)" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Aylık Harcama</Text>
            <Text style={styles.amount}>{statistics && formatCurrency(statistics.monthlySpending)}</Text>
            <View style={styles.changeContainer}>
              <Feather 
                name={monthlyTrend.name as any}
                size={20} 
                color={monthlyTrend.color}
              />
              <Text style={[
                styles.changeText,
                { color: monthlyTrend.color }
              ]}>
                {monthlyChangePercentage}% {monthlyChangePercentage > 0 ? "artış" : monthlyChangePercentage < 0 ? "azalış" : "değişim yok"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardBackground}>
            <Feather name="calendar" size={100} color="rgba(70, 73, 229, 0.05)" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Yıllık Harcama</Text>
            <Text style={styles.amount}>{statistics && formatCurrency(statistics.yearlySpending)}</Text>
            <View style={styles.changeContainer}>
              <Feather 
                name={yearlyTrend.name as any}
                size={20} 
                color={yearlyTrend.color}
              />
              <Text style={[
                styles.changeText,
                { color: yearlyTrend.color }
              ]}>
                {yearlyChangePercentage}% {yearlyChangePercentage > 0 ? "artış" : yearlyChangePercentage < 0 ? "azalış" : "değişim yok"}
              </Text>
            </View>
          </View>
        </View>
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

          <TouchableOpacity 
            style={styles.bottomBarItem}
          >
            <Feather name="bar-chart-2" size={24} color="#9799FF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.bottomBarItem}
            onPress={() => router.push('/settings')}
          >
            <Feather name="settings" size={24} color="#71727A" />
          </TouchableOpacity>
        </View>
      </View>
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
  titleContainer: {
    flex: 1,
    alignItems: 'flex-end',
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
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
    fontFamily: 'Poppins-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
  },
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  cardBackground: {
    position: 'absolute',
    right: -20,
    top: '50%',
    transform: [{ translateY: -50 }],
  },
  cardContent: {
    position: 'relative',
    zIndex: 1,
  },
  cardTitle: {
    fontSize: 14,
    color: '#71727A',
    fontFamily: 'Poppins-Regular',
    marginBottom: 8,
  },
  amount: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
    marginBottom: 12,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changeText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
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
}); 