import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useGameStore } from '@/stores/game';
import { useLocationStore } from '@/stores/location';
import { useResourceStore } from '@/stores/resources';
import { useDailyStore } from '@/stores/daily';
import { useAuthStore } from '@/stores/auth';
import { PLAYER_MAX_HITS } from '@undead/shared';
import { colors, fontFamily } from '@/theme';
import { icons } from '@/assets';
import { FrameView } from '@/components/ui/FrameView';
import type { GameMapHandle } from '@/components/map/GameMap';
import { QuestTracker } from '@/components/game/QuestTracker';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface GameHUDProps {
  mapRef: React.RefObject<GameMapHandle | null>;
  ticker?: string;
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
  return Math.max(1, Math.floor(totalXp / 1000) + 1);
}

function formatDistance(stepsToday: number): string {
  const km = (stepsToday * 0.7) / 1000;
  if (km < 0.1) return `${Math.round(stepsToday * 0.7)} m`;
  return `${km.toFixed(1)} km`;
}

/* ---- Marquee ticker ---- */
function TickerBar({ text }: { text: string }) {
  const scrollX = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  useEffect(() => {
    const textWidth = text.length * 8 + SCREEN_WIDTH;
    scrollX.setValue(SCREEN_WIDTH);

    const anim = Animated.loop(
      Animated.timing(scrollX, {
        toValue: -text.length * 8,
        duration: text.length * 110,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [text, scrollX]);

  return (
    <View style={tickerStyles.mask}>
      <Animated.Text
        style={[tickerStyles.text, { transform: [{ translateX: scrollX }] }]}
        numberOfLines={1}
      >
        {text}
      </Animated.Text>
    </View>
  );
}

const tickerStyles = StyleSheet.create({
  mask: {
    overflow: 'hidden',
    height: 26,
    justifyContent: 'center',
  },
  text: {
    color: '#2f1f14',
    fontSize: 18,
    fontFamily: fontFamily.body,
  },
});


/* ---- Main HUD ---- */
export function GameHUD({ mapRef, ticker = 'Das ist ein Test \u2014 Willkommen in den Schattenlanden...' }: GameHUDProps) {
  const insets = useSafeAreaInsets();
  const { isInCityState, timeOfDay, gameMode, isExitingJagd, exitJagdCountdown, playerHits, stepsToday, totalXp } =
    useGameStore();
  const balance = useResourceStore((s) => s.balance);
  const streak = useDailyStore((s) => s.streak);
  const user = useAuthStore((s) => s.user);
  const clan = useAuthStore((s) => s.clan);
  const isJagd = gameMode === 'jagd';
  const heartsRemaining = PLAYER_MAX_HITS - playerHits;
  const level = getLevel(totalXp);

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
        />,
      );
    }
    return hearts;
  };

  const contentPaddingTop = Math.max(insets.top, 20) + 10;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* ===== TOP FRAME ===== */}
      <View style={styles.mainFrameWrap}>
        <FrameView variant="light" paddingH={28} paddingTop={contentPaddingTop} paddingBottom={16}>
          <View style={styles.row1}>
            <View style={styles.identityCol}>
              <View style={styles.nameRow}>
                <Text style={styles.playerName} numberOfLines={1}>
                  {user?.displayName ?? 'Wanderer'}
                </Text>
                <Text style={styles.levelBadge}>Lv.{level}</Text>
              </View>
              {clan && (
                <Text style={[styles.clanText, { color: CLAN_COLORS[clan] ?? '#5a3e1b' }]}>
                  {CLAN_LABELS[clan] ?? clan}
                </Text>
              )}
            </View>

            <View style={styles.statsCol}>
              <View style={styles.heartsRow}>{renderHearts()}</View>
              <View style={styles.resourceRow}>
                <Image source={icons.herb} style={styles.iconTiny} />
                <Text style={styles.statVal}>{balance.herbs}</Text>
                <Image source={icons.crystal} style={styles.iconTiny} />
                <Text style={styles.statVal}>{balance.crystals}</Text>
                {balance.relics > 0 && (
                  <>
                    <Image source={icons.relic} style={styles.iconTiny} />
                    <Text style={styles.statVal}>{balance.relics}</Text>
                  </>
                )}
              </View>
            </View>

            <View style={styles.buttonsCol}>
              <Pressable style={styles.iconButton} onPress={() => router.push('/(game)/bastion')}>
                <Image source={icons.shield} style={styles.iconMed} />
              </Pressable>
              <Pressable style={styles.iconButton} onPress={handleCenterOnPlayer}>
                <Image source={icons.vision} style={styles.iconMed} />
              </Pressable>
              <Pressable style={styles.iconButton} onPress={() => router.push('/(game)/profile')}>
                <Text style={styles.menuIcon}>{'\u2630'}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.row2}>
            {streak && streak.currentStreak > 0 && (
              <View style={styles.chip}>
                <Image source={icons.streak} style={styles.iconTiny} />
                <Text style={styles.chipText}>{streak.currentStreak}d</Text>
              </View>
            )}
            <View style={styles.chip}>
              <Text style={styles.chipText}>{formatDistance(stepsToday)}</Text>
            </View>
            {isInCityState && (
              <View style={styles.chip}>
                <Image source={icons.shield} style={styles.iconTiny} />
                <Text style={styles.chipText}>Stadtstaat</Text>
              </View>
            )}
            {timeOfDay === 'blackout' && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>Ruhezeit</Text>
              </View>
            )}
          </View>

          <QuestTracker />
        </FrameView>
      </View>

      {/* ===== BOTTOM AREA: Jagd button flush above chat bar ===== */}
      <View style={styles.bottomArea} pointerEvents="box-none">
        <View style={styles.jagdRow}>
          <Pressable onPress={handleJagdToggle} disabled={isExitingJagd}>
            <FrameView variant="gold" paddingH={24} paddingTop={18} paddingBottom={18}>
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
                  <Image source={isJagd ? icons.flee : icons.sword} style={styles.iconLg} />
                  <Text style={styles.jagdButtonText}>
                    {isJagd ? 'Fliehen' : 'Jagd'}
                  </Text>
                </View>
              )}
            </FrameView>
          </Pressable>
        </View>

        <FrameView variant="light" paddingH={28} paddingTop={12} paddingBottom={Math.max(insets.bottom, 6) + 4}>
          <TickerBar text={ticker} />
        </FrameView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  iconTiny: {
    width: 14,
    height: 14,
  },
  iconSmall: {
    width: 16,
    height: 16,
  },
  iconMed: {
    width: 20,
    height: 20,
  },
  iconLg: {
    width: 30,
    height: 30,
  },
  iconDimmed: {
    opacity: 0.25,
  },

  // Top frame
  mainFrameWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  row1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identityCol: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playerName: {
    color: '#2f1f14',
    fontSize: 13,
    fontFamily: fontFamily.body,
    fontWeight: '700',
    flexShrink: 1,
  },
  levelBadge: {
    color: '#5a3e1b',
    fontSize: 11,
    fontFamily: fontFamily.body,
    fontWeight: '700',
  },
  clanText: {
    fontSize: 11,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },
  statsCol: {
    alignItems: 'center',
    marginHorizontal: 6,
  },
  heartsRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 2,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statVal: {
    color: '#2f1f14',
    fontSize: 14,
    fontFamily: fontFamily.body,
    marginRight: 4,
  },
  buttonsCol: {
    flexDirection: 'row',
    gap: 6,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    color: '#2f1f14',
    fontSize: 16,
    fontFamily: fontFamily.body,
  },
  row2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 5,
    backgroundColor: '#2f1f140d',
    borderRadius: 3,
  },
  chipText: {
    color: '#5a3e1b',
    fontSize: 12,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },

  // Bottom area — Jagd button flush above chat bar
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  jagdRow: {
    alignItems: 'flex-end',
    marginRight: -4,
  },
  jagdButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  jagdButtonText: {
    color: '#2f1f14',
    fontSize: 22,
    fontFamily: fontFamily.body,
    fontWeight: '700',
  },
  jagdExitContent: {
    alignItems: 'center',
    gap: 6,
    minWidth: 130,
  },
  jagdExitText: {
    color: '#5a3e1b',
    fontSize: 15,
    fontFamily: fontFamily.body,
  },
  jagdExitBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: '#d4a80a40',
    borderRadius: 3,
    overflow: 'hidden',
  },
  jagdExitBarFill: {
    height: '100%',
    backgroundColor: '#d4a80a',
    borderRadius: 3,
  },
});
