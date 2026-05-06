import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily } from '@/theme';

function BackButton() {
  return (
    <Pressable style={styles.backButton} onPress={() => router.back()}>
      <Ionicons name="arrow-back" size={20} color={colors.gold} />
    </Pressable>
  );
}

export default function GameLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { display: 'none', height: 0 },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.gold,
        headerTitleStyle: {
          fontFamily: fontFamily.heading,
          fontSize: 10,
          color: colors.gold,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Karte',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="bastion"
        options={{
          title: 'Bastion',
          headerShown: true,
          headerLeft: () => <BackButton />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          headerShown: true,
          headerLeft: () => <BackButton />,
        }}
      />
      {/* Hidden from tab bar but still routable */}
      <Tabs.Screen
        name="zones"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  backButton: {
    marginLeft: 12,
    padding: 6,
  },
});
