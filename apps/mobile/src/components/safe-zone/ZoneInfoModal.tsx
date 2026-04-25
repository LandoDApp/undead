import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '@/theme';
import { usePointsStore } from '@/stores/points';
import { useZoneStore } from '@/stores/zone';
import { api } from '@/services/api';
import {
  ZONE_MAX_LEVEL,
  ZONE_UPGRADE_COSTS,
  ZONE_HEAL_POINTS_PER_HP,
} from '@undead/shared';

interface ZoneInfo {
  id: string;
  name: string;
  charge: number;
  isFallen: boolean;
  radius: number;
  maxCharge?: number;
  upgradeLevel?: number;
  baseRadius?: number;
}

interface ZoneInfoModalProps {
  zone: ZoneInfo | null;
  onClose: () => void;
}

export function ZoneInfoModal({ zone, onClose }: ZoneInfoModalProps) {
  const pointsBalance = usePointsStore((s) => s.balance.totalPoints);
  const fetchBalance = usePointsStore((s) => s.fetchBalance);
  const fetchZones = useZoneStore((s) => s.fetchZones);

  if (!zone) return null;

  const maxCharge = zone.maxCharge ?? 100;
  const upgradeLevel = zone.upgradeLevel ?? 0;
  const chargePercent = Math.round((zone.charge / maxCharge) * 100);
  const chargeColor =
    chargePercent > 60 ? colors.safeZone : chargePercent > 30 ? colors.warning : colors.danger;

  const healAmount = 10;
  const healCost = healAmount * ZONE_HEAL_POINTS_PER_HP;
  const canHeal = !zone.isFallen && zone.charge < maxCharge && pointsBalance >= healCost;

  const canUpgrade =
    !zone.isFallen &&
    upgradeLevel < ZONE_MAX_LEVEL &&
    zone.charge >= maxCharge;
  const upgradeCost = upgradeLevel < ZONE_MAX_LEVEL ? ZONE_UPGRADE_COSTS[upgradeLevel] : 0;
  const hasUpgradePoints = pointsBalance >= upgradeCost;

  const handleHeal = async () => {
    const res = await api.zones.heal(zone.id, healAmount);
    if (res.success && res.data) {
      usePointsStore.getState().setBalance({
        ...usePointsStore.getState().balance,
        totalPoints: res.data.newBalance,
      });
      fetchZones();
    }
  };

  const handleUpgrade = async () => {
    const res = await api.zones.upgrade(zone.id);
    if (res.success && res.data) {
      usePointsStore.getState().setBalance({
        ...usePointsStore.getState().balance,
        totalPoints: res.data.newBalance,
      });
      fetchZones();
    }
  };

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
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Lvl {upgradeLevel}/{ZONE_MAX_LEVEL}</Text>
            </View>
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
          <Text style={[styles.chargeValue, { color: chargeColor }]}>
            {zone.charge}/{maxCharge} ({chargePercent}%)
          </Text>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, !canHeal && styles.actionButtonDisabled]}
              onPress={handleHeal}
              disabled={!canHeal}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>
                Heilen ({healCost} P)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.upgradeButton,
                (!canUpgrade || !hasUpgradePoints) && styles.actionButtonDisabled,
              ]}
              onPress={handleUpgrade}
              disabled={!canUpgrade || !hasUpgradePoints}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>
                {upgradeLevel >= ZONE_MAX_LEVEL
                  ? 'Max Level'
                  : zone.charge < maxCharge
                  ? 'Voll laden!'
                  : `Upgraden (${upgradeCost} P)`}
              </Text>
            </TouchableOpacity>
          </View>

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
  levelBadge: {
    backgroundColor: colors.warning + '22',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  levelText: {
    color: colors.warning,
    fontSize: fontSize.xs,
    fontWeight: '600',
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
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.safeZone,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  upgradeButton: {
    backgroundColor: colors.warning,
  },
  actionButtonDisabled: {
    opacity: 0.4,
  },
  actionButtonText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
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
