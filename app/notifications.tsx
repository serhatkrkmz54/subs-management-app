import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Feather } from '@expo/vector-icons';
import { API_URL } from './_constants';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Notification {
  notificationDate: string;
  message: string;
}

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(response.data);
    } catch (error) {
      console.error('Bildirimler alınırken hata oluştu:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd MMMM yyyy HH:mm', { locale: tr });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen 
          options={{ 
            headerShown: false
          }} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4649E5" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: false
        }} 
      />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirimler</Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Geçmiş Bildirimler</Text>
          <Text style={styles.sectionSubtitle}>Tüm bildirimlerinizi burada görebilirsiniz</Text>
        </View>
        {notifications.length > 0 ? (
          notifications.map((notification, index) => (
            <View key={index} style={styles.notificationCard}>
              <View style={[
                styles.notificationIcon,
                index === 0 && styles.latestNotificationIcon
              ]}>
                <Feather name="bell" size={24} color={index === 0 ? "#FFFFFF" : "#4649E5"} />
                <View style={styles.unreadDot} />
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.message}>{notification.message}</Text>
                <View style={styles.dateContainer}>
                  <Feather name="clock" size={14} color="#71727A" />
                  <Text style={styles.date}>{formatDate(notification.notificationDate)}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Feather name="bell-off" size={48} color="#71727A" />
            <Text style={styles.emptyText}>Henüz bildiriminiz bulunmuyor.</Text>
          </View>
        )}
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
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 60,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 24,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#71727A',
    fontFamily: 'Poppins-Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(70, 73, 229, 0.2)',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(70, 73, 229, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  notificationContent: {
    flex: 1,
  },
  message: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  date: {
    color: '#71727A',
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    color: '#71727A',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
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
  latestNotificationIcon: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
}); 