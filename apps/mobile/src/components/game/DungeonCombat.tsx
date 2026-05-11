import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDungeonStore } from '@/stores/dungeon';
import { useEquipmentStore } from '@/stores/equipment';
import { useLocationStore } from '@/stores/location';
import { DUNGEON_TICK_INTERVAL, DUNGEON_ENTER_RADIUS, distanceMeters } from '@undead/shared';
import { colors, fontFamily, spacing, borderRadius } from '@/theme';
import { sprites } from '@/assets';

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  rare: '#3498db',
  epic: '#8e44ad',
  legendary: '#f1c40f',
};

interface FloatingDamage {
  id: number;
  value: number;
  isPlayerDmg: boolean;
  opacity: Animated.Value;
  translateY: Animated.Value;
}

export function DungeonCombat() {
  const insets = useSafeAreaInsets();
  const {
    inCombat,
    wave,
    enemyHp,
    enemyMaxHp,
    playerHp,
    playerMaxHp,
    playerDps,
    playerTapDamage,
    enemyDps,
    highestWave,
    lastReward,
    ejected,
    tap,
    tick,
    exitCombat,
    clearReward,
  } = useDungeonStore();

  const [floatingDmg, setFloatingDmg] = useState<FloatingDamage[]>([]);
  const dmgIdRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-tick every 1s + distance check
  useEffect(() => {
    if (!inCombat || ejected) {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
    tickRef.current = setInterval(() => {
      // Check if player is still near the dungeon
      const pos = useLocationStore.getState().position;
      const { currentDungeonId, dungeons } = useDungeonStore.getState();
      if (pos && currentDungeonId) {
        const dungeon = dungeons.find((d) => d.id === currentDungeonId);
        if (dungeon) {
          const dist = distanceMeters(pos, { latitude: dungeon.latitude, longitude: dungeon.longitude });
          if (dist > dungeon.radius + DUNGEON_ENTER_RADIUS) {
            // Too far — auto-eject
            useDungeonStore.getState().exitCombat();
            return;
          }
        }
      }
      tick();
    }, DUNGEON_TICK_INTERVAL);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [inCombat, ejected, tick]);

  const addFloatingDamage = useCallback((value: number, isPlayerDmg: boolean) => {
    const id = dmgIdRef.current++;
    const opacity = new Animated.Value(1);
    const translateY = new Animated.Value(0);

    setFloatingDmg((prev) => [...prev.slice(-8), { id, value, isPlayerDmg, opacity, translateY }]);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -60,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setFloatingDmg((prev) => prev.filter((d) => d.id !== id));
    });
  }, []);

  const handleTap = useCallback(async () => {
    if (ejected) return;
    addFloatingDamage(playerTapDamage, false);
    await tap();
  }, [ejected, playerTapDamage, tap, addFloatingDamage]);

  if (!inCombat && !ejected) return null;

  const enemyHpPct = enemyMaxHp > 0 ? Math.max(0, (enemyHp / enemyMaxHp) * 100) : 0;
  const playerHpPct = playerMaxHp > 0 ? Math.max(0, (playerHp / playerMaxHp) * 100) : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      {/* Wave header */}
      <View style={styles.waveHeader}>
        <Text style={styles.waveText}>Welle {wave}</Text>
        <Pressable style={styles.fleeBtn} onPress={exitCombat}>
          <Text style={styles.fleeBtnText}>Fliehen</Text>
        </Pressable>
      </View>

      {/* Enemy section */}
      <View style={styles.enemySection}>
        <Text style={styles.hpLabel}>Gegner</Text>
        <View style={styles.hpBarBg}>
          <View style={[styles.hpBarFill, styles.enemyHpBar, { width: `${enemyHpPct}%` }]} />
        </View>
        <Text style={styles.hpText}>{Math.max(0, Math.round(enemyHp))} / {enemyMaxHp}</Text>

        <View style={styles.enemySpriteWrap}>
          <Image source={sprites.ghoul} style={styles.enemySprite} />
        </View>
        <Text style={styles.dpsLabel}>DPS: {enemyDps.toFixed(1)}</Text>
      </View>

      {/* Player section */}
      <View style={styles.playerSection}>
        <Text style={styles.hpLabel}>Du</Text>
        <View style={styles.hpBarBg}>
          <View style={[styles.hpBarFill, styles.playerHpBar, { width: `${playerHpPct}%` }]} />
        </View>
        <Text style={styles.hpText}>{Math.max(0, Math.round(playerHp))} / {playerMaxHp}</Text>
        <Text style={styles.dpsLabel}>Auto-DPS: {playerDps}/s  |  Tap: +{playerTapDamage}</Text>
      </View>

      {/* Floating damage numbers */}
      <View style={styles.floatingContainer} pointerEvents="none">
        {floatingDmg.map((d) => (
          <Animated.Text
            key={d.id}
            style={[
              styles.floatingDmg,
              d.isPlayerDmg ? styles.floatingPlayerDmg : styles.floatingEnemyDmg,
              { opacity: d.opacity, transform: [{ translateY: d.translateY }] },
            ]}
          >
            {d.isPlayerDmg ? `-${d.value}` : `+${d.value}`}
          </Animated.Text>
        ))}
      </View>

      {/* TAP AREA */}
      {!ejected && (
        <Pressable style={styles.tapArea} onPress={handleTap}>
          <Text style={styles.tapText}>TIPPEN!</Text>
          <Text style={styles.tapSubtext}>+{playerTapDamage} Schaden</Text>
        </Pressable>
      )}

      {/* Ejected overlay */}
      {ejected && (
        <View style={styles.ejectedOverlay}>
          <Text style={styles.ejectedTitle}>Besiegt!</Text>
          <Text style={styles.ejectedWave}>Höchste Welle: {highestWave}</Text>
          <Pressable style={styles.ejectedBtn} onPress={exitCombat}>
            <Text style={styles.ejectedBtnText}>Zurück zur Karte</Text>
          </Pressable>
        </View>
      )}

      {/* Reward popup */}
      {lastReward && !ejected && (
        <View style={styles.rewardOverlay}>
          <View style={[styles.rewardCard, { borderColor: (RARITY_COLORS[lastReward.rarity] ?? colors.gold) + '60' }]}>
            <Text style={[styles.rewardTitle, { color: RARITY_COLORS[lastReward.rarity] ?? colors.gold }]}>
              {lastReward.name}
            </Text>
            <Text style={styles.rewardDesc}>{lastReward.description}</Text>
            <View style={styles.rewardStats}>
              {lastReward.attackBonus > 0 && <Text style={styles.rewardStat}>ATK +{lastReward.attackBonus}</Text>}
              {lastReward.defenseBonus > 0 && <Text style={styles.rewardStat}>DEF +{lastReward.defenseBonus}</Text>}
              {lastReward.tapBonus > 0 && <Text style={styles.rewardStat}>TAP +{lastReward.tapBonus}</Text>}
            </View>
            <Pressable style={styles.rewardDismiss} onPress={clearReward}>
              <Text style={styles.rewardDismissText}>OK</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 10, 25, 0.95)',
    zIndex: 50,
    padding: spacing.lg,
  },
  waveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  waveText: {
    color: colors.gold,
    fontSize: 12,
    fontFamily: fontFamily.heading,
  },
  fleeBtn: {
    backgroundColor: colors.parchmentLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gold + '30',
  },
  fleeBtnText: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },

  // Enemy
  enemySection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  hpLabel: {
    color: colors.textSecondary,
    fontSize: 16,
    fontFamily: fontFamily.body,
    fontWeight: '700',
    marginBottom: 4,
  },
  hpBarBg: {
    width: '100%',
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 4,
  },
  hpBarFill: {
    height: '100%',
    borderRadius: 7,
  },
  enemyHpBar: {
    backgroundColor: '#c0392b',
  },
  playerHpBar: {
    backgroundColor: '#27ae60',
  },
  hpText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontFamily: fontFamily.body,
  },
  enemySpriteWrap: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  enemySprite: {
    width: 80,
    height: 80,
  },
  dpsLabel: {
    color: colors.textMuted,
    fontSize: 16,
    fontFamily: fontFamily.body,
  },

  // Player
  playerSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  // Floating damage
  floatingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingDmg: {
    position: 'absolute',
    fontSize: 28,
    fontFamily: fontFamily.body,
    fontWeight: '700',
  },
  floatingEnemyDmg: {
    color: colors.gold,
    top: '35%',
  },
  floatingPlayerDmg: {
    color: '#c0392b',
    top: '60%',
  },

  // Tap area
  tapArea: {
    flex: 1,
    backgroundColor: 'rgba(90, 42, 106, 0.3)',
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: '#5a2a6a80',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  tapText: {
    color: colors.gold,
    fontSize: 14,
    fontFamily: fontFamily.heading,
  },
  tapSubtext: {
    color: colors.textSecondary,
    fontSize: 20,
    fontFamily: fontFamily.body,
    marginTop: 8,
  },

  // Ejected
  ejectedOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ejectedTitle: {
    color: '#c0392b',
    fontSize: 14,
    fontFamily: fontFamily.heading,
    marginBottom: spacing.md,
  },
  ejectedWave: {
    color: colors.gold,
    fontSize: 24,
    fontFamily: fontFamily.body,
    fontWeight: '700',
    marginBottom: spacing.xl,
  },
  ejectedBtn: {
    backgroundColor: colors.parchmentLight,
    paddingHorizontal: 32,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gold + '30',
  },
  ejectedBtnText: {
    color: colors.text,
    fontSize: 20,
    fontFamily: fontFamily.body,
    fontWeight: '700',
  },

  // Reward popup
  rewardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
  },
  rewardCard: {
    backgroundColor: colors.parchment,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    padding: spacing.lg,
    width: '80%',
    alignItems: 'center',
  },
  rewardTitle: {
    fontSize: 10,
    fontFamily: fontFamily.heading,
    marginBottom: 8,
    textAlign: 'center',
  },
  rewardDesc: {
    color: colors.textSecondary,
    fontSize: 16,
    fontFamily: fontFamily.body,
    textAlign: 'center',
    marginBottom: 12,
  },
  rewardStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  rewardStat: {
    color: colors.gold,
    fontSize: 18,
    fontFamily: fontFamily.body,
    fontWeight: '700',
  },
  rewardDismiss: {
    backgroundColor: colors.parchmentLight,
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gold + '30',
  },
  rewardDismissText: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },
});
