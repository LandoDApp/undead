import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocationStore } from '@/stores/location';
import { useGameStore } from '@/stores/game';
import { colors, fontSize, spacing } from '@/theme';

export function GameMap() {
  const position = useLocationStore((s) => s.position);
  const { ghouls, isInCityState, timeOfDay } = useGameStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Web Preview</Text>
      <Text style={styles.text}>
        Die echte Karte ist nur auf Android/iOS verfuegbar.
      </Text>
      <View style={styles.card}>
        <Text style={styles.label}>Zeit</Text>
        <Text style={styles.value}>{timeOfDay}</Text>
        <Text style={styles.label}>Stadtstaat</Text>
        <Text style={styles.value}>{isInCityState ? 'Ja' : 'Nein'}</Text>
        <Text style={styles.label}>Ghoule</Text>
        <Text style={styles.value}>{ghouls.length}</Text>
        <Text style={styles.label}>Position</Text>
        <Text style={styles.value}>
          {position
            ? `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`
            : 'Keine Position'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  text: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  value: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
