import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';


export default function RootLayout() {

  useEffect(() => {
    const prepare = async () => {
      try {
        await Font.loadAsync({
          'Poppins-Regular': require('../assets/fonts/Poppins/Poppins-Regular.ttf'),
          'Poppins-Medium': require('../assets/fonts/Poppins/Poppins-Medium.ttf'),
          'Poppins-SemiBold': require('../assets/fonts/Poppins/Poppins-SemiBold.ttf'),
          'Poppins-Bold': require('../assets/fonts/Poppins/Poppins-Bold.ttf'),
        });
      } catch (e) {
        console.warn(e);
      }
    };
    prepare();
  }, []);


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: '#050511' }}>
        <StatusBar style="light" translucent backgroundColor="transparent" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#050511' },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="verify" />
          <Stack.Screen name="home" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="staticsubs" />
          <Stack.Screen name="subscriptioncreate" />
          <Stack.Screen name="editsubscription" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </View>
    </GestureHandlerRootView>
  );
} 