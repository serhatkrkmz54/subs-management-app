import { TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function BackButton() {
  const router = useRouter();

  return (
    <TouchableOpacity 
      style={styles.button}
      onPress={() => router.replace('/')}
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
    marginBottom: 16,
  },
}); 