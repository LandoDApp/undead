import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { GameMap } from '@/components/map/GameMap';
import type { GameMapHandle } from '@/components/map/GameMap';
import { GameHUD } from '@/components/game/GameHUD';
import { AttackOverlay } from '@/components/game/AttackOverlay';
import { EntryCollect } from '@/components/game/EntryCollect';
import { OnboardingTutorial, isOnboardingComplete } from '@/components/game/OnboardingTutorial';
import { useBastionStore } from '@/stores/bastion';
import { useLocation } from '@/hooks/useLocation';
import { useGhouls } from '@/hooks/useGhouls';
import { useDayNight } from '@/hooks/useDayNight';
import { useCityState } from '@/hooks/useCityState';
import { useSession } from '@/hooks/useSession';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useResources } from '@/hooks/useResources';
import { useBastion } from '@/hooks/useBastion';
import { usePositionSmoothing } from '@/hooks/usePositionSmoothing';
import { useQuests } from '@/hooks/useQuests';
import { usePedometer } from '@/hooks/usePedometer';
import { useAudio } from '@/hooks/useAudio';
import { colors } from '@/theme';

type EntryState = 'checking' | 'onboarding' | 'entry_collect' | 'done';

export default function MapScreen() {
  const mapRef = useRef<GameMapHandle>(null);
  const [entryState, setEntryState] = useState<EntryState>('checking');

  useLocation();
  usePositionSmoothing();
  useGhouls();
  useDayNight();
  useCityState();
  useSession();
  usePushNotifications();
  useResources();
  useBastion();
  useQuests();
  usePedometer();
  useAudio();

  useEffect(() => {
    (async () => {
      const completed = await isOnboardingComplete();
      if (completed) {
        // Returning user — check if bastion exists (skip if so)
        setEntryState('entry_collect');
        return;
      }
      // Check if bastion exists (may have completed onboarding on another device)
      await useBastionStore.getState().fetchBastion();
      const bastion = useBastionStore.getState().bastion;
      if (bastion) {
        // Has bastion but no flag — mark complete and show entry collect
        const { markOnboardingComplete } = await import('@/components/game/OnboardingTutorial');
        await markOnboardingComplete();
        setEntryState('entry_collect');
      } else {
        setEntryState('onboarding');
      }
    })();
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setEntryState('entry_collect');
  }, []);

  const handleEntryDone = useCallback(() => {
    setEntryState('done');
  }, []);

  return (
    <View style={styles.container}>
      <GameMap ref={mapRef} />
      <GameHUD mapRef={mapRef} />
      <AttackOverlay />
      {entryState === 'onboarding' && (
        <OnboardingTutorial onComplete={handleOnboardingComplete} />
      )}
      {entryState === 'entry_collect' && (
        <EntryCollect onDone={handleEntryDone} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
