import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Feather } from '@expo/vector-icons';

interface UserProfile {
  fullName: string;
  paymentPlans: any[];
}

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [greeting, setGreeting] = useState('');
  const arrowPosition = new Animated.Value(0);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    fetchProfile();
    setGreeting(getGreeting());
  }, []);

  useEffect(() => {
    if (profile?.paymentPlans?.length === 0 && !showOptions) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(arrowPosition, {
            toValue: 1,
            duration: 1500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(arrowPosition, {
            toValue: 0,
            duration: 1500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );
      
      animation.start();
      
      return () => {
        animation.stop();
        arrowPosition.setValue(0);
      };
    }
  }, [profile, showOptions]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Günaydın';
    if (hour >= 12 && hour < 18) return 'İyi Günler';
    return 'İyi Akşamlar';
  };

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
      console.error('Profil bilgileri alınamadı:', error);
      router.replace('/login');
    }
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
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <Image 
              source={require('../assets/images/default-user.jpg')}
              style={styles.profileImage}
            />
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{greeting},</Text>
              <Text style={styles.name}> {profile.fullName.split(' ')[0]}</Text>
            </View>
          </View>
        </View>

        {profile?.paymentPlans?.length === 0 && !showOptions && (
          <>
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Text style={styles.dollarIcon}>$</Text>
              </View>
              <Text style={styles.emptyStateText}>
                Aboneliklerinizi yönetmek için planlarınızı ekleyin.
              </Text>
            </View>
            <Animated.View
              style={[
                styles.arrow,
                {
                  transform: [
                    {
                      translateY: arrowPosition.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 20],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Feather name="arrow-down" size={32} color="#48CAE5" />
            </Animated.View>
          </>
        )}

        {showOptions && (
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => {
                setShowOptions(false);
                router.push('/staticsubs');
              }}
            >
              <Text style={styles.optionText}>Hazır aboneliklerden ekle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton}>
              <Text style={styles.optionText}>Yeni abonelik oluştur</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <TouchableOpacity style={styles.bottomBarItem}>
            <Feather name="home" size={24} color="#9799FF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowOptions(!showOptions)}
          >
            <Feather name={showOptions ? "x" : "plus"} size={32} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomBarItem}>
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
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginTop: 16,
    marginBottom: 32,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4649E5',
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#9799FF',
    fontFamily: 'Poppins-Regular',
  },
  name: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
    fontFamily: 'Poppins-Regular',
  },
  emptyState: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    transform: [{ translateY: -50 }],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  dollarIcon: {
    fontSize: 32,
    color: '#9799FF',
    fontFamily: 'Poppins-SemiBold',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    lineHeight: 24,
    opacity: 0.8,
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
  arrow: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 140 : 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(70, 73, 229, 0.1)',
    padding: 12,
    borderRadius: 24,
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