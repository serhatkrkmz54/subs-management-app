import { View, Text, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';

SplashScreen.preventAutoHideAsync();

export default function CustomSplashScreen() {
  const onLayoutRootView = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
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