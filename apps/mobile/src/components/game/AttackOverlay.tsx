import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useGameStore } from '@/stores/game';
import { colors, fontSize, spacing, fontFamily } from '@/theme';
import { icons, sprites } from '@/assets';

export function AttackOverlay() {
  const { showAttackOverlay, isDown, downUntil, dismissAttackOverlay, revivePlayer, playerHits } =
    useGameStore();
  const [countdown, setCountdown] = useState(10);
  const flashOpacity = useRef(new Animated.Value(0)).current;

  // First hit: auto-dismiss after 2 seconds
  useEffect(() => {
    if (showAttackOverlay && !isDown) {
      // Flash animation
      Animated.sequence([
        Animated.timing(flashOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(flashOpacity, { toValue: 0.6, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        dismissAttackOverlay();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showAttackOverlay, isDown]);

  // Down state: countdown timer
  useEffect(() => {
    if (!isDown || !downUntil) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((downUntil - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        revivePlayer();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isDown, downUntil]);

  if (!showAttackOverlay) return null;

  // Down overlay (second hit)
  if (isDown) {
    return (
      <View style={styles.downOverlay}>
        <Image source={sprites.ghoul} style={styles.skullSprite} />
        <Text style={styles.downTitle}>Du bist gefallen!</Text>
        <Text style={styles.countdownText}>{countdown}</Text>
        <Text style={styles.downSubtitle}>Sekunden bis zur Wiederbelebung</Text>
      </View>
    );
  }

  // First hit overlay
  return (
    <TouchableOpacity
      style={styles.attackOverlay}
      activeOpacity={1}
      onPress={dismissAttackOverlay}
    >
      <Animated.View style={[styles.flashFill, { opacity: flashOpacity }]} />
      <View style={styles.attackContent}>
        <Image source={icons.sword} style={styles.attackIconImg} />
        <Text style={styles.attackTitle}>Ein Ghoul hat dich erwischt!</Text>
        <Text style={styles.attackSubtitle}>Tippe zum Fortfahren</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  attackOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  flashFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.danger,
  },
  attackContent: {
    alignItems: 'center',
  },
  attackIconImg: {
    width: 48,
    height: 48,
    marginBottom: spacing.md,
  },
  attackTitle: {
    color: colors.text,
    fontSize: 12,
    fontFamily: fontFamily.heading,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  attackSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    marginTop: spacing.sm,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  downOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  skullSprite: {
    width: 96,
    height: 144,
    marginBottom: spacing.md,
  },
  downTitle: {
    color: colors.danger,
    fontSize: 12,
    fontFamily: fontFamily.heading,
    marginBottom: spacing.lg,
  },
  countdownText: {
    color: colors.text,
    fontSize: 72,
    fontFamily: fontFamily.heading,
    lineHeight: 80,
  },
  downSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    marginTop: spacing.md,
  },
});
