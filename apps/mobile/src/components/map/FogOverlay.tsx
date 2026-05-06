import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet } from 'react-native';
import { useGameStore } from '@/stores/game';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const fogSource = require('@/assets/images/fog.png');

export function FogOverlay() {
  const gameMode = useGameStore((s) => s.gameMode);
  const translateX = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const isJagd = gameMode === 'jagd';
  const opacity = isJagd ? 0.18 : 0.08;
  const duration = isJagd ? 20000 : 40000;

  useEffect(() => {
    translateX.setValue(0);
    animRef.current?.stop();

    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: -SCREEN_WIDTH,
        duration,
        useNativeDriver: true,
      }),
    );
    animRef.current = anim;
    anim.start();

    return () => anim.stop();
  }, [gameMode, duration, translateX]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        { opacity, transform: [{ translateX }] },
      ]}
    >
      <Image source={fogSource} style={styles.image} resizeMode="cover" />
      <Image source={fogSource} style={styles.image} resizeMode="cover" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    flexDirection: 'row',
  },
  image: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
});
