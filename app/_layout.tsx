import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from '../src/store/app';

export default function RootLayout() {
  const loadFromStorage = useAppStore((state) => state.loadFromStorage);
  const saveToStorage = useAppStore((state) => state.saveToStorage);

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    const timer = setInterval(saveToStorage, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="tools" />
      </Stack>
    </GestureHandlerRootView>
  );
}
