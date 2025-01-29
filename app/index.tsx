import { View, Text, StyleSheet, ImageBackground, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function Welcome() {
  const router = useRouter();

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
            onPress={() => router.replace('/home')}
          >
            <Text style={styles.buttonText}>Abonelik ekranımı oluştur!</Text>
            <Text style={styles.arrow}>→</Text>
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
  }
}); 
