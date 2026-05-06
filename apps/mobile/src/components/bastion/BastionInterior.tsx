import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ImageSourcePropType, Alert } from 'react-native';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '@/theme';
import { icons, workerSprite, workerIcon } from '@/assets';
import { useBastionStore } from '@/stores/bastion';
import { useResourceStore } from '@/stores/resources';
import {
  BASTION_WORKER_SLOTS,
  BASTION_MAX_HP,
  BASTION_UPGRADE_CRYSTAL_COSTS,
  BASTION_HEAL_HERB_COST,
  WORKER_HERB_RATE,
  WORKER_CRYSTAL_RATE,
  WORKER_SCOUT_RATE,
  WORKER_LEVEL_MULTIPLIER,
  WORKER_UPGRADE_CRYSTAL_COSTS,
} from '@undead/shared';
import type { WorkerType, BastionWorker } from '@undead/shared';

const WORKER_INFO: Record<WorkerType, { label: string; rateLabel: string; baseRate: number }> = {
  herbalist: { label: 'Kr\u00e4uterkundler', rateLabel: 'Kr\u00e4uter/h', baseRate: WORKER_HERB_RATE },
  miner: { label: 'Sch\u00fcrfer', rateLabel: 'Kristalle/h', baseRate: WORKER_CRYSTAL_RATE },
  scholar: { label: 'Gelehrter', rateLabel: 'XP/h', baseRate: 5 },
  scout: { label: 'Sp\u00e4her', rateLabel: 'Berichte/h', baseRate: WORKER_SCOUT_RATE },
};

const STORAGE_ITEMS: { key: 'herbs' | 'crystals' | 'relics' | 'scoutReports'; maxKey: string; label: string; icon: ImageSourcePropType; color: string; workerType: WorkerType | null }[] = [
  { key: 'herbs', maxKey: 'maxHerbs', label: 'Kr\u00e4uter', icon: icons.herb, color: colors.cityState, workerType: 'herbalist' },
  { key: 'crystals', maxKey: 'maxCrystals', label: 'Kristalle', icon: icons.crystal, color: '#8e44ad', workerType: 'miner' },
  { key: 'relics', maxKey: 'maxRelics', label: 'Reliquien', icon: icons.relic, color: colors.gold, workerType: null },
  { key: 'scoutReports', maxKey: 'maxScoutReports', label: 'Berichte', icon: icons.vision, color: colors.player, workerType: 'scout' },
];

const WORKER_TYPES: WorkerType[] = ['herbalist', 'miner', 'scholar', 'scout'];

const WORKER_RATE_MAP: Record<string, number> = {
  herbalist: WORKER_HERB_RATE,
  miner: WORKER_CRYSTAL_RATE,
  scout: WORKER_SCOUT_RATE,
};

function getWorkerRate(type: WorkerType, level: number): number {
  return WORKER_INFO[type].baseRate * Math.pow(WORKER_LEVEL_MULTIPLIER, level);
}

function getTotalRateForType(workers: BastionWorker[], workerType: WorkerType | null): number {
  if (!workerType) return 0;
  const baseRate = WORKER_RATE_MAP[workerType];
  if (!baseRate) return 0;
  return workers
    .filter((w) => w.type === workerType)
    .reduce((sum, w) => sum + baseRate * Math.pow(WORKER_LEVEL_MULTIPLIER, w.level), 0);
}

function formatDuration(hours: number): string {
  if (hours <= 0) return 'Voll';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `~${m}m`;
  if (m === 0) return `~${h}h`;
  return `~${h}h ${m}m`;
}

function formatTimeSince(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 60_000) return 'Gerade eben';
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `vor ${remainingMinutes}m`;
  if (remainingMinutes === 0) return `vor ${hours}h`;
  return `vor ${hours}h ${remainingMinutes}m`;
}

