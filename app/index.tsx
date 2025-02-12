import { View, Text, StyleSheet, ImageBackground, Image,Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Welcome() {
  const router = useRouter();

  useEffect(() => {
    checkToken();
    getExpoPushToken();
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log(notification);
    });
    return () => subscription.remove();
  }, []);

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        router.replace('/home');
      }
    } catch (error) {
      console.error('Token kontrol hatası:', error);
    }
  };

  async function getExpoPushToken() {
    let token = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Bildirim izni verilmedi!');
      return null;
    }

    if (Device.isDevice) {
      const { data } = await Notifications.getExpoPushTokenAsync();
      token = data;
    } else {
      console.log('Fiziksel bir cihazda çalıştırmalısın!');
    }

    return token;
  }

  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/images/media-group.png')} 
        style={styles.mediaGroup}
        resizeMode="contain"
      />
      <ImageBackground 
        source={require('../assets/images/welcome-bg.jpg')} 
        style={styles.backgroundImage}
      >
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>TEK PLATFORMDA,</Text>
            <Text style={styles.subtitle}>tüm aboneliklerinizi yönetin!</Text>
            
            <Text style={styles.description}>
              Abonelik yönetimi ve harcama kontrolü elinizde! Bildirimler ile ödeme hatırlatma.
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.replace('/register')}
          >
            <Text style={styles.buttonText}>Abonelik ekranımı oluştur!</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.loginLink}>
            <View style={styles.loginTextContainer}>
              <Text style={styles.loginText}>Üyeliğiniz var mı? </Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={styles.loginTextHighlight}>Giriş yapın</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050511',
  },
  mediaGroup: {
    position: 'absolute',
    width: '200%',
    height: '70%',
    top: -100,
    alignSelf: 'center',
    opacity: 0.7,
  },
  backgroundImage: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-end',
  },
  textContainer: {
    marginBottom: 40,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 24,
    marginBottom: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  description: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.8,
    lineHeight: 24,
    fontFamily: 'Poppins-Regular',
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  buttonText: {
    color: '#050511',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  arrow: {
    color: '#050511',
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Poppins-Medium',
  },
  loginLink: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loginTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    opacity: 0.8,
  },
  loginTextHighlight: {
    color: '#9799FF',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
}); 
