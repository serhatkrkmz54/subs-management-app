import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image, Animated, Easing, ScrollView, Modal, LayoutRectangle, ImageBackground, RefreshControl, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Feather } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_URL } from './_constants';


interface UserProfile {
  userId: number;
  fullName: string;
  paymentPlans: PaymentPlan[];
  email: string;
  phoneNumber: string;
  settings: number;
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

interface EditedPlan {
  id: number;
  abonelikAdi: string;
  odemeMiktari: number;
  odemeBirimi: string;
  baslangicTarihi: string;
  bitisTarihi: string | null;
  frequency: string;
  last4Digits: string | null;
  cardName: string | null;
}

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [greeting, setGreeting] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [showTabOptions, setShowTabOptions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<EditedPlan | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [showEmptyStateOptions, setShowEmptyStateOptions] = useState(false);

  useEffect(() => {
    fetchProfileAndPlans();
    setGreeting(getGreeting());
    checkExpiredSubscriptions();
    const interval = setInterval(checkExpiredSubscriptions, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
  const handleLogout = async () => {
    Alert.alert(
      "Çıkış Yap",
      "Çıkış yapmak istediğinize emin misiniz?",
      [
        {
          text: "İptal",
          style: "cancel"
        },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem('userToken');
            router.replace('/login');
          }
        }
      ]
    );
  };
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

      const profileResponse = await axios.get(`${API_URL}/auth/profil`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // console.log('Profil yanıtı:', profileResponse.data);
      // console.log('Ödeme planları:', profileResponse.data.paymentPlans);
      
      setProfile(profileResponse.data);
      setPaymentPlans(profileResponse.data.paymentPlans || []);
    } catch (error) {
      Toast.show({
                  type: 'error',
                  text1: 'Oturum Hatası',
                  text2: 'Tekrar oturum açınız!',
                  visibilityTime: 2000,
                });
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
    return logoMap[platformName] || require('../assets/images/default-platform.png');
  };

  const isNearExpiry = (endDate: string | null): boolean => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const now = new Date();
    
    const endUTC = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    const nowUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = endUTC - nowUTC;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 && diffDays <= (profile?.settings || 5);
  };

  const getRemainingDays = (endDate: string | null): number => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    
    const endUTC = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    const nowUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = endUTC - nowUTC;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
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
    if (!plans || plans.length === 0) {
      return { TRY: 0, USD: 0 };
    }

    return plans.reduce((acc, plan) => {
      if (plan.odemeBirimi === 'TRY' || plan.odemeBirimi === 'TL') {
        acc.TRY += plan.odemeMiktari;
      } else if (plan.odemeBirimi === 'USD') {
        acc.USD += plan.odemeMiktari;
      }
      return acc;
    }, { TRY: 0, USD: 0 });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchProfileAndPlans();
    } catch (error) {
      console.error('Yenileme hatası:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const filteredPaymentPlans:any = profile?.paymentPlans.filter((plan: PaymentPlan) => 
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

              const response = await axios.delete(`${API_URL}/payment-plan/delete/${planId}`, {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              });

              if (response.status === 200) {
                setPaymentPlans(prevPlans => prevPlans.filter(plan => plan.id !== planId));
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

  const renderRightActions = (plan: PaymentPlan) => {
    return (
      <TouchableOpacity 
        style={styles.editAction}
        onPress={() => router.push({
          pathname: '/editsubscription',
          params: {
            id: plan.id,
            abonelikAdi: plan.abonelikAdi,
            odemeMiktari: plan.odemeMiktari,
            odemeBirimi: plan.odemeBirimi,
            baslangicTarihi: plan.baslangicTarihi,
            bitisTarihi: plan.bitisTarihi,
            frequency: plan.frequency,
            last4Digits: plan.last4Digits || '',
            cardName: plan.cardName || ''
          }
        })}
      >
        <Feather name="edit-2" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    );
  };

  const renderLeftActions = (plan: PaymentPlan) => {
    return (
      <TouchableOpacity 
        style={styles.deleteAction}
        onPress={() => handleDelete(plan.id)}
      >
        <Feather name="trash-2" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    );
  };

  const isExpired = (endDate: string | null): boolean => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const now = new Date();
    
    const endUTC = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    const nowUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = nowUTC - endUTC;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) > 0;
  };

  const checkExpiredSubscriptions = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const expiredPlans = profile?.paymentPlans.filter(plan => {
        if (!plan.bitisTarihi) return false;
        const endDate = new Date(plan.bitisTarihi);
        const now = new Date();
        const diffTime = now.getTime() - endDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 3;
      }) ?? [];

      if (expiredPlans.length > 0) {
        for (const plan of expiredPlans) {
          await axios.delete(`${API_URL}/payment-plan/delete/${plan.id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
        }

        fetchProfileAndPlans();

        Toast.show({
          type: 'info',
          text1: 'Bilgi',
          text2: `${expiredPlans.length} adet süresi dolan abonelik silindi`,
          position: 'top',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Süresi dolan abonelikler silinirken bir hata oluştu',
        position: 'top',
      });
    }
  };

  const handleEdit = (plan: PaymentPlan) => {
    console.log('Düzenleme başlatılıyor:', { plan });
    const editedPlan: EditedPlan = {
      id: plan.id,
      abonelikAdi: plan.abonelikAdi,
      odemeMiktari: plan.odemeMiktari,
      odemeBirimi: plan.odemeBirimi,
      baslangicTarihi: plan.baslangicTarihi,
      bitisTarihi: plan.bitisTarihi,
      frequency: plan.frequency,
      last4Digits: plan.last4Digits || '',
      cardName: plan.cardName || ''
    };
    setSelectedPlan(editedPlan);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedPlan) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await axios.put(
        `${API_URL}/payment-plan/duzenle/${selectedPlan.id}`,
        {
          abonelikAdi: selectedPlan.abonelikAdi,
          odemeMiktari: selectedPlan.odemeMiktari,
          odemeBirimi: selectedPlan.odemeBirimi,
          baslangicTarihi: selectedPlan.baslangicTarihi,
          bitisTarihi: selectedPlan.bitisTarihi,
          frequency: selectedPlan.frequency,
          last4Digits: selectedPlan.last4Digits,
          cardName: selectedPlan.cardName
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

        setShowEditModal(false);
        setSelectedPlan(null);
        fetchProfileAndPlans();
      }
    } catch (error) {
      console.error('Düzenleme hatası:', error);
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Abonelik güncellenirken bir hata oluştu',
        visibilityTime: 2000,
      });
    }
  };

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
    if (selectedDate && selectedPlan) {
      setSelectedPlan({
        ...selectedPlan,
        baslangicTarihi: formatDateForBackend(selectedDate)
      });
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate && selectedPlan) {
      setSelectedPlan({
        ...selectedPlan,
        bitisTarihi: formatDateForBackend(selectedDate)
      });
    }
  };

  const renderEditButton = (plan: PaymentPlan) => (
    <TouchableOpacity
      style={styles.editButton}
      onPress={() => router.push({
        pathname: '/editsubscription',
        params: {
          id: plan.id,
          abonelikAdi: plan.abonelikAdi,
          odemeMiktari: plan.odemeMiktari,
          odemeBirimi: plan.odemeBirimi,
          baslangicTarihi: plan.baslangicTarihi,
          bitisTarihi: plan.bitisTarihi,
          frequency: plan.frequency,
          last4Digits: plan.last4Digits || '',
          cardName: plan.cardName || ''
        }
      })}
    >
      <Feather name="edit-2" size={20} color="#4649E5" />
    </TouchableOpacity>
  );


  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.profileContainer}>
            <Image 
              source={require('../assets/images/default-user.jpg')}
              style={styles.profileImage}
            />
            <View style={styles.greetingContainer}>
              <View style={styles.greetingRow}>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.name}>{profile?.fullName}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Feather name="search" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={() => router.push('/notifications')}
            >
              <Feather name="bell" size={24} color="#FFFFFF" />
              <View style={styles.unreadDot} />
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
                    <Feather name="x" size={24} color="#71727A" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        {profile?.paymentPlans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyContent}>
              <TouchableOpacity 
                style={styles.emptyStateAddButton}
                onPress={() => setShowEmptyStateOptions(true)}
              >
                <Feather name="plus" size={32} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.emptyTitle}>Henüz bir aboneliğiniz yok</Text>
              <Text style={styles.emptyText}>
                Aboneliklerinizi ekleyerek takip etmeye başlayın
              </Text>
            </View>

            {showEmptyStateOptions && (
              <TouchableOpacity 
                style={styles.tabModalOverlay} 
                activeOpacity={1}
                onPress={() => setShowEmptyStateOptions(false)}
              >
                <View style={styles.tabOptionsContainer}>
                  <TouchableOpacity 
                    style={styles.tabOptionButton}
                    onPress={() => {
                      router.push('/staticsubs');
                      setShowEmptyStateOptions(false);
                    }}
                  >
                    <Text style={styles.tabOptionText}>Hazır aboneliklerden ekle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.tabOptionButton}
                    onPress={() => {
                      router.push('/subscriptioncreate');
                      setShowEmptyStateOptions(false);
                    }}
                  >
                    <Text style={styles.tabOptionText}>Yeni Abonelik Oluştur</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          </View>
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
                      {profile?.paymentPlans && profile.paymentPlans.length > 0 && (
                        <>
                          {calculateTotalPayment(profile.paymentPlans).TRY > 0 && (
                            <Text style={styles.totalAmount}>
                              {calculateTotalPayment(profile.paymentPlans).TRY.toFixed(2)} ₺
                            </Text>
                          )}
                          {calculateTotalPayment(profile.paymentPlans).USD > 0 && (
                            <Text style={styles.totalAmount}>
                              {calculateTotalPayment(profile.paymentPlans).USD.toFixed(2)} $
                            </Text>
                          )}
                        </>
                      )}
                      {(!profile?.paymentPlans || profile.paymentPlans.length === 0) && (
                        <Text style={styles.totalAmount}>0.00 ₺</Text>
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

            {/* Yaklaşan Ödemeler - En Üstte */}
            {filteredPaymentPlans.some(plan => isNearExpiry(plan.bitisTarihi)) && (
              <View style={styles.expiringSection}>
                <Text style={styles.sectionTitle}>Yaklaşan Ödemeler</Text>
                {filteredPaymentPlans
                  .filter((plan:any) => isNearExpiry(plan.bitisTarihi))
                  .sort((a:any, b:any) => {
                    const daysA = getRemainingDays(a.bitisTarihi);
                    const daysB = getRemainingDays(b.bitisTarihi);
                    return daysA - daysB;
                  })
                  .map((plan:any) => (
                    <Swipeable
                      key={plan.id}
                      renderRightActions={() => renderRightActions(plan)}
                      renderLeftActions={() => renderLeftActions(plan)}
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
                          <View style={styles.headerButtons}>
                            {renderEditButton(plan)}
                            <View style={styles.priceContainer}>
                              <Text style={styles.amount}>
                                {plan.odemeMiktari} {getCurrencySymbol(plan.odemeBirimi)}
                              </Text>
                            </View>
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
                                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={[
                                      styles.remainingDaysText, 
                                      isNearExpiry(plan.bitisTarihi) && styles.remainingDaysTextHighlight,
                                      getRemainingDays(plan.bitisTarihi) === 0 && { color: '#FF4444' }
                                    ]}>
                                      {getRemainingDays(plan.bitisTarihi) === 0 ? "Abonelik kısa süre içinde sonlanacak" : `${getRemainingDays(plan.bitisTarihi)} gün kaldı`}
                                    </Text>
                                    {getRemainingDays(plan.bitisTarihi) === 0 && (
                                      <Feather name="alert-circle" size={16} color="#FF4444" style={{ marginLeft: 8 }} />
                                    )}
                                  </View>
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
            
            {/* Aktif Abonelikler - Ortada */}
            <View style={styles.regularSection}>
              <Text style={styles.sectionTitle}>Aktif Abonelikler</Text>
              {filteredPaymentPlans
                .filter((plan:any) => !isExpired(plan.bitisTarihi) && !isNearExpiry(plan.bitisTarihi))
                .sort((a:any, b:any) => {
                  if (!a.bitisTarihi) return 1;
                  if (!b.bitisTarihi) return -1;
                  return new Date(a.bitisTarihi).getTime() - new Date(b.bitisTarihi).getTime();
                })
                .map((plan:any) => (
                  <Swipeable
                    key={plan.id}
                    renderRightActions={() => renderRightActions(plan)}
                    renderLeftActions={() => renderLeftActions(plan)}
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
                        <View style={styles.headerButtons}>
                          {renderEditButton(plan)}
                          <View style={styles.priceContainer}>
                            <Text style={styles.amount}>
                              {plan.odemeMiktari} {getCurrencySymbol(plan.odemeBirimi)}
                            </Text>
                          </View>
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
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                  <Text style={[
                                    styles.remainingDaysText, 
                                    isNearExpiry(plan.bitisTarihi) && styles.remainingDaysTextHighlight,
                                    getRemainingDays(plan.bitisTarihi) === 0 && { color: '#FF4444' }
                                  ]}>
                                    {getRemainingDays(plan.bitisTarihi) === 0 ? "Abonelik kısa süre içinde sonlanacak" : `${getRemainingDays(plan.bitisTarihi)} gün kaldı`}
                                  </Text>
                                  {getRemainingDays(plan.bitisTarihi) === 0 && (
                                    <Feather name="alert-circle" size={16} color="#FF4444" style={{ marginLeft: 8 }} />
                                  )}
                                </View>
                              </View>
                            </>
                          )}
                        </View>
                      )}
                    </View>
                  </Swipeable>
                ))}
            </View>

            {/* Süresi Dolan Abonelikler - En Altta */}
            {filteredPaymentPlans?.some(plan => isExpired(plan.bitisTarihi)) && (
              <View style={styles.expiredSection}>
                <Text style={styles.sectionTitle}>Süresi Dolan Abonelikler</Text>
                <Text style={styles.expiredWarning}>
                  Not: Süresi dolan abonelikler 3 gün sonra otomatik olarak silinecektir.
                </Text>
                {filteredPaymentPlans
                  .filter(plan => isExpired(plan.bitisTarihi))
                  .map((plan) => (
                    <View key={plan.id} style={[styles.planItem, styles.expiredPlanItem]}>
                      <View style={styles.planHeader}>
                        <Image 
                          source={getLogoPath(plan.abonelikAdi)} 
                          style={styles.planLogo}
                        />
                        <View style={styles.planInfo}>
                          <Text style={styles.platformName}>{plan.abonelikAdi}</Text>
                          <Text style={styles.packageName}>{plan.frequency.toLowerCase()} ödeme</Text>
                        </View>
                        <View style={[styles.priceContainer, styles.expiredPriceContainer]}>
                          <Text style={[styles.amount, styles.expiredAmount]}>
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
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Bitiş Tarihi:</Text>
                              <Text style={[styles.detailValue, styles.expiredDate]}>
                                {plan.bitisTarihi}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>

      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <TouchableOpacity style={styles.bottomBarItem}>
            <Feather name="home" size={24} color="#9799FF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.bottomBarItem}
            onPress={() => router.push('/statistics')}
          >
            <Feather name="bar-chart-2" size={24} color="#71727A" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowTabOptions(true)}
          >
            <Feather name="plus" size={32} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.bottomBarItem}
            onPress={() => router.push('/settings')}
          >
            <Feather name="settings" size={24} color="#71727A" />
          </TouchableOpacity>
                   <TouchableOpacity 
            style={styles.bottomBarItem}
            onPress={handleLogout}
          >
            <Feather name="log-out" size={24} color="#FF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowEditModal(false);
          setSelectedPlan(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Abonelik Düzenle</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowEditModal(false);
                  setSelectedPlan(null);
                }}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              {selectedPlan && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Abonelik Adı</Text>
                    <TextInput
                      style={styles.input}
                      value={selectedPlan.abonelikAdi}
                      onChangeText={(text) => setSelectedPlan({...selectedPlan, abonelikAdi: text})}
                      placeholder="Abonelik adını girin"
                      placeholderTextColor="#71727A"
                    />
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Ödeme Miktarı</Text>
                      <TextInput
                        style={styles.input}
                        value={selectedPlan.odemeMiktari.toString()}
                        onChangeText={(text) => setSelectedPlan({...selectedPlan, odemeMiktari: Number(text) || 0})}
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
                            selectedPlan.odemeBirimi === 'TRY' && styles.radioButtonSelected
                          ]}
                          onPress={() => setSelectedPlan({...selectedPlan, odemeBirimi: 'TRY'})}
                        >
                          <Text style={[
                            styles.radioText,
                            selectedPlan.odemeBirimi === 'TRY' && styles.radioTextSelected
                          ]}>TRY</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[
                            styles.radioButton,
                            selectedPlan.odemeBirimi === 'USD' && styles.radioButtonSelected
                          ]}
                          onPress={() => setSelectedPlan({...selectedPlan, odemeBirimi: 'USD'})}
                        >
                          <Text style={[
                            styles.radioText,
                            selectedPlan.odemeBirimi === 'USD' && styles.radioTextSelected
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
                          selectedPlan.frequency === 'AYLIK' && styles.radioButtonSelected
                        ]}
                        onPress={() => setSelectedPlan({...selectedPlan, frequency: 'AYLIK'})}
                      >
                        <Text style={[
                          styles.radioText,
                          selectedPlan.frequency === 'AYLIK' && styles.radioTextSelected
                        ]}>Aylık</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[
                          styles.radioButton,
                          selectedPlan.frequency === 'YILLIK' && styles.radioButtonSelected
                        ]}
                        onPress={() => setSelectedPlan({...selectedPlan, frequency: 'YILLIK'})}
                      >
                        <Text style={[
                          styles.radioText,
                          selectedPlan.frequency === 'YILLIK' && styles.radioTextSelected
                        ]}>Yıllık</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Kart İsmi</Text>
                    <TextInput
                      style={styles.input}
                      value={selectedPlan.cardName || ''}
                      onChangeText={(text) => setSelectedPlan({...selectedPlan, cardName: text})}
                      placeholder="Kart ismini girin"
                      placeholderTextColor="#71727A"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Son 4 Hane</Text>
                    <TextInput
                      style={styles.input}
                      value={selectedPlan.last4Digits || ''}
                      onChangeText={(text) => setSelectedPlan({...selectedPlan, last4Digits: text})}
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
                          {selectedPlan.baslangicTarihi ? formatDateForDisplay(selectedPlan.baslangicTarihi) : 'Seçin'}
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
                          {selectedPlan.bitisTarihi ? formatDateForDisplay(selectedPlan.bitisTarihi) : 'Seçin'}
                        </Text>
                        <Feather name="calendar" size={20} color="#71727A" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={handleSaveEdit}
                  >
                    <Text style={styles.saveButtonText}>Kaydet</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {showStartDatePicker && (
        <DateTimePicker
          value={selectedPlan?.baslangicTarihi ? new Date(selectedPlan.baslangicTarihi) : new Date()}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={selectedPlan?.bitisTarihi ? new Date(selectedPlan.bitisTarihi) : new Date()}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
          minimumDate={selectedPlan?.baslangicTarihi ? new Date(selectedPlan.baslangicTarihi) : new Date()}
        />
      )}

      {/* Orta + butonu için modal */}
      {showOptions && (
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={0.5}
          onPress={() => setShowOptions(false)}
        >
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
        </TouchableOpacity>
      )}

      {/* Alt tab + butonu için modal */}
      {showTabOptions && (
        <TouchableOpacity
          style={styles.tabModalOverlay}
          activeOpacity={0.5}
          onPress={() => setShowTabOptions(false)}
        >
          <View style={styles.tabOptionsContainer}>
            <TouchableOpacity 
              style={styles.tabOptionButton}
              onPress={() => {
                router.push('/staticsubs');
                setShowTabOptions(false);
              }}
            >
              <Text style={styles.tabOptionText}>Hazır aboneliklerden ekle</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.tabOptionButton}
              onPress={() => {
                router.push('/subscriptioncreate');
                setShowTabOptions(false);
              }}
            >
              <Text style={styles.tabOptionText}>Yeni Abonelik Oluştur</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  content: {
    flex: 1,
    paddingTop: 24,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    backgroundColor: '#050511',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  greetingContainer: {
    flex: 1,
    marginLeft: 16,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  greeting: {
    fontSize: 14,
    color: '#9799FF',
    fontFamily: 'Poppins-Regular',
  },
  name: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 24,
    marginTop: 15
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  emptyContainer: {
    flex: 1,
    position: 'relative',
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateAddButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4649E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#4649E5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#71727A',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  optionsContainer: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    width: '90%',
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
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
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
  },
  remainingDaysContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
    marginBottom: 8,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(70, 73, 229, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(70, 73, 229, 0.2)',
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
    height: '94%',
    borderRadius: 16,
    marginBottom: 16,
  },
  editAction: {
    backgroundColor: '#4649E5',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '94%',
    borderRadius: 16,
    marginBottom: 16,
  },
  expiredSection: {
    marginTop: 24,
    marginBottom: 24,
    width: '100%',
  },
  expiredPlanItem: {
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
  },
  expiredPriceContainer: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  expiredAmount: {
    color: '#FF4444',
  },
  expiredDate: {
    color: '#FF4444',
    fontFamily: 'Poppins-SemiBold',
  },
  expiredWarning: {
    color: '#FF4444',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginBottom: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#1A1A2E',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxHeight: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(70, 73, 229, 0.2)',
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
  },
  closeButton: {
    padding: 8,
  },
  modalForm: {
    flex: 1,
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
    backgroundColor: '#050511',
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
    backgroundColor: '#050511',
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
    backgroundColor: '#050511',
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
    marginBottom: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    padding: 8,
    backgroundColor: 'rgba(70, 73, 229, 0.1)',
    borderRadius: 8,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 24,
  },
  deleteButton: {
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 84 : 84,
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
    paddingHorizontal: 20,
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
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    borderWidth: 1,
    borderColor: '#050511',
  },
  tabModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 1000,
  },
  tabOptionsContainer: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    gap: 12,
    marginBottom: Platform.OS === 'ios' ? 120 : 100,
    borderWidth: 1,
    borderColor: 'rgba(70, 73, 229, 0.2)',
  },
  tabOptionButton: {
    backgroundColor: '#4649E5',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  tabOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
}); 