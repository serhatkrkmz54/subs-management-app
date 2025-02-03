import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image, Animated, Easing, ScrollView, Modal, LayoutRectangle, ImageBackground, RefreshControl, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Feather } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

interface UserProfile {
  userId: number;
  fullName: string;
  paymentPlans: any[];
  email: string;
  phoneNumber: string;
}

interface PaymentPlan {
  id: number;
  abonelikAdi: string;
  odemeMiktari: number;
  odemeBirimi: string;
  baslangicTarihi: string;
  bitisTarihi: string | null;
  frequency: string;
  last4Digits: string | null;
  cardName: string | null;
  userId: number;
}

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [greeting, setGreeting] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    fetchProfileAndPlans();
    setGreeting(getGreeting());
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Günaydın';
    if (hour >= 12 && hour < 18) return 'İyi Günler';
    return 'İyi Akşamlar';
  };

  const fetchProfileAndPlans = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const profileResponse = await axios.get('http://10.0.2.2:8080/auth/profil', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setProfile(profileResponse.data);

      if (profileResponse.data?.userId) {
        const plansResponse = await axios.get(`http://10.0.2.2:8080/payment-plan/all-plan/${profileResponse.data.userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setPaymentPlans(plansResponse.data || []);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      if (axios.isAxiosError(error)) {
        console.log('Hata detayı:', error.response?.data);
      }
      router.replace('/login');
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

  const isNearExpiry = (endDate: string | null): boolean => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 5 && diffDays > 0;
  };

  const getRemainingDays = (endDate: string | null): number => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getCurrencySymbol = (currency: string): string => {
    switch (currency) {
      case 'TRY':
        return '₺';
      case 'USD':
        return '$';
      default:
        return currency;
    }
  };

  const calculateTotalPayment = (plans: PaymentPlan[]): { TRY: number; USD: number } => {
    return plans.reduce((acc, plan) => {
      if (plan.odemeBirimi === 'TRY') {
        acc.TRY += plan.odemeMiktari;
      } else if (plan.odemeBirimi === 'USD') {
        acc.USD += plan.odemeMiktari;
      }
      return acc;
    }, { TRY: 0, USD: 0 });
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchProfileAndPlans();
    } catch (error) {
      console.error('Yenileme hatası:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const filteredPaymentPlans = paymentPlans.filter(plan => 
    plan.abonelikAdi.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.frequency.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (planId: number) => {
    Alert.alert(
      "Abonelik Silme",
      "Bu aboneliği silmek istediğinize emin misiniz?",
      [
        {
          text: "İptal",
          style: "cancel"
        },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              if (!token) {
                router.replace('/login');
                return;
              }

              const response = await axios.delete(`http://10.0.2.2:8080/payment-plan/delete/${planId}`, {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              });

              if (response.status === 200) {
                Toast.show({
                  type: 'success',
                  text1: 'Başarılı',
                  text2: 'Abonelik başarıyla silindi',
                  visibilityTime: 2000,
                });
                fetchProfileAndPlans();
              }
            } catch (error) {
              console.error('Abonelik silme hatası:', error);
              Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Abonelik silinirken bir hata oluştu',
                visibilityTime: 2000,
              });
            }
          }
        }
      ]
    );
  };

  const renderRightActions = (planId: number) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDelete(planId)}
      >
        <Feather name="trash-2" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    );
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
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Feather name="search" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {showSearch && (
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Abonelik ara..."
                  placeholderTextColor="#71727A"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus={true}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setSearchQuery('')}
                  >
                    <Feather name="x" size={20} color="#71727A" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        {paymentPlans.length === 0 ? (
          <>
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Text style={styles.dollarIcon}>$</Text>
              </View>
              <Text style={styles.emptyStateText}>
                Aboneliklerinizi yönetmek için planlarınızı ekleyin.
              </Text>
            </View>
          </>
        ) : (
          <ScrollView 
            style={styles.plansList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#4649E5"
                colors={['#4649E5']}
                progressBackgroundColor="#1A1A2E"
              />
            }
          >
            <View style={styles.cardContainer}>
              <ImageBackground
                source={require('../assets/images/card.png')}
                style={styles.cardBackground}
                imageStyle={styles.cardImage}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={styles.totalAmountContainer}>
                      <Text style={styles.totalLabel}>Toplam Ödeme</Text>
                      {calculateTotalPayment(paymentPlans).TRY > 0 && (
                        <Text style={styles.totalAmount}>
                          {calculateTotalPayment(paymentPlans).TRY.toFixed(2)} ₺
                        </Text>
                      )}
                      {calculateTotalPayment(paymentPlans).USD > 0 && (
                        <Text style={styles.totalAmount}>
                          {calculateTotalPayment(paymentPlans).USD.toFixed(2)} $
                        </Text>
                      )}
                    </View>
                    <Image 
                      source={require('../assets/images/mastercardlogo.png')}
                      style={styles.cardLogo}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.cardName}>{profile.fullName}</Text>
                </View>
              </ImageBackground>
            </View>

            {paymentPlans.some(plan => isNearExpiry(plan.bitisTarihi)) && (
              <View style={styles.expiringSection}>
                <Text style={styles.sectionTitle}>Yaklaşan Ödemeler</Text>
                {filteredPaymentPlans
                  .filter(plan => isNearExpiry(plan.bitisTarihi))
                  .sort((a, b) => {
                    const daysA = getRemainingDays(a.bitisTarihi);
                    const daysB = getRemainingDays(b.bitisTarihi);
                    return daysA - daysB;
                  })
                  .map((plan, index) => (
                    <Swipeable
                      key={plan.id}
                      renderRightActions={() => renderRightActions(plan.id)}
                      overshootRight={false}
                    >
                      <View style={[styles.planItem, styles.expiringPlanItem]}>
                        <View style={styles.planHeader}>
                          <Image 
                            source={getLogoPath(plan.abonelikAdi)} 
                            style={styles.planLogo}
                          />
                          <View style={styles.planInfo}>
                            <Text style={styles.platformName}>{plan.abonelikAdi}</Text>
                            <Text style={styles.packageName}>{plan.frequency.toLowerCase()} ödeme</Text>
                          </View>
                          <View style={styles.priceContainer}>
                            <Text style={styles.amount}>
                              {plan.odemeMiktari} {getCurrencySymbol(plan.odemeBirimi)}
                            </Text>
                          </View>
                        </View>
                        {(plan.cardName || plan.last4Digits || plan.bitisTarihi || plan.baslangicTarihi) && (
                          <View style={styles.planDetails}>
                          
                            {plan.cardName && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Kart İsmi:</Text>
                                <Text style={styles.detailValue}>{plan.cardName}</Text>
                              </View>
                            )}
                            {plan.last4Digits && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Son 4 Hane:</Text>
                                <Text style={styles.detailValue}>{plan.last4Digits}</Text>
                              </View>
                            )}
                            {plan.baslangicTarihi && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Başlangıç Tarihi:</Text>
                                <Text style={styles.detailValue}>{plan.baslangicTarihi}</Text>
                              </View>
                            )}
                            {plan.bitisTarihi && (
                              <>
                                <View style={styles.detailRow}>
                                  <Text style={styles.detailLabel}>Bitiş Tarihi:</Text>
                                  <View style={styles.expiryContainer}>
                                    <Text style={[
                                      styles.detailValue,
                                      isNearExpiry(plan.bitisTarihi) && styles.expiryWarning
                                    ]}>
                                      {plan.bitisTarihi}
                                    </Text>
                                    {isNearExpiry(plan.bitisTarihi) && (
                                      <Feather name="alert-circle" size={16} color="#FF4444" style={styles.warningIcon} />
                                    )}
                                  </View>
                                </View>
                                <View style={[
                                  styles.remainingDaysContainer,
                                  isNearExpiry(plan.bitisTarihi) && styles.remainingDaysContainerHighlight
                                ]}>
                                  <Text style={[
                                    styles.remainingDaysText,
                                    isNearExpiry(plan.bitisTarihi) && styles.remainingDaysTextHighlight
                                  ]}>
                                    {getRemainingDays(plan.bitisTarihi)} gün kaldı
                                  </Text>
                                </View>
                              </>
                            )}
                          </View>
                        )}
                      </View>
                    </Swipeable>
                  ))}
              </View>
            )}
            
            <View style={styles.regularSection}>
              <Text style={styles.sectionTitle}>Tüm Abonelikler</Text>
              {filteredPaymentPlans
                .filter(plan => !isNearExpiry(plan.bitisTarihi))
                .sort((a, b) => {
                  if (!a.bitisTarihi) return 1;
                  if (!b.bitisTarihi) return -1;
                  return new Date(a.bitisTarihi).getTime() - new Date(b.bitisTarihi).getTime();
                })
                .map((plan, index) => (
                  <Swipeable
                    key={plan.id}
                    renderRightActions={() => renderRightActions(plan.id)}
                    overshootRight={false}
                  >
                    <View style={styles.planItem}>
                      <View style={styles.planHeader}>
                        <Image 
                          source={getLogoPath(plan.abonelikAdi)} 
                          style={styles.planLogo}
                        />
                        <View style={styles.planInfo}>
                          <Text style={styles.platformName}>{plan.abonelikAdi}</Text>
                          <Text style={styles.packageName}>{plan.frequency.toLowerCase()} ödeme</Text>
                        </View>
                        <View style={styles.priceContainer}>
                          <Text style={styles.amount}>
                            {plan.odemeMiktari} {getCurrencySymbol(plan.odemeBirimi)}
                          </Text>
                        </View>
                      </View>
                      {(plan.cardName || plan.last4Digits || plan.bitisTarihi || plan.baslangicTarihi) && (
                        <View style={styles.planDetails}>
                          
                          {plan.cardName && (
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Kart İsmi:</Text>
                              <Text style={styles.detailValue}>{plan.cardName}</Text>
                            </View>
                          )}
                          {plan.last4Digits && (
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Son 4 Hane:</Text>
                              <Text style={styles.detailValue}>{plan.last4Digits}</Text>
                            </View>
                          )}
                          {plan.baslangicTarihi && (
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Başlangıç Tarihi:</Text>
                              <Text style={styles.detailValue}>{plan.baslangicTarihi}</Text>
                            </View>
                          )}
                          {plan.bitisTarihi && (
                            <>
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Bitiş Tarihi:</Text>
                                <View style={styles.expiryContainer}>
                                  <Text style={[
                                    styles.detailValue,
                                    isNearExpiry(plan.bitisTarihi) && styles.expiryWarning
                                  ]}>
                                    {plan.bitisTarihi}
                                  </Text>
                                  {isNearExpiry(plan.bitisTarihi) && (
                                    <Feather name="alert-circle" size={16} color="#FF4444" style={styles.warningIcon} />
                                  )}
                                </View>
                              </View>
                              <View style={[
                                styles.remainingDaysContainer,
                                isNearExpiry(plan.bitisTarihi) && styles.remainingDaysContainerHighlight
                              ]}>
                                <Text style={[
                                  styles.remainingDaysText,
                                  isNearExpiry(plan.bitisTarihi) && styles.remainingDaysTextHighlight
                                ]}>
                                  {getRemainingDays(plan.bitisTarihi)} gün kaldı
                                </Text>
                              </View>
                            </>
                          )}
                        </View>
                      )}
                    </View>
                  </Swipeable>
                ))}
            </View>
          </ScrollView>
        )}

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
    paddingTop: 24,
  },
  header: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
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
  plansList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  planItem: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  planInfo: {
    flex: 1,
    marginLeft: 12,
  },
  platformName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 4,
  },
  packageName: {
    fontSize: 14,
    color: '#71727A',
    fontFamily: 'Poppins-Regular',
  },
  priceContainer: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0, 179, 126, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
  amount: {
    fontSize: 16,
    color: '#00B37E',
    fontFamily: 'Poppins-SemiBold',
  },
  frequency: {
    fontSize: 12,
    color: '#71727A',
    fontFamily: 'Poppins-Regular',
  },
  planDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(70, 73, 229, 0.2)',
    paddingTop: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#71727A',
    fontFamily: 'Poppins-Regular',
  },
  detailValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Poppins-Medium',
  },
  expiryWarning: {
    color: '#FF4444',
    fontFamily: 'Poppins-SemiBold',
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  warningIcon: {
    marginLeft: 4,
  },
  remainingDaysContainer: {
    backgroundColor: 'rgba(70, 73, 229, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  remainingDaysText: {
    color: '#4649E5',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  remainingDaysContainerHighlight: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  remainingDaysTextHighlight: {
    color: '#FF4444',
  },
  expiringSection: {
    marginBottom: 24,
    width: '100%',
  },
  regularSection: {
    flex: 1,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 16,
  },
  expiringPlanItem: {
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  cardContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    width: '100%',
  },
  cardBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  cardImage: {
    borderRadius: 16,
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  cardLogo: {
    width: 86,
    height: 64,
  },
  totalAmountContainer: {
    alignItems: 'flex-start',
  },
  totalAmount: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Poppins-SemiBold',
  },
  totalLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    opacity: 0.8,
    marginTop: 4,
  },
  cardName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  searchButton: {
    marginLeft: 'auto',
    padding: 8,
  },
  searchContainer: {
    marginTop: 25,
    marginBottom: 5,
    width: '100%',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(70, 73, 229, 0.2)',
  },
  searchInput: {
    flex: 1,
    padding: 12,
    color: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  clearButton: {
    padding: 8,
    marginRight: 4,
  },
  deleteAction: {
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 16,
    marginBottom: 16,
  },
}); 