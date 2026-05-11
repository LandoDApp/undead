import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useGameStore } from '@/stores/game';
import { useLocationStore } from '@/stores/location';
import { useResourceStore } from '@/stores/resources';
import { useDailyStore } from '@/stores/daily';
import { useAuthStore } from '@/stores/auth';
import { useQuestStore } from '@/stores/quests';
import { useEquipmentStore } from '@/stores/equipment';
import { PLAYER_MAX_HITS, PLAYER_XP_PER_LEVEL } from '@undead/shared';
import { colors, fontFamily, shadows, spacing, borderRadius } from '@/theme';
import { icons } from '@/assets';
import { QuestModal } from '@/components/game/QuestTracker';
import { EquipmentPanel } from '@/components/game/EquipmentPanel';
import type { GameMapHandle } from '@/components/map/GameMap';

interface GameHUDProps {
  mapRef: React.RefObject<GameMapHandle | null>;
  chatMessage?: string;
}

const CLAN_LABELS: Record<string, string> = {
  glut: 'Glut',
  frost: 'Frost',
  hain: 'Hain',
};

const CLAN_COLORS: Record<string, string> = {
  glut: colors.clanGlut,
  frost: colors.clanFrost,
  hain: colors.clanHain,
};

function getLevel(totalXp: number): number {
  return Math.max(1, Math.floor(totalXp / PLAYER_XP_PER_LEVEL) + 1);
}

function formatDistance(stepsToday: number): string {
  const km = (stepsToday * 0.7) / 1000;
  if (km < 0.1) return `${Math.round(stepsToday * 0.7)} m`;
  return `${km.toFixed(1)} km`;
}

