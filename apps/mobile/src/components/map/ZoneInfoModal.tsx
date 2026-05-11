import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Image, ActivityIndicator } from 'react-native';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '@/theme';
import { useResourceStore } from '@/stores/resources';
import { useCityStateStore } from '@/stores/zone';
import { api } from '@/services/api';
import { clanEmblem } from '@/assets';
import {
  ZONE_MAX_LEVEL,
  CITY_STATE_HEAL_RELICS_PER_HP,
  CITY_STATE_UPGRADE_CRYSTAL_COSTS,
} from '@undead/shared';
import type { CityStateReputation, ClanType } from '@undead/shared';

const CLAN_NAMES: Record<string, string> = {
  glut: 'Glut',
  frost: 'Frost',
  hain: 'Hain',
};

const CLAN_COLORS: Record<string, string> = {
  glut: colors.clanGlut,
  frost: colors.clanFrost,
  hain: colors.clanHain,
};

interface ZoneInfo {
  id: string;
  name: string;
  charge: number;
  isFallen: boolean;
  radius: number;
  maxCharge?: number;
  upgradeLevel?: number;
  baseRadius?: number;
  dominantClan?: string | null;
}

interface ZoneInfoModalProps {
  zone: ZoneInfo | null;
  onClose: () => void;
}

export function ZoneInfoModal({ zone, onClose }: ZoneInfoModalProps) {
  const balance = useResourceStore((s) => s.balance);
  const fetchCityStates = useCityStateStore((s) => s.fetchCityStates);
  const [reputation, setReputation] = useState<CityStateReputation | null>(null);
  const [totalKeys, setTotalKeys] = useState<number>(0);
  const [loadingRep, setLoadingRep] = useState(false);

  // Fetch key reputation when modal opens
  useEffect(() => {
    if (!zone) {
      setReputation(null);
      return;
    }
    setLoadingRep(true);
    api.keys.get().then((res) => {
      if (res.success && res.data) {
        const match = res.data.reputation.find((r) => r.zoneId === zone.id);
        setReputation(match ?? null);
        setTotalKeys(res.data.keys);
      }
    }).finally(() => setLoadingRep(false));
  }, [zone?.id]);

  if (!zone) return null;

  const maxCharge = zone.maxCharge ?? 100;
  const upgradeLevel = zone.upgradeLevel ?? 0;
  const chargePercent = Math.round((zone.charge / maxCharge) * 100);
  const chargeColor =
    chargePercent > 60 ? colors.cityState : chargePercent > 30 ? colors.warning : colors.danger;

  const healAmount = 10;
  const relicsCost = healAmount * CITY_STATE_HEAL_RELICS_PER_HP;
  const canHeal = !zone.isFallen && zone.charge < maxCharge && balance.relics >= relicsCost;

  const canUpgrade =
    !zone.isFallen &&
    upgradeLevel < ZONE_MAX_LEVEL &&
    zone.charge >= maxCharge;
  const crystalsCost = upgradeLevel < ZONE_MAX_LEVEL ? CITY_STATE_UPGRADE_CRYSTAL_COSTS[upgradeLevel] : 0;
  const hasUpgradeCrystals = balance.crystals >= crystalsCost;

  const clanKey = zone.dominantClan as ClanType | undefined;
  const clanColor = clanKey ? CLAN_COLORS[clanKey] : null;
  const clanName = clanKey ? CLAN_NAMES[clanKey] : null;

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

          {/* Dominant Clan Badge */}
          {clanKey && clanColor && clanName && (
            <View style={[styles.clanRow, { borderColor: clanColor + '40' }]}>
              <Image source={clanEmblem[clanKey]} style={styles.clanEmblem} />
              <View>
                <Text style={[styles.clanLabel, { color: clanColor }]}>Clan {clanName}</Text>
                <Text style={styles.clanSub}>Dominanter Clan</Text>
              </View>
            </View>
          )}

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

          {/* Key Reputation Section */}
          <View style={styles.keySection}>
            <Text style={styles.keySectionTitle}>Reputation</Text>
            {loadingRep ? (
              <ActivityIndicator size="small" color={colors.gold} />
            ) : reputation ? (
              <View style={styles.keyRows}>
                <View style={styles.keyRow}>
                  <Text style={styles.keyLabel}>Besuche</Text>
                  <Text style={styles.keyValue}>{reputation.visits}</Text>
                </View>
                <View style={styles.keyRow}>
                  <Text style={styles.keyLabel}>Heilungen</Text>
                  <Text style={styles.keyValue}>{reputation.healsGiven}</Text>
                </View>
                <View style={styles.keyRow}>
                  <Text style={styles.keyLabel}>Schl{'\u00fc'}ssel/Tag</Text>
                  <Text style={[styles.keyValue, { color: colors.gold }]}>{reputation.keysPerDay}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.keyNone}>Noch keine Interaktion</Text>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, !canHeal && styles.actionButtonDisabled]}
              onPress={handleHeal}
              disabled={!canHeal}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>
                Heilen ({relicsCost} Relikte)
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
    marginBottom: spacing.md,
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
  // Clan badge
  clanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.parchmentLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  clanEmblem: {
    width: 28,
    height: 28,
  },
  clanLabel: {
    fontSize: 16,
    fontFamily: fontFamily.body,
    fontWeight: '700',
  },
  clanSub: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
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
    marginBottom: spacing.md,
  },
  // Key reputation section
  keySection: {
    backgroundColor: colors.parchmentLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gold + '30',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  keySectionTitle: {
    color: colors.gold,
    fontSize: 14,
    fontFamily: fontFamily.body,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  keyRows: {
    gap: spacing.xs,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  keyLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fontFamily.body,
  },
  keyValue: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fontFamily.body,
    fontWeight: '700',
  },
  keyNone: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fontFamily.body,
    fontStyle: 'italic',
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
