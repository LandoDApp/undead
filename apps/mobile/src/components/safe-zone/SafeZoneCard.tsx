import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CityState } from '@undead/shared';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '@/theme';

interface CityStateCardProps {
  zone: CityState;
}

export function SafeZoneCard({ zone }: CityStateCardProps) {
  const chargeColor = zone.isFallen
    ? colors.danger
    : zone.charge > 50
    ? colors.primary
    : colors.warning;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{zone.name}</Text>
        <View style={[styles.badge, { backgroundColor: chargeColor + '20' }]}>
          <Text style={[styles.badgeText, { color: chargeColor }]}>
            {zone.isFallen ? 'Gefallen' : `${zone.charge}%`}
          </Text>
        </View>
      </View>
      <View style={styles.chargeBar}>
        <View
          style={[
            styles.chargeFill,
            { width: `${zone.charge}%`, backgroundColor: chargeColor },
          ]}
        />
      </View>
      <Text style={styles.radius}>Radius: {zone.radius}m</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.parchment,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gold + '30',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },
  chargeBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  chargeFill: {
    height: '100%',
    borderRadius: 2,
  },
  radius: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
  },
});
