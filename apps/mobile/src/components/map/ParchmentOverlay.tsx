import React from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { useGameStore } from '@/stores/game';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const parchmentSource = require('@/assets/images/parchment.png');

export function ParchmentOverlay() {
  const gameMode = useGameStore((s) => s.gameMode);
  const opacity = gameMode === 'jagd' ? 0.1 : 0.14;

  return (
    <View pointerEvents="none" style={[styles.container, { opacity }]}>
      <Image
        source={parchmentSource}
        style={styles.image}
        resizeMode="repeat"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  image: {
    width: SCREEN_W,
    height: SCREEN_H,
  },
});
