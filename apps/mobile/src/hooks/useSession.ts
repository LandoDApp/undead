import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGameStore } from '@/stores/game';
import { useLocationStore } from '@/stores/location';
import { api } from '@/services/api';
import { SESSION_RESUME_THRESHOLD } from '@undead/shared';
import type { ZombieState } from '@undead/shared';

const SESSION_KEY = 'undead_session_state';

interface SavedSession {
  zombies: ZombieState[];
  timestamp: number;
  position: { latitude: number; longitude: number } | null;
}

export function useSession() {
  const { startSession, resetSession, setZombies, pauseSession, resumeSession } =
    useGameStore();
  const appStateRef = useRef(AppState.currentState);
  const transitionRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    // Try to restore session on mount
    (async () => {
      const restored = await restoreSession();
      if (!mounted) return;
      if (restored) {
        resumeSession();
      } else {
        startSession();
      }
    })();

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  async function handleAppStateChange(nextState: AppStateStatus) {
    if (transitionRef.current) return;
    transitionRef.current = true;

    if (appStateRef.current === 'active' && nextState.match(/inactive|background/)) {
      // Going to background - save state
      await saveSession();
      pauseSession();
      try {
        await api.player.setInactive();
      } catch {
        // network failures are ignored; local pause state is authoritative
      }
    } else if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
      // Coming back to foreground
      const restored = await restoreSession();
      if (!restored) {
        startSession();
      }
      resumeSession();
    }
    appStateRef.current = nextState;
    transitionRef.current = false;
  }

  async function saveSession() {
    const state: SavedSession = {
      zombies: useGameStore.getState().zombies,
      timestamp: Date.now(),
      position: useLocationStore.getState().position,
    };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(state));
  }

  async function restoreSession(): Promise<boolean> {
    try {
      const saved = await AsyncStorage.getItem(SESSION_KEY);
      if (!saved) return false;

      const state: SavedSession = JSON.parse(saved);
      const elapsed = Date.now() - state.timestamp;

      if (elapsed > SESSION_RESUME_THRESHOLD) {
        // Too long - fresh reset
        resetSession();
        await AsyncStorage.removeItem(SESSION_KEY);
        return false;
      } else if (state.zombies.length > 0) {
        // Resume with extrapolated zombies
        setZombies(state.zombies);
        return true;
      }
      return true;
    } catch {
      // Invalid saved state
      await AsyncStorage.removeItem(SESSION_KEY);
      return false;
    }
  }
}