export function BastionInterior() {
  const bastion = useBastionStore((s) => s.bastion);
  const workers = useBastionStore((s) => s.workers);
  const storage = useBastionStore((s) => s.storage);
  const balance = useResourceStore((s) => s.balance);
  const [showWorkerPicker, setShowWorkerPicker] = useState(false);

  useEffect(() => {
    useBastionStore.getState().fetchIdleState();
  }, []);

  if (!bastion) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Du hast noch keine Bastion.</Text>
      </View>
    );
  }

  const maxSlots = BASTION_WORKER_SLOTS[Math.min(bastion.level, 2)];
  const freeSlots = maxSlots - workers.length;
  const [collecting, setCollecting] = useState(false);
  const hasStorage = storage && (storage.herbs > 0 || storage.crystals > 0 || storage.relics > 0 || storage.scoutReports > 0);

  const handleCollect = async () => {
    setCollecting(true);
    const ok = await useBastionStore.getState().collectStorage();
    setCollecting(false);
    if (!ok) {
      Alert.alert('Fehler', 'Einsammeln fehlgeschlagen. Pr\u00fcfe deine Verbindung.');
    }
  };

  const LEVEL_NAMES = ['Holzh\u00fctte', 'Holzfestung', 'Steinfestung'] as const;
  const canUpgradeLevel = bastion.level < 2;
  const upgradeCrystalsCost = canUpgradeLevel ? BASTION_UPGRADE_CRYSTAL_COSTS[bastion.level + 1] : 0;
  const canUpgrade = canUpgradeLevel && balance.crystals >= upgradeCrystalsCost;

  const healAmount = Math.min(10, bastion.maxHp - bastion.hp);
  const healHerbsCost = healAmount * BASTION_HEAL_HERB_COST;
  const canHeal = healAmount > 0 && balance.herbs >= healHerbsCost;

  const hpPercent = Math.round((bastion.hp / bastion.maxHp) * 100);
  const hpColor = hpPercent > 60 ? colors.cityState : hpPercent > 30 ? '#e67e22' : colors.danger;

  const handleHeal = async () => {
    await useBastionStore.getState().healBastion(healAmount);
  };

  const handleUpgrade = async () => {
    await useBastionStore.getState().upgradeBastion();
  };

  const handleAssignWorker = async (type: WorkerType) => {
    await useBastionStore.getState().assignWorker(type);
    setShowWorkerPicker(false);
  };

  const handleRemoveWorker = async (workerId: string) => {
    await useBastionStore.getState().removeWorker(workerId);
  };

  const handleUpgradeWorker = async (workerId: string) => {
    await useBastionStore.getState().upgradeWorker(workerId);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Bastion status + upgrade/heal */}
      <Text style={styles.sectionTitle}>{LEVEL_NAMES[bastion.level]}</Text>
      <View style={styles.storageCard}>
        <Text style={styles.hpLabel}>Stabilit{'\u00e4'}t</Text>
        <View style={styles.hpBarBg}>
          <View style={[styles.hpBarFill, { width: `${hpPercent}%`, backgroundColor: hpColor }]} />
        </View>
        <Text style={[styles.hpValue, { color: hpColor }]}>
          {bastion.hp}/{bastion.maxHp}
        </Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, !canHeal && styles.buttonDisabled]}
            onPress={handleHeal}
            disabled={!canHeal}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>
              Heilen ({healHerbsCost} Kr{'\u00e4'}uter)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.upgradeActionBtn, !canUpgrade && styles.buttonDisabled]}
            onPress={handleUpgrade}
            disabled={!canUpgrade}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>
              {!canUpgradeLevel ? 'Max Level' : `Upgrade (${upgradeCrystalsCost} Kristalle)`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Storage section */}
      <Text style={styles.sectionTitle}>Lager</Text>
      {storage && (
        <View style={styles.storageCard}>
          {STORAGE_ITEMS.map((item) => {
            const current = (storage as any)[item.key] as number;
            const max = (storage as any)[item.maxKey] as number;
            const rate = getTotalRateForType(workers, item.workerType);
            let timeLabel: string;
            if (current >= max) {
              timeLabel = 'Voll';
            } else if (rate <= 0) {
              timeLabel = 'Kein Arbeiter';
            } else {
              const hoursToFull = (max - current) / rate;
              timeLabel = `Voll in ${formatDuration(hoursToFull)}`;
            }
            return (
              <View key={item.key}>
                <StorageBar
                  label={item.label}
                  icon={item.icon}
                  current={current}
                  max={max}
                  color={item.color}
                />
                <Text style={styles.storageTimeLabel}>{timeLabel}</Text>
              </View>
            );
          })}

          <TouchableOpacity
            style={[styles.collectButton, (!hasStorage || collecting) && styles.buttonDisabled]}
            onPress={handleCollect}
            disabled={!hasStorage || collecting}
            activeOpacity={0.7}
          >
            <Text style={styles.collectButtonText}>
              {collecting ? 'Wird eingesammelt...' : hasStorage ? 'Einsammeln' : 'Lager leer'}
            </Text>
          </TouchableOpacity>

          {storage.lastCollectedAt > 0 && (
            <Text style={styles.lastCollectedText}>
              Zuletzt gesammelt {formatTimeSince(storage.lastCollectedAt)}
            </Text>
          )}
        </View>
      )}

      {/* Workers section */}
      <Text style={styles.sectionTitle}>
        Arbeiter ({workers.length}/{maxSlots})
      </Text>

      {workers.map((worker) => (
        <WorkerCard
          key={worker.id}
          worker={worker}
          crystals={balance.crystals}
          onRemove={() => handleRemoveWorker(worker.id)}
          onUpgrade={() => handleUpgradeWorker(worker.id)}
        />
      ))}

      {freeSlots > 0 && !showWorkerPicker && (
        <TouchableOpacity
          style={styles.addWorkerButton}
          onPress={() => setShowWorkerPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.addWorkerText}>+ Arbeiter zuweisen</Text>
        </TouchableOpacity>
      )}

      {showWorkerPicker && (
        <View style={styles.pickerCard}>
          <Text style={styles.pickerTitle}>Arbeiter w{'\u00e4'}hlen</Text>
          {WORKER_TYPES.map((type) => {
            const info = WORKER_INFO[type];
            return (
              <TouchableOpacity
                key={type}
                style={styles.pickerOption}
                onPress={() => handleAssignWorker(type)}
                activeOpacity={0.7}
              >
                <Image source={workerSprite[type]} style={styles.pickerSprite} />
                <View style={styles.pickerInfo}>
                  <Text style={styles.pickerLabel}>{info.label}</Text>
                  <Text style={styles.pickerRate}>{info.baseRate} {info.rateLabel}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowWorkerPicker(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>Abbrechen</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function StorageBar({ label, icon, current, max, color }: {
  label: string; icon: ImageSourcePropType; current: number; max: number; color: string;
}) {
  const percent = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  return (
    <View style={styles.storageRow}>
      <Image source={icon} style={styles.storageIconImg} />
      <View style={styles.storageBarContainer}>
        <View style={styles.storageBarBg}>
          <View style={[styles.storageBarFill, { width: `${percent}%`, backgroundColor: color }]} />
        </View>
        <Text style={styles.storageValue}>{current}/{max}</Text>
      </View>
    </View>
  );
}

function WorkerCard({ worker, crystals, onRemove, onUpgrade }: {
  worker: BastionWorker; crystals: number; onRemove: () => void; onUpgrade: () => void;
}) {
  const info = WORKER_INFO[worker.type];
  const rate = getWorkerRate(worker.type, worker.level);
  const canUpgrade = worker.level < 2;
  const upgradeCost = canUpgrade ? WORKER_UPGRADE_CRYSTAL_COSTS[worker.level + 1] : 0;
  const hasUpgradeCrystals = crystals >= upgradeCost;

  return (
    <View style={styles.workerCard}>
      <Image source={workerSprite[worker.type]} style={styles.workerSpriteImg} />
      <View style={styles.workerInfo}>
        <Text style={styles.workerName}>{info.label} Lv.{worker.level}</Text>
        <Text style={styles.workerRate}>{rate.toFixed(1)} {info.rateLabel}</Text>
      </View>
      <View style={styles.workerActions}>
        {canUpgrade && (
          <TouchableOpacity
            style={[styles.smallButton, styles.upgradeBtn, !hasUpgradeCrystals && styles.buttonDisabled]}
            onPress={onUpgrade}
            disabled={!hasUpgradeCrystals}
            activeOpacity={0.7}
          >
            <View style={styles.upgradeBtnRow}>
              <Text style={styles.smallButtonText}>{upgradeCost}</Text>
              <Image source={icons.crystal} style={styles.iconTiny} />
            </View>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.smallButton, styles.removeBtn]}
          onPress={onRemove}
          activeOpacity={0.7}
        >
          <Text style={styles.smallButtonText}>X</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  sectionTitle: {
    color: colors.gold,
    fontSize: 8,
    fontFamily: fontFamily.heading,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  // Storage
  storageCard: {
    backgroundColor: colors.parchment,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.gold + '30',
  },
  storageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  storageIconImg: {
    width: 20,
    height: 20,
  },
  storageBarContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  storageBarBg: {
    height: 10,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  storageValue: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontFamily: fontFamily.body,
  },
  storageTimeLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontFamily: fontFamily.body,
    marginLeft: 28,
    marginTop: 2,
  },
  lastCollectedText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontFamily: fontFamily.body,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  hpLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontFamily: fontFamily.body,
  },
  hpBarBg: {
    height: 10,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  hpBarFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  hpValue: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.cityState,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  upgradeActionBtn: {
    backgroundColor: '#e67e22',
  },
  actionButtonText: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },
  collectButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gold + '30',
  },
  collectButtonText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontFamily: fontFamily.body,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  // Workers
  workerCard: {
    backgroundColor: colors.parchment,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gold + '20',
  },
  workerSpriteImg: {
    width: 32,
    height: 48,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },
  workerRate: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fontFamily.body,
  },
  workerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  smallButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  upgradeBtn: {
    backgroundColor: colors.warning,
  },
  upgradeBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconTiny: {
    width: 12,
    height: 12,
  },
  removeBtn: {
    backgroundColor: colors.danger + '60',
  },
  smallButtonText: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },
  addWorkerButton: {
    backgroundColor: colors.parchmentLight,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold + '30',
    borderStyle: 'dashed',
  },
  addWorkerText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },
  // Picker
  pickerCard: {
    backgroundColor: colors.parchment,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gold + '30',
  },
  pickerTitle: {
    color: colors.gold,
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.parchmentLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gold + '20',
  },
  pickerSprite: {
    width: 32,
    height: 48,
  },
  pickerInfo: {
    flex: 1,
  },
  pickerLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },
  pickerRate: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fontFamily.body,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fontFamily.body,
  },
});
