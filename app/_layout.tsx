import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import { useAppStore } from '../store/app';

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
      <BottomSheetModalProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="(tabs)" />
        </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
