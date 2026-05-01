import React, { useMemo, useCallback } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useBastionStore } from '@/stores/bastion';
import { bastionSpriteByLevel } from '@/assets';

interface BastionMarkersProps {
  onBastionPress?: (bastion: { id: string; name: string; level: number; hp: number; maxHp: number; userId: string }) => void;
}

export function BastionMarkers({ onBastionPress }: BastionMarkersProps) {
  const nearbyBastions = useBastionStore((s) => s.nearbyBastions);
  const ownBastion = useBastionStore((s) => s.bastion);

  // Combine own bastion + nearby (deduped)
  const allBastions = useMemo(() => {
    const map = new Map<string, typeof nearbyBastions[0]>();
    if (ownBastion) map.set(ownBastion.id, ownBastion);
    for (const b of nearbyBastions) map.set(b.id, b);
    return [...map.values()];
  }, [nearbyBastions, ownBastion]);

  const handlePress = useCallback(
    (b: { id: string; name: string; level: number; hp: number; maxHp: number; userId: string }) => {
      if (!onBastionPress) return;
      onBastionPress(b);
    },
    [onBastionPress]
  );

  if (allBastions.length === 0) return null;

  return (
    <>
      {allBastions.map((b) => {
        const sprite = bastionSpriteByLevel[Math.max(0, Math.min(2, b.level))];
        return (
          <MapLibreGL.MarkerView key={b.id} coordinate={[b.longitude, b.latitude]}>
            <Pressable onPress={() => handlePress(b)} style={styles.container}>
              <View style={styles.glow} />
              <Image source={sprite} style={styles.icon} resizeMode="contain" />
            </Pressable>
          </MapLibreGL.MarkerView>
        );
      })}
    </>
  );
}

const MARKER_SIZE = 64;

const styles = StyleSheet.create({
  container: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  glow: {
    position: 'absolute',
    width: MARKER_SIZE + 8,
    height: MARKER_SIZE + 8,
    borderRadius: (MARKER_SIZE + 8) / 2,
    backgroundColor: 'rgba(121, 85, 52, 0.28)',
  },
  icon: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
  },
});
