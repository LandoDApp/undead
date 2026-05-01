import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '@/theme';
import { useBastionStore } from '@/stores/bastion';
import { useResourceStore } from '@/stores/resources';
import { BastionInterior } from './BastionInterior';
import {
  BASTION_MAX_HP,
  BASTION_UPGRADE_CRYSTAL_COSTS,
  BASTION_HEAL_HERB_COST,
} from '@undead/shared';
import type { Bastion } from '@undead/shared';

interface BastionPanelProps {
  bastion: Bastion | null;
  isOwn: boolean;
  onClose: () => void;
}

const LEVEL_NAMES = ['Holzh\u00fctte', 'Holzfestung', 'Steinfestung'] as const;

export function BastionPanel({ bastion, isOwn, onClose }: BastionPanelProps) {
  const balance = useResourceStore((s) => s.balance);
  const [tab, setTab] = useState<'exterior' | 'interior'>('exterior');

  if (!bastion) return null;

  const hpPercent = Math.round((bastion.hp / bastion.maxHp) * 100);
  const hpColor = hpPercent > 60 ? colors.cityState : hpPercent > 30 ? colors.warning : colors.danger;

  // Heal: heal 10 HP at a time
  const healAmount = Math.min(10, bastion.maxHp - bastion.hp);
  const healHerbsCost = healAmount * BASTION_HEAL_HERB_COST;
  const canHeal = isOwn && healAmount > 0 && balance.herbs >= healHerbsCost;

  // Upgrade
  const canUpgradeLevel = bastion.level < 2;
  const upgradeCrystalsCost = canUpgradeLevel ? BASTION_UPGRADE_CRYSTAL_COSTS[bastion.level + 1] : 0;
  const hasUpgradeCrystals = balance.crystals >= upgradeCrystalsCost;
  const canUpgrade = isOwn && canUpgradeLevel && hasUpgradeCrystals;

  // Reinforce (for friends' bastions)
  const canReinforce = !isOwn && bastion.hp < bastion.maxHp;

  const handleHeal = async () => {
    await useBastionStore.getState().healBastion(healAmount);
  };

  const handleUpgrade = async () => {
    await useBastionStore.getState().upgradeBastion();
  };

  const handleReinforce = async () => {
    await useBastionStore.getState().reinforceBastion(bastion.id);
  };

  return (
    <Modal transparent animationType="slide" visible={!!bastion} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <Text style={styles.name}>{bastion.name}</Text>

          {/* Tab toggle (only for own bastion) */}
          {isOwn && (
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabButton, tab === 'exterior' && styles.tabActive]}
                onPress={() => setTab('exterior')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, tab === 'exterior' && styles.tabTextActive]}>
                  Au{'\u00df'}en
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, tab === 'interior' && styles.tabActive]}
                onPress={() => setTab('interior')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, tab === 'interior' && styles.tabTextActive]}>
                  Innen
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Interior tab */}
          {tab === 'interior' && isOwn ? (
            <View style={styles.interiorContainer}>
              <BastionInterior />
            </View>
          ) : (
            <>
              <View style={styles.statusRow}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>{LEVEL_NAMES[bastion.level]}</Text>
                </View>
                {isOwn && (
                  <View style={[styles.levelBadge, { backgroundColor: colors.primary + '22' }]}>
                    <Text style={[styles.levelText, { color: colors.primary }]}>Eigene</Text>
                  </View>
                )}
              </View>

              <Text style={styles.hpLabel}>Stabilit{'\u00e4'}t</Text>
              <View style={styles.hpBarBg}>
                <View
                  style={[styles.hpBarFill, { width: `${hpPercent}%`, backgroundColor: hpColor }]}
                />
              </View>
              <Text style={[styles.hpValue, { color: hpColor }]}>
                {bastion.hp}/{bastion.maxHp} ({hpPercent}%)
              </Text>

              {/* Action buttons */}
              <View style={styles.actionRow}>
                {isOwn && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, !canHeal && styles.actionButtonDisabled]}
                      onPress={handleHeal}
                      disabled={!canHeal}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.actionButtonText}>
                        Heilen ({healHerbsCost} Kr{'\u00e4'}uter)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.upgradeButton,
                        !canUpgrade && styles.actionButtonDisabled,
                      ]}
                      onPress={handleUpgrade}
                      disabled={!canUpgrade}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.actionButtonText}>
                        {!canUpgradeLevel
                          ? 'Max Level'
                          : `Upgraden (${upgradeCrystalsCost} Kristalle)`}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {!isOwn && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.reinforceButton, !canReinforce && styles.actionButtonDisabled]}
                    onPress={handleReinforce}
                    disabled={!canReinforce}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionButtonText}>
                      Verst{'\u00e4'}rken (+10 HP)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

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
  levelBadge: {
    backgroundColor: colors.gold + '22',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  levelText: {
    color: colors.gold,
    fontSize: 14,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },
  hpLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fontFamily.body,
    marginBottom: spacing.xs,
  },
  hpBarBg: {
    height: 12,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  hpBarFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  hpValue: {
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
  reinforceButton: {
    backgroundColor: colors.player,
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
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.parchmentLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold + '20',
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.text,
  },
  interiorContainer: {
    maxHeight: 400,
  },
});
