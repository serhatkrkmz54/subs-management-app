import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Feather } from '@expo/vector-icons';

interface Package {
  id: number;
  paketAdi: string;
  sodemeMiktari: number;
  sodemeBirimi: string;
  sfrequency: string;
}

interface Subscription {
  abonelikAdi: string;
  paketler: Package[];
}

export default function StaticSubs() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await axios.get('http://10.0.2.2:8080/payment-plan/static-subscriptions', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setSubscriptions(response.data);
    } catch (error) {
      console.error('API Hatası:', error);
    }
  };

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

  const filteredSubscriptions = subscriptions.filter(subscription =>
    subscription.abonelikAdi.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Hazır Paket Abonelikler</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Abonelik ara..."
          placeholderTextColor="#71727A"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Feather name="search" size={20} color="#71727A" style={styles.searchIcon} />
      </View>

      <ScrollView style={styles.content}>
        {filteredSubscriptions.map((subscription) => (
          <View key={subscription.abonelikAdi} style={styles.platformContainer}>
            <TouchableOpacity 
              style={styles.platformHeader}
              onPress={() => setExpandedPlatform(
                expandedPlatform === subscription.abonelikAdi ? null : subscription.abonelikAdi
              )}
            >
              <View style={styles.platformInfo}>
                <Image 
                  source={getLogoPath(subscription.abonelikAdi)} 
                  style={styles.platformLogo}
                />
                <View>
                  <Text style={styles.platformName}>{subscription.abonelikAdi}</Text>
                  <Text style={styles.planCount}>
                    {subscription.paketler.length} farklı paket
                  </Text>
                </View>
              </View>
              <Feather 
                name={expandedPlatform === subscription.abonelikAdi ? "minus" : "plus"} 
                size={24} 
                color="#4649E5" 
              />
            </TouchableOpacity>

            {expandedPlatform === subscription.abonelikAdi && (
              <View style={styles.plansContainer}>
                {subscription.paketler.map((plan) => (
                  <TouchableOpacity key={plan.id} style={styles.planItem}>
                    <View>
                      <Text style={styles.planName}>{plan.paketAdi}</Text>
                      <Text style={styles.planFrequency}>
                        {plan.sfrequency.toLowerCase()} ödeme
                      </Text>
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={styles.planPrice}>
                        {plan.sodemeMiktari} {plan.sodemeBirimi}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
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
    fontSize: 22,
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  platformContainer: {
    marginBottom: 16,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    overflow: 'hidden',
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  platformLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  platformName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 4,
  },
  planCount: {
    fontSize: 12,
    color: '#71727A',
    fontFamily: 'Poppins-Regular',
  },
  plansContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(70, 73, 229, 0.2)',
    paddingVertical: 8,
  },
  planItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(70, 73, 229, 0.1)',
  },
  planName: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Poppins-Medium',
    marginBottom: 4,
  },
  planFrequency: {
    fontSize: 12,
    color: '#71727A',
    fontFamily: 'Poppins-Regular',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  planPrice: {
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'Poppins-SemiBold',
  },
  searchContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    paddingLeft: 48,
    color: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: 16,
  },
}); 