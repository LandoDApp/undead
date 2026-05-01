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
    'expo-font',
    ['./plugins/withKotlinVersion', '1.9.25'],
  ],

  scheme: 'undead',

  extra: {
    apiUrl: 'https://undead-server.loca.lt',
    mapTilerKey: 'tUNZqC9llORsnq4AEmu5',
    eas: {
      projectId: 'b706dc2b-25ad-4809-9dfb-d4fcd6cf1935',
    },
  },

  // 🔥 WICHTIG: verhindert MapLibre + Bridgeless Probleme
  newArchEnabled: false,
});