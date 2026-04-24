import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { useLocationStore } from '@/stores/location';
import { useGameStore } from '@/stores/game';
import { colors } from '@/theme';

export function PlayerMarker() {
  const position = useLocationStore((s) => s.position);
  const isInSafeZone = useGameStore((s) => s.isInSafeZone);

  if (!position) return null;

  return (
    <MapLibreGL.MarkerView
      coordinate={[position.longitude, position.latitude]}
    >
      <View style={[styles.marker, isInSafeZone && styles.markerSafe]}>
        <View style={[styles.markerInner, isInSafeZone && styles.markerInnerSafe]} />
      </View>
    </MapLibreGL.MarkerView>
  );
}

const styles = StyleSheet.create({
  marker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.player + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerSafe: {
    backgroundColor: colors.safeZone + '40',
  },
  markerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.player,
  },
  markerInnerSafe: {
    backgroundColor: colors.safeZone,
  },
});
