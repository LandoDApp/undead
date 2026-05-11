import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDungeonStore } from '@/stores/dungeon';
import { useEquipmentStore } from '@/stores/equipment';
import { api } from '@/services/api';
import { colors, fontFamily, spacing, borderRadius } from '@/theme';
import type { DungeonStatusResponse } from '@undead/shared';

interface DungeonEntryModalProps {
  dungeon: { id: string; name: string; minLevel: number } | null;
  onClose: () => void;
}

export function DungeonEntryModal({ dungeon, onClose }: DungeonEntryModalProps) {
  const insets = useSafeAreaInsets();
  const enterDungeon = useDungeonStore((s) => s.enterDungeon);
  const equipment = useEquipmentStore((s) => s.equipment);
  const [status, setStatus] = useState<DungeonStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dungeon) {
      api.dungeons.status(dungeon.id).then((res) => {
        if (res.success && res.data) {
          setStatus(res.data);
        }
      });
    } else {
      setStatus(null);
    }
  }, [dungeon]);

  const handleEnter = async () => {
    if (!dungeon || loading) return;
    setLoading(true);
    const success = await enterDungeon(dungeon.id);
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  // Calculate equipment stats
  let totalAtk = 0, totalDef = 0, totalTap = 0;
  for (const slot of ['weapon', 'armor', 'amulet'] as const) {
    const item = equipment[slot];
    if (item) {
      totalAtk += item.attackBonus;
      totalDef += item.defenseBonus;
      totalTap += item.tapBonus;
    }
  }

  const canEnter = status?.canEnterToday !== false;

  return (
    <Modal transparent animationType="fade" visible={!!dungeon} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>{dungeon?.name ?? 'Dungeon'}</Text>
          <Text style={styles.subtitle}>Empfohlen: Lv.{dungeon?.minLevel ?? 1}+</Text>

          <View style={styles.divider} />

          {status && (
            <View style={styles.statusSection}>
              <Text style={styles.statusText}>
                Höchste Welle: {status.highestWave}
              </Text>
              {status.lastAttempt && (
                <Text style={styles.statusText}>
                  Letzter Versuch: {status.lastAttempt}
                </Text>
              )}
            </View>
          )}

          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>Deine Ausrüstung</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>ATK</Text>
                <Text style={styles.statValue}>+{totalAtk}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>DEF</Text>
                <Text style={styles.statValue}>+{totalDef}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>TAP</Text>
                <Text style={styles.statValue}>+{totalTap}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <Pressable
            style={[styles.enterBtn, !canEnter && styles.disabledBtn]}
            onPress={handleEnter}
            disabled={!canEnter || loading}
          >
            <Text style={styles.enterBtnText}>
              {!canEnter ? 'Heute bereits betreten' : loading ? 'Betrete...' : 'Betreten'}
            </Text>
          </Pressable>

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Zurück</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
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
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gold + '40',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.gold,
    fontSize: 12,
    fontFamily: fontFamily.heading,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 18,
    fontFamily: fontFamily.body,
    textAlign: 'center',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gold + '40',
    marginVertical: 12,
  },
  statusSection: {
    marginBottom: 12,
    gap: 4,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 18,
    fontFamily: fontFamily.body,
  },
  statsSection: {
    marginBottom: 8,
  },
  statsTitle: {
    color: colors.textSecondary,
    fontSize: 16,
    fontFamily: fontFamily.body,
    fontWeight: '700',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.parchmentLight,
    borderRadius: borderRadius.md,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold + '20',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fontFamily.body,
  },
  statValue: {
    color: colors.gold,
    fontSize: 22,
    fontFamily: fontFamily.body,
    fontWeight: '700',
  },
  enterBtn: {
    backgroundColor: '#5a2a6a',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: 8,
  },
  disabledBtn: {
    opacity: 0.4,
  },
  enterBtnText: {
    color: colors.text,
    fontSize: 20,
    fontFamily: fontFamily.body,
    fontWeight: '700',
  },
  closeBtn: {
    backgroundColor: colors.parchmentLight,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold + '30',
  },
  closeBtnText: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },
});
