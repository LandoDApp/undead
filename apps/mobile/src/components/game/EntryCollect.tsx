import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '@/theme';
import { icons } from '@/assets';
import { useBastionStore } from '@/stores/bastion';
import { useDailyStore } from '@/stores/daily';
import { VisionCard } from './VisionCard';

interface EntryCollectProps {
  onDone: () => void;
}

export function EntryCollect({ onDone }: EntryCollectProps) {
  const storage = useBastionStore((s) => s.storage);
  const vision = useDailyStore((s) => s.vision);
  const streak = useDailyStore((s) => s.streak);
  const [collecting, setCollecting] = useState(false);
  const [collected, setCollected] = useState(false);
  const [showVision, setShowVision] = useState(false);

  useEffect(() => {
    // Fetch idle state & streak on mount
    useBastionStore.getState().fetchIdleState();
    useDailyStore.getState().fetchStreak();
    useDailyStore.getState().fetchVision();
  }, []);

  const hasStorage = storage && (storage.herbs > 0 || storage.crystals > 0 || storage.relics > 0 || storage.scoutReports > 0);
  const hasNoVision = !vision;

  const handleCollect = async () => {
    setCollecting(true);
    await useBastionStore.getState().collectStorage();
    setCollecting(false);
    setCollected(true);

    // Check if vision needs drawing
    if (hasNoVision) {
      setShowVision(true);
    }
  };

  const handleVisionClose = () => {
    setShowVision(false);
    onDone();
  };

  const handleSkip = () => {
    if (hasNoVision) {
      setShowVision(true);
    } else {
      onDone();
    }
  };

  // Trigger parent update after render to avoid setState-in-render warnings
  useEffect(() => {
    if (collected && !showVision) {
      onDone();
    }
  }, [collected, showVision, onDone]);

  if (collected && !showVision) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Streak display */}
        {streak && streak.currentStreak > 0 && (
          <View style={styles.streakContainer}>
            <Image source={icons.streak} style={styles.streakIcon} />
            <Text style={styles.streakText}>{streak.currentStreak} Tage</Text>
          </View>
        )}

        <Text style={styles.title}>Willkommen zur{'\u00fc'}ck!</Text>

        {/* Storage summary */}
        {hasStorage && storage && (
          <View style={styles.storagePreview}>
            <Text style={styles.storageTitle}>Deine Bastion hat produziert:</Text>
            {storage.herbs > 0 && (
              <View style={styles.storageRow}>
                <Image source={icons.herb} style={styles.storageIcon} />
                <Text style={styles.storageLine}>{storage.herbs} Kr{'\u00e4'}uter</Text>
              </View>
            )}
            {storage.crystals > 0 && (
              <View style={styles.storageRow}>
                <Image source={icons.crystal} style={styles.storageIcon} />
                <Text style={styles.storageLine}>{storage.crystals} Kristalle</Text>
              </View>
            )}
            {storage.relics > 0 && (
              <View style={styles.storageRow}>
                <Image source={icons.relic} style={styles.storageIcon} />
                <Text style={styles.storageLine}>{storage.relics} Reliquien</Text>
              </View>
            )}
            {storage.scoutReports > 0 && (
              <View style={styles.storageRow}>
                <Image source={icons.vision} style={styles.storageIcon} />
                <Text style={styles.storageLine}>{storage.scoutReports} Berichte</Text>
              </View>
            )}
          </View>
        )}

        {hasStorage ? (
          <TouchableOpacity
            style={[styles.collectButton, collecting && styles.buttonDisabled]}
            onPress={handleCollect}
            disabled={collecting}
            activeOpacity={0.7}
          >
            <Text style={styles.collectButtonText}>
              {collecting ? 'Wird eingesammelt...' : 'Einsammeln'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyStorage}>
            <Text style={styles.emptyText}>Lager ist leer</Text>
          </View>
        )}

        <TouchableOpacity style={styles.skipButton} onPress={hasStorage ? handleSkip : onDone} activeOpacity={0.7}>
          <Text style={styles.skipText}>
            {hasStorage ? '\u00dcberspringen' : 'Weiter'}
          </Text>
        </TouchableOpacity>
      </View>

      <VisionCard visible={showVision} onClose={handleVisionClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background + 'F0',
    zIndex: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '85%',
    maxWidth: 340,
    alignItems: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.parchment,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gold + '40',
  },
  streakIcon: {
    width: 16,
    height: 16,
  },
  streakText: {
    color: colors.gold,
    fontSize: fontSize.lg,
    fontFamily: fontFamily.body,
    fontWeight: '700',
  },
  title: {
    color: colors.gold,
    fontSize: 12,
    fontFamily: fontFamily.heading,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  storagePreview: {
    backgroundColor: colors.parchment,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gold + '40',
  },
  storageTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fontFamily.body,
    marginBottom: spacing.md,
  },
  storageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  storageIcon: {
    width: 16,
    height: 16,
  },
  storageLine: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },
  collectButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gold + '40',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  collectButtonText: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontFamily: fontFamily.body,
    fontWeight: '700',
  },
  emptyStorage: {
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
  },
  skipButton: {
    paddingVertical: spacing.sm,
  },
  skipText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
  },
});
