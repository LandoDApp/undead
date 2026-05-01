import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/services/api';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const checkSession = useAuthStore((s) => s.checkSession);
  const setToken = useAuthStore((s) => s.setToken);

  const [fontsLoaded] = useFonts({
    'PressStart2P': require('../../assets/fonts/PressStart2P-Regular.ttf'),
    'm6x11': require('../../assets/fonts/m6x11.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const handleDeepLink = async (url: string) => {
      const parsed = Linking.parse(url);
      if (parsed.path !== 'auth/callback') return;

      const email = typeof parsed.queryParams?.email === 'string' ? parsed.queryParams.email : '';
      const token = typeof parsed.queryParams?.token === 'string' ? parsed.queryParams.token : '';

      if (!email || !token) return;

      try {
        const res = await api.auth.verifyMagicLink(email, token);
        const sessionToken = res.data?.token;
        if (!cancelled && res.success && sessionToken) {
          await setToken(sessionToken);
        }
      } catch {
        // Ignore invalid links; user can request a new one from login screen
      }
    };

    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) handleDeepLink(initialUrl);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
          headerShown: false,
        }}
      />
    </>
  );
}
