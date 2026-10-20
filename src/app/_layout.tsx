import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { AstraProvider } from '@/lib/store';
import { useTheme } from '@/hooks/use-theme';

function Raiz() {
  const t = useTheme();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: t.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <AstraProvider>
      <Raiz />
    </AstraProvider>
  );
}
