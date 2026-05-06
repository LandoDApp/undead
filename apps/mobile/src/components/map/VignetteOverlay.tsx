import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function VignetteOverlay() {
  return (
    <View pointerEvents="none" style={styles.container}>
      {/* Top edge */}
      <LinearGradient
        colors={['rgba(0,0,0,0.25)', 'transparent']}
        style={styles.top}
      />
      {/* Bottom edge */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.25)']}
        style={styles.bottom}
      />
      {/* Left edge */}
      <LinearGradient
        colors={['rgba(0,0,0,0.15)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.left}
      />
      {/* Right edge */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.15)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.right}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  left: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 60,
  },
  right: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 60,
  },
});
