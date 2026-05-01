import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useGameStore } from '@/stores/game';
import { useLocationStore } from '@/stores/location';
import { useResourceStore } from '@/stores/resources';
import { useDailyStore } from '@/stores/daily';
import { PLAYER_MAX_HITS } from '@undead/shared';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '@/theme';
import { icons } from '@/assets';
import type { GameMapHandle } from '@/components/map/GameMap';
import { QuestTracker } from '@/components/game/QuestTracker';

interface GameHUDProps {
  mapRef: React.RefObject<GameMapHandle | null>;
}

export function GameHUD({ mapRef }: GameHUDProps) {
  const { ghouls, timeOfDay, isInCityState, playerHits, gameMode, isExitingJagd, exitJagdCountdown } =
    useGameStore();
  const motionState = useLocationStore((s) => s.motionState);
  const balance = useResourceStore((s) => s.balance);
  const streak = useDailyStore((s) => s.streak);

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

  const activeGhouls = ghouls.filter((g) => !g.frozen).length;
  const heartsRemaining = PLAYER_MAX_HITS - playerHits;
  const isJagd = gameMode === 'jagd';

  const handleCenterOnPlayer = () => {
    const pos = useLocationStore.getState().position;
    if (pos && mapRef.current) {
      mapRef.current.flyToPlayer(pos.latitude, pos.longitude);
    }
  };

  const handleJagdToggle = () => {
    if (isExitingJagd) return;
    if (isJagd) {
      useGameStore.getState().exitJagd();
    } else {
      useGameStore.getState().enterJagd();
    }
  };

  const renderHearts = () => {
    const hearts = [];
    for (let i = 0; i < PLAYER_MAX_HITS; i++) {
      hearts.push(
        <Image
          key={i}
          source={icons.heart}
          style={[styles.iconSmall, i >= heartsRemaining && styles.iconDimmed]}
        />
      );
    }
    return hearts;
  };

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

        {isJagd && (
          <View style={styles.pill}>
            <View style={[styles.dot, { backgroundColor: colors.ghoul }]} />
            <Text style={styles.pillText}>{activeGhouls}</Text>
          </View>
        )}

        <View style={[styles.pill, playerHits > 0 && styles.pillDanger]}>
          {renderHearts()}
          <Text style={[styles.pillText, playerHits > 0 && styles.pillTextDanger]}>
            {heartsRemaining}/{PLAYER_MAX_HITS}
          </Text>
        </View>

        <View style={styles.pill}>
          <Image source={icons.herb} style={styles.iconSmall} />
          <Text style={styles.pillText}>{balance.herbs}</Text>
        </View>

        <View style={styles.pill}>
          <Image source={icons.crystal} style={styles.iconSmall} />
          <Text style={styles.pillText}>{balance.crystals}</Text>
        </View>

        {balance.relics > 0 && (
          <View style={styles.pill}>
            <Image source={icons.relic} style={styles.iconSmall} />
            <Text style={styles.pillText}>{balance.relics}</Text>
          </View>
        )}

        {streak && streak.currentStreak > 0 && (
          <View style={styles.pill}>
            <Image source={icons.streak} style={styles.iconSmall} />
            <Text style={styles.pillText}>{streak.currentStreak}</Text>
          </View>
        )}
      </View>

      {/* Banners */}
      {isInCityState && (
        <View style={styles.cityStateBanner} pointerEvents="none">
          <Image source={icons.shield} style={styles.iconSmall} />
          <Text style={styles.cityStateText}>Stadtstaat {'\u2014'} Ghoule gebannt</Text>
        </View>
      )}

      {timeOfDay === 'blackout' && (
        <View style={styles.blackoutBanner} pointerEvents="none">
          <Text style={styles.blackoutText}>Ruhezeit (23:00 - 06:00) {'\u2014'} Keine Ghoule</Text>
        </View>
      )}

      {/* Quest Tracker */}
      <QuestTracker />

      {/* Bottom action buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCenterOnPlayer} activeOpacity={0.7}>
          <Image source={icons.shield} style={styles.iconMed} />
        </TouchableOpacity>

        {/* Jagd / Fliehen button */}
        <TouchableOpacity
          style={[
            styles.jagdButton,
            isJagd && styles.jagdButtonActive,
            isExitingJagd && styles.jagdButtonExiting,
          ]}
          onPress={handleJagdToggle}
          activeOpacity={0.7}
          disabled={isExitingJagd}
        >
          {isExitingJagd ? (
            <View style={styles.jagdExitContent}>
              <Text style={styles.jagdExitText}>Du entkommst...</Text>
              <View style={styles.jagdExitBarBg}>
                <View
                  style={[
                    styles.jagdExitBarFill,
                    { width: `${((3 - exitJagdCountdown) / 3) * 100}%` },
                  ]}
                />
              </View>
            </View>
          ) : (
            <View style={styles.jagdButtonRow}>
              <Image source={isJagd ? icons.flee : icons.sword} style={styles.iconSmall} />
              <Text style={styles.jagdButtonText}>
                {isJagd ? 'Fliehen' : 'Jagd'}
              </Text>
            </View>
          )}
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
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.xxl + spacing.md,
    paddingHorizontal: spacing.md,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.parchment + 'E0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.gold + '30',
    gap: spacing.xs,
  },
  pillDanger: {
    borderWidth: 1,
    borderColor: colors.danger,
  },
  pillText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fontFamily.body,
  },
  pillTextDanger: {
    color: colors.danger,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconSmall: {
    width: 16,
    height: 16,
  },
  iconDimmed: {
    opacity: 0.25,
  },
  iconMed: {
    width: 24,
    height: 24,
  },
  // Banners
  cityStateBanner: {
    position: 'absolute',
    top: spacing.xxl + spacing.md + 48,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.cityState + '20',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cityState,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  cityStateText: {
    color: colors.cityState,
    fontSize: 14,
    fontFamily: fontFamily.body,
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
    fontSize: 14,
    fontFamily: fontFamily.body,
  },
  // Bottom buttons
  bottomButtons: {
    position: 'absolute',
    bottom: spacing.xxl + spacing.md,
    right: spacing.md,
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.parchment + 'E0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gold + '30',
  },
  jagdButton: {
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gold + '40',
    minWidth: 100,
    alignItems: 'center',
  },
  jagdButtonActive: {
    backgroundColor: colors.warning,
  },
  jagdButtonExiting: {
    backgroundColor: colors.surfaceLight,
    opacity: 0.9,
  },
  jagdButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  jagdButtonText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fontFamily.body,
    fontWeight: '700',
  },
  jagdExitContent: {
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 120,
  },
  jagdExitText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fontFamily.body,
  },
  jagdExitBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: colors.background,
    borderRadius: 2,
    overflow: 'hidden',
  },
  jagdExitBarFill: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 2,
  },
});
