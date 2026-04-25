import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Undead',
  slug: 'undead',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',

  splash: {
    backgroundColor: '#1a1a2e',
  },

  android: {
    package: 'app.undead.game',
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION'
    ],
  },

  plugins: [
    'expo-router',
    'expo-location',
    'expo-sensors',
    'expo-notifications',
    'expo-secure-store',
    ['./plugins/withKotlinVersion', '1.9.25'],
  ],

  scheme: 'undead',

  extra: {
    apiUrl: 'http://192.168.178.45:3000',
    mapTilerKey: 'tUNZqC9llORsnq4AEmu5',
    eas: {
      projectId: 'b9001eb8-405e-44a7-a0c2-2bc339fece57',
    },
  },

  // 🔥 WICHTIG: verhindert MapLibre + Bridgeless Probleme
  newArchEnabled: false,
});