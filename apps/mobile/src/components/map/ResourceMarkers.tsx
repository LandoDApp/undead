import React from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { useResourceStore } from '@/stores/resources';
import { Image, StyleSheet, View } from 'react-native';
import { sprites } from '@/assets';

const MARKER_SIZE = 44;

export function ResourceMarkers() {
  const resources = useResourceStore((s) => s.resources);

  return (
    <>
      {resources.map((r) => {
        const source =
          r.type === 'herb'
            ? sprites.resHerb
            : r.type === 'crystal'
              ? sprites.resCrystal
              : sprites.resRelic;
        return (
          <MapLibreGL.MarkerView key={r.id} coordinate={[r.longitude, r.latitude]}>
            <View style={styles.container}>
              <Image source={source} style={styles.icon} resizeMode="contain" />
            </View>
          </MapLibreGL.MarkerView>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(230, 211, 173, 0.24)',
    borderRadius: MARKER_SIZE / 2,
  },
  icon: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    opacity: 0.96,
  },
});
