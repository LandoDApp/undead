import React from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { useGameStore } from '@/stores/game';
import { Image, StyleSheet, View } from 'react-native';
import { sprites } from '@/assets';

const MARKER_SIZE = 56;

export function GhoulMarkers() {
  const ghouls = useGameStore((s) => s.ghouls);

  if (ghouls.length === 0) return null;

  return (
    <>
      {ghouls.map((g) => (
        <MapLibreGL.MarkerView
          key={g.id}
          coordinate={[g.position.longitude, g.position.latitude]}
        >
          <View style={[styles.container, g.frozen && styles.frozen]}>
            <Image source={sprites.ghoul} style={styles.icon} resizeMode="contain" />
          </View>
        </MapLibreGL.MarkerView>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74, 22, 17, 0.22)',
    borderRadius: MARKER_SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(135, 45, 34, 0.45)',
  },
  icon: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
  },
  frozen: {
    opacity: 0.65,
  },
});
