import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

interface ZoneInfo {
  id: string;
  name: string;
  charge: number;
  isFallen: boolean;
  radius: number;
}

interface ZoneInfoModalProps {
  zone: ZoneInfo | null;
  onClose: () => void;
}

export function ZoneInfoModal({ zone, onClose }: ZoneInfoModalProps) {
  if (!zone) return null;

  const chargePercent = Math.round(zone.charge);
  const chargeColor =
    chargePercent > 60 ? colors.safeZone : chargePercent > 30 ? colors.warning : colors.danger;

  return (
    <Modal transparent animationType="slide" visible={!!zone} onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />

          <Text style={styles.name}>{zone.name}</Text>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: zone.isFallen ? colors.danger + '22' : colors.safeZone + '22' },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: zone.isFallen ? colors.danger : colors.safeZone },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: zone.isFallen ? colors.danger : colors.safeZone },
                ]}
              >
                {zone.isFallen ? 'Gefallen' : 'Aktiv'}
              </Text>
            </View>
            <Text style={styles.radiusText}>{zone.radius}m Radius</Text>
          </View>

          <Text style={styles.chargeLabel}>Ladung</Text>
          <View style={styles.chargeBarBg}>
            <View
              style={[
                styles.chargeBarFill,
                { width: `${chargePercent}%`, backgroundColor: chargeColor },
              ]}
            />
          </View>
          <Text style={[styles.chargeValue, { color: chargeColor }]}>{chargePercent}%</Text>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Schließen</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  radiusText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  chargeLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  chargeBarBg: {
    height: 12,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  chargeBarFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  chargeValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  closeButton: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
