import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Pressable } from 'react-native';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '@/theme';
import { useQuestStore } from '@/stores/quests';
import type { Quest } from '@undead/shared';

export function QuestTracker() {
  const daily = useQuestStore((s) => s.daily);
  const weekly = useQuestStore((s) => s.weekly);
  const [showModal, setShowModal] = useState(false);

  // Show up to 2 active (unclaimed) quests in the compact tracker
  const activeQuests = [...daily, ...weekly]
    .filter((q) => !q.claimedAt)
    .slice(0, 2);

  if (activeQuests.length === 0) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.tracker}
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}
      >
        {activeQuests.map((q) => (
          <QuestMini key={q.id} quest={q} />
        ))}
      </TouchableOpacity>

      <Modal transparent animationType="slide" visible={showModal} onRequestClose={() => setShowModal(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowModal(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Auftr{'\u00e4'}ge</Text>

            <ScrollView style={styles.scrollArea}>
              <Text style={styles.sectionLabel}>T{'\u00e4'}glich</Text>
              {daily.map((q) => (
                <QuestRow key={q.id} quest={q} />
              ))}

              <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>W{'\u00f6'}chentlich</Text>
              {weekly.map((q) => (
                <QuestRow key={q.id} quest={q} />
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.closeButton} onPress={() => setShowModal(false)}>
              <Text style={styles.closeText}>Schlie{'\u00df'}en</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function QuestMini({ quest }: { quest: Quest }) {
  const percent = quest.targetValue > 0 ? Math.round((quest.currentValue / quest.targetValue) * 100) : 0;
  const isComplete = quest.completedAt !== null;

  return (
    <View style={[styles.miniCard, isComplete && styles.miniCardComplete]}>
      <Text style={styles.miniTitle} numberOfLines={1}>{quest.title}</Text>
      <View style={styles.miniBarBg}>
        <View style={[styles.miniBarFill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.miniProgress}>{quest.currentValue}/{quest.targetValue}</Text>
    </View>
  );
}

function QuestRow({ quest }: { quest: Quest }) {
  const percent = quest.targetValue > 0 ? Math.round((quest.currentValue / quest.targetValue) * 100) : 0;
  const isComplete = quest.completedAt !== null;
  const isClaimed = quest.claimedAt !== null;

  const handleClaim = async () => {
    if (isComplete && !isClaimed) {
      await useQuestStore.getState().claimReward(quest.id);
    }
  };

  const rewardIcon = quest.rewardType === 'herb' ? '🌿'
    : quest.rewardType === 'crystal' ? '💎'
    : quest.rewardType === 'relic' ? '✨'
    : '⭐';

  return (
    <View style={[styles.questRow, isClaimed && styles.questClaimed]}>
      <View style={styles.questInfo}>
        <Text style={styles.questTitle}>{quest.title}</Text>
        <Text style={styles.questDesc}>{quest.description}</Text>
        <View style={styles.questBarBg}>
          <View style={[styles.questBarFill, { width: `${percent}%`, backgroundColor: isComplete ? colors.primary : colors.warning }]} />
        </View>
        <Text style={styles.questProgress}>{quest.currentValue}/{quest.targetValue}</Text>
      </View>
      <View style={styles.questReward}>
        <Text style={styles.rewardIcon}>{rewardIcon}</Text>
        <Text style={styles.rewardAmount}>{quest.rewardAmount}</Text>
        {isComplete && !isClaimed && (
          <TouchableOpacity style={styles.claimButton} onPress={handleClaim} activeOpacity={0.7}>
            <Text style={styles.claimText}>!</Text>
          </TouchableOpacity>
        )}
        {isClaimed && <Text style={styles.claimedCheck}>✓</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tracker: {
    position: 'absolute',
    top: 100,
    left: spacing.sm,
    gap: spacing.xs,
    maxWidth: 140,
  },
  miniCard: {
    backgroundColor: colors.parchment + 'E0',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    borderWidth: 1,
    borderColor: colors.gold + '20',
  },
  miniCardComplete: {
    borderLeftColor: colors.primary,
  },
  miniTitle: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fontFamily.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  miniBarBg: {
    height: 4,
    backgroundColor: colors.background,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 2,
  },
  miniBarFill: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 2,
  },
  miniProgress: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fontFamily.body,
  },
  // Modal
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
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gold + '40',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    color: colors.gold,
    fontSize: 10,
    fontFamily: fontFamily.heading,
    marginBottom: spacing.md,
  },
  scrollArea: {
    flex: 1,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fontFamily.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  questRow: {
    flexDirection: 'row',
    backgroundColor: colors.parchmentLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gold + '20',
  },
  questClaimed: {
    opacity: 0.5,
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },
  questDesc: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fontFamily.body,
    marginBottom: spacing.xs,
  },
  questBarBg: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  questBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  questProgress: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontFamily: fontFamily.body,
  },
  questReward: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
    gap: 2,
  },
  rewardIcon: {
    fontSize: 20,
  },
  rewardAmount: {
    color: colors.gold,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.body,
    fontWeight: '700',
  },
  claimButton: {
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  claimedCheck: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  closeButton: {
    backgroundColor: colors.parchmentLight,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.gold + '30',
  },
  closeText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },
});