export function GameHUD({ mapRef, chatMessage = '' }: GameHUDProps) {
  const insets = useSafeAreaInsets();
  const { isInCityState, timeOfDay, gameMode, isExitingJagd, exitJagdCountdown, playerHits, stepsToday, totalXp } =
    useGameStore();
  const balance = useResourceStore((s) => s.balance);
  const streak = useDailyStore((s) => s.streak);
  const user = useAuthStore((s) => s.user);
  const clan = useAuthStore((s) => s.clan);
  const focusedQuestId = useQuestStore((s) => s.focusedQuestId);
  const daily = useQuestStore((s) => s.daily);
  const weekly = useQuestStore((s) => s.weekly);

  const isJagd = gameMode === 'jagd';
  const heartsRemaining = PLAYER_MAX_HITS - playerHits;
  const level = getLevel(totalXp);

  const keys = useEquipmentStore((s) => s.keys);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showEquipment, setShowEquipment] = useState(false);

  useEffect(() => {
    useQuestStore.getState().loadFocusedQuest();
  }, []);

  const focusedQuest = focusedQuestId
    ? [...daily, ...weekly].find((q) => q.id === focusedQuestId && !q.claimedAt)
    : null;

  const handleCenterOnPlayer = useCallback(() => {
    const pos = useLocationStore.getState().position;
    if (pos && mapRef.current) {
      mapRef.current.flyToPlayer(pos.latitude, pos.longitude);
    }
  }, [mapRef]);

  const handleJagdToggle = useCallback(() => {
    if (isExitingJagd) return;
    if (isJagd) {
      useGameStore.getState().exitJagd();
    } else {
      useGameStore.getState().enterJagd();
    }
    setMenuOpen(false);
  }, [isJagd, isExitingJagd]);

  const renderHearts = () => {
    const hearts = [];
    for (let i = 0; i < PLAYER_MAX_HITS; i++) {
      hearts.push(
        <Image
          key={i}
          source={icons.heart}
          style={[styles.heartIcon, i >= heartsRemaining && styles.iconDimmed]}
        />,
      );
    }
    return hearts;
  };

  const focusedPercent = focusedQuest && focusedQuest.targetValue > 0
    ? Math.round((focusedQuest.currentValue / focusedQuest.targetValue) * 100)
    : 0;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* ===== TOP-LEFT: Hearts + Resources ===== */}
      <View style={[styles.topLeft, { top: insets.top + 8 }]}>
        <View style={styles.statsPill}>
          <View style={styles.heartsRow}>{renderHearts()}</View>
          <View style={styles.resourceRow}>
            <Image source={icons.herb} style={styles.resIcon} />
            <Text style={styles.resVal}>{balance.herbs}</Text>
            <Image source={icons.crystal} style={styles.resIcon} />
            <Text style={styles.resVal}>{balance.crystals}</Text>
            {balance.relics > 0 && (
              <>
                <Image source={icons.relic} style={styles.resIcon} />
                <Text style={styles.resVal}>{balance.relics}</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* ===== TOP-RIGHT: Chat + Focused Quest ===== */}
      <View style={[styles.topRight, { top: insets.top + 8 }]}>
        {chatMessage !== '' && (
          <View style={styles.chatPill}>
            <Text style={styles.chatText} numberOfLines={1}>{chatMessage}</Text>
          </View>
        )}
        {focusedQuest && (
          <Pressable style={styles.questWidget} onPress={() => setShowQuests(true)}>
            <Text style={styles.questWidgetTitle} numberOfLines={1}>{focusedQuest.title}</Text>
            <View style={styles.questBarBg}>
              <View style={[styles.questBarFill, { width: `${focusedPercent}%` }]} />
            </View>
            <Text style={styles.questWidgetProgress}>
              {focusedQuest.currentValue}/{focusedQuest.targetValue}
            </Text>
          </Pressable>
        )}
      </View>

      {/* ===== BOTTOM-RIGHT: Center/Locate button ===== */}
      <Pressable
        style={[styles.locateBtn, { bottom: insets.bottom + 90 }]}
        onPress={handleCenterOnPlayer}
      >
        <Text style={styles.locateIcon}>{'\uD83D\uDCCD'}</Text>
      </Pressable>

      {/* ===== COMPASS BUTTON (bottom center) ===== */}
      <View style={[styles.compassWrap, { bottom: insets.bottom + 16 }]}>
        <Pressable style={styles.compassBtn} onPress={() => setMenuOpen(true)}>
          <Text style={styles.compassIcon}>{'\u2726'}</Text>
        </Pressable>
      </View>

      {/* ===== FULL-SCREEN MENU MODAL ===== */}
      <Modal transparent animationType="slide" visible={menuOpen} onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <Pressable
            style={[styles.menuFull, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.handle} />

            {/* Header: player name + level + clan */}
            <View style={styles.menuHeader}>
              <Text style={styles.menuPlayerName} numberOfLines={1}>
                {user?.displayName ?? 'Wanderer'}
              </Text>
              <View style={styles.menuSubRow}>
                <Text style={styles.menuLevel}>Lv.{level}</Text>
                {clan && (
                  <Text style={[styles.menuClan, { color: CLAN_COLORS[clan] ?? colors.textSecondary }]}>
                    {CLAN_LABELS[clan] ?? clan}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Menu items */}
            <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
              <Pressable style={styles.menuItem} onPress={handleJagdToggle} disabled={isExitingJagd}>
                {isExitingJagd ? (
                  <View style={styles.jagdExitRow}>
                    <Image source={icons.flee} style={styles.menuItemIcon} />
                    <View style={styles.jagdExitContent}>
                      <Text style={styles.menuItemLabel}>Du entkommst...</Text>
                      <View style={styles.jagdExitBarBg}>
                        <View style={[styles.jagdExitBarFill, { width: `${((3 - exitJagdCountdown) / 3) * 100}%` }]} />
                      </View>
                    </View>
                  </View>
                ) : (
                  <>
                    <Image source={isJagd ? icons.flee : icons.sword} style={styles.menuItemIcon} />
                    <Text style={styles.menuItemLabel}>{isJagd ? 'Fliehen' : 'Jagd starten'}</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => { setMenuOpen(false); router.push('/(game)/bastion'); }}
              >
                <Image source={icons.shield} style={styles.menuItemIcon} />
                <Text style={styles.menuItemLabel}>Bastion</Text>
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => { setMenuOpen(false); setShowQuests(true); }}
              >
                <Image source={icons.quest} style={styles.menuItemIcon} />
                <Text style={styles.menuItemLabel}>Auftr{'\u00e4'}ge</Text>
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => { setMenuOpen(false); setShowEquipment(true); }}
              >
                <Image source={icons.sword} style={styles.menuItemIcon} />
                <Text style={styles.menuItemLabel}>Ausr{'\u00fc'}stung</Text>
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => { setMenuOpen(false); router.push('/(game)/profile'); }}
              >
                <Image source={icons.vision} style={styles.menuItemIcon} />
                <Text style={styles.menuItemLabel}>Profil</Text>
              </Pressable>
            </ScrollView>

            <View style={styles.divider} />

            {/* Status chips */}
            <View style={styles.statusRow}>
              {keys > 0 && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>🔑 {keys}</Text>
                </View>
              )}
              {streak && streak.currentStreak > 0 && (
                <View style={styles.chip}>
                  <Image source={icons.streak} style={styles.chipIcon} />
                  <Text style={styles.chipText}>{streak.currentStreak}d</Text>
                </View>
              )}
              <View style={styles.chip}>
                <Text style={styles.chipText}>{formatDistance(stepsToday)}</Text>
              </View>
              {isInCityState && (
                <View style={styles.chip}>
                  <Image source={icons.shield} style={styles.chipIcon} />
                  <Text style={styles.chipText}>Stadtstaat</Text>
                </View>
              )}
              {timeOfDay === 'blackout' && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>Ruhezeit</Text>
                </View>
              )}
            </View>

            {/* Close button */}
            <Pressable style={styles.closeBtn} onPress={() => setMenuOpen(false)}>
              <Text style={styles.closeBtnText}>Schlie{'\u00df'}en</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Quest modal */}
      <QuestModal visible={showQuests} onClose={() => setShowQuests(false)} />

      {/* Equipment modal */}
      <EquipmentPanel visible={showEquipment} onClose={() => setShowEquipment(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },

  // Icons
  heartIcon: { width: 20, height: 20 },
  resIcon: { width: 18, height: 18 },
  iconDimmed: { opacity: 0.25 },

  /* ---- TOP LEFT ---- */
  topLeft: {
    position: 'absolute',
    left: 12,
  },
  statsPill: {
    backgroundColor: 'rgba(13,17,23,0.65)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 5,
  },
  heartsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resVal: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fontFamily.body,
    marginRight: 6,
  },

  /* ---- TOP RIGHT ---- */
  topRight: {
    position: 'absolute',
    right: 12,
    maxWidth: '55%',
    alignItems: 'flex-end',
    gap: 6,
  },
  chatPill: {
    backgroundColor: 'rgba(13,17,23,0.65)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chatText: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fontFamily.body,
  },
  questWidget: {
    backgroundColor: 'rgba(13,17,23,0.65)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 130,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  questWidgetTitle: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fontFamily.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  questBarBg: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 3,
  },
  questBarFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 3,
  },
  questWidgetProgress: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fontFamily.body,
  },

  /* ---- BOTTOM-RIGHT: Locate ---- */
  locateBtn: {
    position: 'absolute',
    right: 14,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(13,17,23,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locateIcon: {
    fontSize: 22,
  },

  /* ---- COMPASS BUTTON ---- */
  compassWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  compassBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.parchment,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.goldGlow,
  },
  compassIcon: {
    color: colors.gold,
    fontSize: 26,
    fontFamily: fontFamily.heading,
  },

  /* ---- FULL-SCREEN MENU ---- */
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuFull: {
    flex: 1,
    backgroundColor: colors.parchment,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.gold + '50',
    paddingHorizontal: spacing.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gold + '40',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },

  menuHeader: {
    alignItems: 'center',
    marginBottom: 4,
  },
  menuPlayerName: {
    color: colors.gold,
    fontSize: 12,
    fontFamily: fontFamily.heading,
    textAlign: 'center',
  },
  menuSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  menuLevel: {
    color: colors.textSecondary,
    fontSize: 18,
    fontFamily: fontFamily.body,
    fontWeight: '700',
  },
  menuClan: {
    fontSize: 18,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    backgroundColor: colors.gold + '40',
    marginVertical: 14,
  },

  menuScroll: {
    flexGrow: 0,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 16,
    borderRadius: borderRadius.md,
  },
  menuItemIcon: {
    width: 28,
    height: 28,
  },
  menuItemLabel: {
    color: colors.text,
    fontSize: 20,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },

  // Jagd exit in menu
  jagdExitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  jagdExitContent: {
    flex: 1,
    gap: 6,
  },
  jagdExitBarBg: {
    height: 6,
    backgroundColor: colors.gold + '40',
    borderRadius: 3,
    overflow: 'hidden',
  },
  jagdExitBarFill: {
    height: '100%',
    backgroundColor: colors.goldDark,
    borderRadius: 3,
  },

  // Status chips
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: colors.parchmentLight,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.gold + '20',
  },
  chipIcon: { width: 16, height: 16 },
  chipText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },

  // Close button
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
