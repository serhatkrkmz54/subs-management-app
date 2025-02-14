import { View, Text, StyleSheet } from 'react-native';

export default function CustomSplashScreen() {

  return (
    <View style={styles.container}>
      <Text style={styles.text}>SubsManager</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050511',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#9799FF',
    fontSize: 42,
    fontWeight: 'bold',
  },
}); 