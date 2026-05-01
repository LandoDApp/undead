import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { useLocationStore } from '@/stores/location';
import { useGameStore } from '@/stores/game';
import { useAuthStore } from '@/stores/auth';
import { playerSpriteByClan, sprites } from '@/assets';
import { colors } from '@/theme';

export function PlayerMarker() {
  const displayPosition = useLocationStore((s) => s.displayPosition);
  const position = useLocationStore((s) => s.position);
  const isInCityState = useGameStore((s) => s.isInCityState);
  const clan = useAuthStore((s) => s.clan);

  const coord = displayPosition ?? position;
  if (!coord) return null;

  const ringColor = isInCityState ? colors.cityState : colors.player;
  const playerSprite = clan ? playerSpriteByClan[clan] : sprites.playerGlut;

  return (
    <MapLibreGL.MarkerView
      coordinate={[coord.longitude, coord.latitude]}
    >
      <View style={styles.container}>
        <View style={[styles.marker, { backgroundColor: ringColor + '40' }, isInCityState && styles.markerSafe]}>
          <Image
            source={playerSprite}
            style={[styles.markerInner, isInCityState && styles.markerInnerSafe]}
            resizeMode="contain"
          />
        </View>
      </View>
    </MapLibreGL.MarkerView>
  );
}

const MARKER_SIZE = 68;

const styles = StyleSheet.create({
  container: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 999,
  },
  marker: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerSafe: {
    backgroundColor: colors.cityState + '40',
  },
  markerInner: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
  },
  markerInnerSafe: {
    opacity: 0.9,
  },
});
