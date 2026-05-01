import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '@/theme';
import { useResourceStore } from '@/stores/resources';
import { useCityStateStore } from '@/stores/zone';
import { api } from '@/services/api';
import {
  ZONE_MAX_LEVEL,
  CITY_STATE_HEAL_HERBS_PER_HP,
  CITY_STATE_UPGRADE_CRYSTAL_COSTS,
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
  const balance = useResourceStore((s) => s.balance);
  const fetchCityStates = useCityStateStore((s) => s.fetchCityStates);

  if (!zone) return null;

  const maxCharge = zone.maxCharge ?? 100;
  const upgradeLevel = zone.upgradeLevel ?? 0;
  const chargePercent = Math.round((zone.charge / maxCharge) * 100);
  const chargeColor =
    chargePercent > 60 ? colors.cityState : chargePercent > 30 ? colors.warning : colors.danger;

  const healAmount = 10;
  const herbsCost = healAmount * CITY_STATE_HEAL_HERBS_PER_HP;
  const canHeal = !zone.isFallen && zone.charge < maxCharge && balance.herbs >= herbsCost;

  const canUpgrade =
    !zone.isFallen &&
    upgradeLevel < ZONE_MAX_LEVEL &&
    zone.charge >= maxCharge;
  const crystalsCost = upgradeLevel < ZONE_MAX_LEVEL ? CITY_STATE_UPGRADE_CRYSTAL_COSTS[upgradeLevel] : 0;
  const hasUpgradeCrystals = balance.crystals >= crystalsCost;

  const handleHeal = async () => {
    const res = await api.cityStates.heal(zone.id, healAmount);
    if (res.success && res.data) {
      useResourceStore.getState().setBalance(res.data.newBalance);
      fetchCityStates();
    }
  };

  const handleUpgrade = async () => {
    const res = await api.cityStates.upgrade(zone.id);
    if (res.success && res.data) {
      useResourceStore.getState().setBalance(res.data.newBalance);
      fetchCityStates();
    }
  };

  return (
    <Modal transparent animationType="slide" visible={!!zone} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <Text style={styles.name}>{zone.name}</Text>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: zone.isFallen ? colors.danger + '22' : colors.cityState + '22' },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: zone.isFallen ? colors.danger : colors.cityState },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: zone.isFallen ? colors.danger : colors.cityState },
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
                Heilen ({herbsCost} Kr{'\u00e4'}uter)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.upgradeButton,
                (!canUpgrade || !hasUpgradeCrystals) && styles.actionButtonDisabled,
              ]}
              onPress={handleUpgrade}
              disabled={!canUpgrade || !hasUpgradeCrystals}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>
                {upgradeLevel >= ZONE_MAX_LEVEL
                  ? 'Max Level'
                  : zone.charge < maxCharge
                  ? 'Voll laden!'
                  : `Upgraden (${crystalsCost} Kristalle)`}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Schlie{'\u00df'}en</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
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
    backgroundColor: colors.parchment,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.gold + '50',
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gold + '40',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  name: {
    color: colors.gold,
    fontSize: 10,
    fontFamily: fontFamily.heading,
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
    fontSize: 14,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },
  radiusText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fontFamily.body,
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
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },
  chargeLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fontFamily.body,
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
    fontFamily: fontFamily.body,
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
    backgroundColor: colors.cityState,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold + '30',
  },
  upgradeButton: {
    backgroundColor: colors.warning,
  },
  actionButtonDisabled: {
    opacity: 0.4,
  },
  actionButtonText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: colors.parchmentLight,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold + '30',
  },
  closeButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },
});
