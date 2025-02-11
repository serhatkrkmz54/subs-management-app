import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  const handleBack = () => {
    switch (pathname) {
      case '/login':
      case '/register':
      case '/verify':
        router.replace('/');
        break;
      case '/home':
        router.replace('/login');
        break;
      default:
        router.back();
    }
  };

  return (
    <TouchableOpacity 
      style={styles.button}
      onPress={handleBack}
    >
      <Feather name="arrow-left" size={24} color="#E4E4ED" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: 16,
  },
}); 