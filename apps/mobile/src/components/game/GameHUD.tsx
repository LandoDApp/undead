import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useGameStore } from '@/stores/game';
import { useLocationStore } from '@/stores/location';
import { useZoneStore } from '@/stores/zone';
import { usePointsStore } from '@/stores/points';
import { PLAYER_MAX_HITS } from '@undead/shared';
import { api } from '@/services/api';
import { colors, spacing, fontSize, borderRadius } from '@/theme';
import type { GameMapHandle } from '@/components/map/GameMap';

interface GameHUDProps {
  mapRef: React.RefObject<GameMapHandle | null>;
}

export function GameHUD({ mapRef }: GameHUDProps) {
  const { zombies, timeOfDay, isGameActive, isInSafeZone, isPaused, playerHits } =
    useGameStore();
  const motionState = useLocationStore((s) => s.motionState);
  const position = useLocationStore((s) => s.position);
  const pointsBalance = usePointsStore((s) => s.balance.totalPoints);

  const timeLabel = {
    day: 'Tag',
    night: 'Nacht',
    blackout: 'Ruhezeit',
  }[timeOfDay];

  const motionLabel = {
    still: 'Stehen',
    walking: 'Gehen',
    running: 'Laufen',
  }[motionState];

  const activeZombies = zombies.filter((z) => !z.frozen).length;
  const heartsRemaining = PLAYER_MAX_HITS - playerHits;

  const handleStartGame = () => {
    useGameStore.getState().startGame();
  };

  const handleCenterOnPlayer = () => {
    const pos = useLocationStore.getState().position;
    if (pos && mapRef.current) {
      mapRef.current.flyToPlayer(pos.latitude, pos.longitude);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Spiel beenden',
      'Zombies löschen und Safe Zones zurücksetzen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Beenden',
          style: 'destructive',
          onPress: () => {
            api.dev.reset().then((res) => {
              if (res.success) {
                useGameStore.getState().stopGame();
                useZoneStore.getState().fetchZones();
              }
            });
          },
        },
      ]
    );
  };

  // Before game starts: show start screen
  if (!isGameActive) {
    return (
      <View style={styles.overlay} pointerEvents="box-none">
        {/* Top info pills */}
        <View style={styles.topBar} pointerEvents="none">
          <View style={styles.pill}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    timeOfDay === 'day'
                      ? colors.warning
                      : timeOfDay === 'night'
                      ? colors.primary
                      : colors.textMuted,
                },
              ]}
            />
            <Text style={styles.pillText}>{timeLabel}</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{motionLabel}</Text>
          </View>
        </View>

        {/* Center: start button */}
        <View style={styles.startContainer} pointerEvents="box-none">
          <Text style={styles.startHint}>
            {position
              ? 'Geh dahin wo du spielen willst'
              : 'Warte auf GPS...'}
          </Text>
          <TouchableOpacity
            style={[styles.startButton, !position && styles.startButtonDisabled]}
            onPress={handleStartGame}
            activeOpacity={0.7}
            disabled={!position}
          >
            <Text style={styles.startButtonText}>Spiel starten</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom right: center button */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCenterOnPlayer} activeOpacity={0.7}>
            <Text style={styles.actionButtonIcon}>📍</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Game is active: show full HUD
  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Top status bar */}
      <View style={styles.topBar} pointerEvents="none">
        <View style={styles.pill}>
          <View
            style={[
              styles.dot,
              {
                backgroundColor:
                  timeOfDay === 'day'
                    ? colors.warning
                    : timeOfDay === 'night'
                    ? colors.primary
                    : colors.textMuted,
              },
            ]}
          />
          <Text style={styles.pillText}>{timeLabel}</Text>
        </View>

        <View style={styles.pill}>
          <Text style={styles.pillText}>{motionLabel}</Text>
        </View>

        <View style={styles.pill}>
          <View style={[styles.dot, { backgroundColor: colors.zombie }]} />
          <Text style={styles.pillText}>{activeZombies}</Text>
        </View>

        <View style={[styles.pill, playerHits > 0 && styles.pillDanger]}>
          <Text style={styles.healthHearts}>
            {'❤️'.repeat(heartsRemaining)}
            {'🖤'.repeat(playerHits)}
          </Text>
          <Text style={[styles.pillText, playerHits > 0 && styles.pillTextDanger]}>
            {heartsRemaining}/{PLAYER_MAX_HITS}
          </Text>
        </View>

        <View style={styles.pill}>
          <View style={[styles.dot, { backgroundColor: colors.warning }]} />
          <Text style={styles.pillText}>P {pointsBalance}</Text>
        </View>
      </View>

      {/* Banners */}
      {isInSafeZone && (
        <View style={styles.safeZoneBanner} pointerEvents="none">
          <Text style={styles.safeZoneText}>Safe Zone - Zombies eingefroren</Text>
        </View>
      )}

      {timeOfDay === 'blackout' && (
        <View style={styles.blackoutBanner} pointerEvents="none">
          <Text style={styles.blackoutText}>Ruhezeit (23:00 - 06:00) - Keine Zombies</Text>
        </View>
      )}

      {isPaused && (
        <View style={styles.pausedBanner} pointerEvents="none">
          <Text style={styles.pausedText}>Session pausiert</Text>
        </View>
      )}

      {/* Bottom action buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCenterOnPlayer} activeOpacity={0.7}>
          <Text style={styles.actionButtonIcon}>📍</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.resetButton]} onPress={handleReset} activeOpacity={0.7}>
          <Text style={styles.actionButtonIcon}>🔄</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xxl + spacing.md,
    paddingHorizontal: spacing.md,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface + 'E0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  pillDanger: {
    borderWidth: 1,
    borderColor: colors.danger,
  },
  pillText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  pillTextDanger: {
    color: colors.danger,
  },
  healthHearts: {
    fontSize: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Start screen
  startContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  startHint: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
    backgroundColor: colors.surface + 'E0',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  startButton: {
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  startButtonDisabled: {
    opacity: 0.4,
  },
  startButtonText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  // Banners
  safeZoneBanner: {
    position: 'absolute',
    top: spacing.xxl + spacing.md + 48,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.safeZone + '20',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.safeZone,
    alignItems: 'center',
  },
  safeZoneText: {
    color: colors.safeZone,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  blackoutBanner: {
    position: 'absolute',
    top: spacing.xxl + spacing.md + 48,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surfaceLight + 'E0',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  blackoutText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  pausedBanner: {
    position: 'absolute',
    top: spacing.xxl + spacing.md + 48,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.warning + '22',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.warning,
    alignItems: 'center',
  },
  pausedText: {
    color: colors.warning,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  // Bottom buttons
  bottomButtons: {
    position: 'absolute',
    bottom: spacing.xxl + spacing.md,
    right: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface + 'E0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetButton: {
    borderColor: colors.danger + '60',
  },
  actionButtonIcon: {
    fontSize: 20,
  },
});
