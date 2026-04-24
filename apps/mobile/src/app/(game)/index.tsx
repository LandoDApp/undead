import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { GameMap } from '@/components/map/GameMap';
import type { GameMapHandle } from '@/components/map/GameMap';
import { GameHUD } from '@/components/game/GameHUD';
import { AttackOverlay } from '@/components/game/AttackOverlay';
import { useLocation } from '@/hooks/useLocation';
import { useZombies } from '@/hooks/useZombies';
import { useDayNight } from '@/hooks/useDayNight';
import { useSafeZone } from '@/hooks/useSafeZone';
import { useSession } from '@/hooks/useSession';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { colors } from '@/theme';

export default function MapScreen() {
  const mapRef = useRef<GameMapHandle>(null);

  useLocation();
  useZombies();
  useDayNight();
  useSafeZone();
  useSession();
  usePushNotifications();

  return (
    <View style={styles.container}>
      <GameMap ref={mapRef} />
      <GameHUD mapRef={mapRef} />
      <AttackOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
