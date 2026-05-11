import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '@/theme';
import { useQuestStore } from '@/stores/quests';
import { FrameView } from '@/components/ui/FrameView';
import type { Quest } from '@undead/shared';

/* ---- Exported modal — can be opened from GameHUD menu ---- */
export function QuestModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const daily = useQuestStore((s) => s.daily);
  const weekly = useQuestStore((s) => s.weekly);
  const insets = useSafeAreaInsets();

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.modalWrap, { marginTop: insets.top + 20, marginBottom: insets.bottom + 20 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <FrameView variant="light" paddingH={24} paddingTop={28} paddingBottom={24}>
            <Text style={styles.modalTitle}>Auftr{'\u00e4'}ge</Text>

            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionLabel}>T{'\u00e4'}glich</Text>
              {daily.map((q) => (
                <QuestRow key={q.id} quest={q} />
              ))}

              <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>W{'\u00f6'}chentlich</Text>
              {weekly.map((q) => (
                <QuestRow key={q.id} quest={q} />
              ))}
            </ScrollView>

            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>Schlie{'\u00df'}en</Text>
            </Pressable>
          </FrameView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ---- Quest row inside modal ---- */
function QuestRow({ quest }: { quest: Quest }) {
  const percent = quest.targetValue > 0 ? Math.round((quest.currentValue / quest.targetValue) * 100) : 0;
  const isComplete = quest.completedAt !== null;
  const isClaimed = quest.claimedAt !== null;
  const focusedQuestId = useQuestStore((s) => s.focusedQuestId);
  const isFocused = focusedQuestId === quest.id;

  const handleClaim = async () => {
    if (isComplete && !isClaimed) {
      await useQuestStore.getState().claimReward(quest.id);
    }
  };

  const handlePin = () => {
    if (isClaimed) return;
    useQuestStore.getState().setFocusedQuest(isFocused ? null : quest.id);
  };

  const rewardLabel = quest.rewardType === 'herb' ? 'Kraut'
    : quest.rewardType === 'crystal' ? 'Kristall'
    : quest.rewardType === 'relic' ? 'Relikt'
    : 'XP';

  return (
    <View style={[styles.questRow, isClaimed && styles.questClaimed, isFocused && styles.questFocused]}>
      <View style={styles.questInfo}>
        <View style={styles.questTitleRow}>
          <Text style={styles.questTitle}>{quest.title}</Text>
          {!isClaimed && (
            <Pressable onPress={handlePin} hitSlop={8}>
              <Text style={[styles.pinIcon, isFocused && styles.pinIconActive]}>
                {isFocused ? '\u2B50' : '\u2606'}
              </Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.questDesc}>{quest.description}</Text>
        <View style={styles.questBarBg}>
          <View style={[styles.questBarFill, { width: `${percent}%`, backgroundColor: isComplete ? '#27ae60' : '#5a3e1b' }]} />
        </View>
        <Text style={styles.questProgress}>{quest.currentValue}/{quest.targetValue}</Text>
      </View>
      <View style={styles.questReward}>
        <Text style={styles.rewardAmount}>{quest.rewardAmount}</Text>
        <Text style={styles.rewardLabel}>{rewardLabel}</Text>
        {isComplete && !isClaimed && (
          <Pressable style={styles.claimButton} onPress={handleClaim}>
            <Text style={styles.claimText}>!</Text>
          </Pressable>
        )}
        {isClaimed && <Text style={styles.claimedCheck}>{'\u2713'}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalWrap: {
    marginHorizontal: 16,
    maxHeight: '80%',
    width: '90%',
  },
  modalTitle: {
    color: '#2f1f14',
    fontSize: 10,
    fontFamily: fontFamily.heading,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  scrollArea: {
    flexGrow: 0,
  },
  sectionLabel: {
    color: '#5a3e1b',
    fontSize: 14,
    fontFamily: fontFamily.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  questRow: {
    flexDirection: 'row',
    backgroundColor: '#2f1f140d',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  questClaimed: {
    opacity: 0.5,
  },
  questFocused: {
    borderLeftColor: colors.gold,
  },
  questInfo: {
    flex: 1,
  },
  questTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questTitle: {
    color: '#2f1f14',
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    fontWeight: '600',
    flex: 1,
  },
  pinIcon: {
    fontSize: 18,
    color: '#5a3e1b80',
    marginLeft: 6,
  },
  pinIconActive: {
    color: colors.gold,
  },
  questDesc: {
    color: '#5a3e1b',
    fontSize: 14,
    fontFamily: fontFamily.body,
    marginBottom: spacing.xs,
  },
  questBarBg: {
    height: 6,
    backgroundColor: '#2f1f1420',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  questBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  questProgress: {
    color: '#5a3e1b',
    fontSize: fontSize.xs,
    fontFamily: fontFamily.body,
  },
  questReward: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
    gap: 2,
  },
  rewardAmount: {
    color: '#5a3e1b',
    fontSize: fontSize.lg,
    fontFamily: fontFamily.body,
    fontWeight: '700',
  },
  rewardLabel: {
    color: '#5a3e1b',
    fontSize: fontSize.xs,
    fontFamily: fontFamily.body,
  },
  claimButton: {
    backgroundColor: '#27ae60',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  claimText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  claimedCheck: {
    color: '#27ae60',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  closeButton: {
    backgroundColor: '#2f1f140d',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  closeText: {
    color: '#2f1f14',
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },
});
