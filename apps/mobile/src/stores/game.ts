import { create } from 'zustand';
import type { GhoulState, TimeOfDay, GhoulCatchResponse, GameMode } from '@undead/shared';
import { PLAYER_MAX_HITS } from '@undead/shared';
import { api } from '@/services/api';

interface GameState {
  ghouls: GhoulState[];
  timeOfDay: TimeOfDay;
  isGameActive: boolean;
  isInCityState: boolean;
  currentZoneId: string | null;
  // Player health (synced with server)
  playerHits: number;
  isDown: boolean;
  downUntil: number | null;
  showAttackOverlay: boolean;
  gameMode: GameMode;
  isExitingJagd: boolean;
  exitJagdCountdown: number;
  setGameMode: (mode: GameMode) => void;
  setGhouls: (ghouls: GhoulState[]) => void;
  updateGhoul: (id: string, update: Partial<GhoulState>) => void;
  removeGhoul: (id: string) => void;
  addGhoul: (ghoul: GhoulState) => void;
  setTimeOfDay: (time: TimeOfDay) => void;
  setInCityState: (inZone: boolean, zoneId?: string | null) => void;
  setGameActive: (active: boolean) => void;
  /** Enter Jagd mode — ghouls start spawning */
  enterJagd: () => void;
  /** Exit Jagd mode with 3s cooldown */
  exitJagd: () => void;
  /** Apply server catch response to local state */
  applyServerHit: (result: GhoulCatchResponse) => void;
  revivePlayer: () => void;
  dismissAttackOverlay: () => void;
  /** Fetch health state from server on session start */
  syncHealth: () => void;
}

let exitJagdTimer: ReturnType<typeof setInterval> | null = null;

export const useGameStore = create<GameState>((set, get) => ({
  ghouls: [],
  timeOfDay: 'day',
  isGameActive: true,
  isInCityState: false,
  currentZoneId: null,
  playerHits: 0,
  isDown: false,
  downUntil: null,
  showAttackOverlay: false,
  gameMode: 'wandel',
  isExitingJagd: false,
  exitJagdCountdown: 0,

  setGameMode: (gameMode) => set({ gameMode }),

  setGhouls: (ghouls) => set({ ghouls }),

  updateGhoul: (id, update) =>
    set((state) => ({
      ghouls: state.ghouls.map((g) => (g.id === id ? { ...g, ...update } : g)),
    })),

  removeGhoul: (id) =>
    set((state) => ({
      ghouls: state.ghouls.filter((g) => g.id !== id),
    })),

  addGhoul: (ghoul) =>
    set((state) => ({
      ghouls: [...state.ghouls, ghoul],
    })),

  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),

  setInCityState: (isInCityState, zoneId = null) => set({ isInCityState, currentZoneId: zoneId }),

  setGameActive: (isGameActive) => set({ isGameActive }),

  enterJagd: () => {
    // Clear any pending exit timer
    if (exitJagdTimer) {
      clearInterval(exitJagdTimer);
      exitJagdTimer = null;
    }
    set({ gameMode: 'jagd', isExitingJagd: false, exitJagdCountdown: 0 });
  },

  exitJagd: () => {
    if (get().isExitingJagd) return;

    set({ isExitingJagd: true, exitJagdCountdown: 3 });

    exitJagdTimer = setInterval(() => {
      const current = get().exitJagdCountdown;
      if (current <= 1) {
        if (exitJagdTimer) {
          clearInterval(exitJagdTimer);
          exitJagdTimer = null;
        }
        set({
          gameMode: 'wandel',
          isExitingJagd: false,
          exitJagdCountdown: 0,
          ghouls: [],
        });
      } else {
        set({ exitJagdCountdown: current - 1 });
      }
    }, 1000);
  },

  applyServerHit: (result: GhoulCatchResponse) => {
    if (!result.hit) return; // Server rejected the catch

    if (result.isDown) {
      set({
        playerHits: result.totalHits,
        isDown: true,
        downUntil: result.downUntil,
        showAttackOverlay: true,
        ghouls: get().ghouls.map((g) => ({ ...g, frozen: true })),
      });
    } else {
      set({
        playerHits: result.totalHits,
        showAttackOverlay: true,
      });
    }
  },

  revivePlayer: () => {
    // Tell server we're reviving
    api.player.revive().catch(() => {});
    set((state) => ({
      playerHits: 0,
      isDown: false,
      downUntil: null,
      showAttackOverlay: false,
      ghouls: state.isInCityState
        ? state.ghouls
        : state.ghouls.map((g) => ({ ...g, frozen: false })),
    }));
  },

  dismissAttackOverlay: () => set({ showAttackOverlay: false }),

  syncHealth: () => {
    api.player.getHealth().then((res) => {
      if (res.success && res.data) {
        const { hits, isDown, downUntil } = res.data;
        set({ playerHits: hits, isDown, downUntil });
        if (isDown) {
          set({ ghouls: get().ghouls.map((g) => ({ ...g, frozen: true })) });
        }
      }
    });
  },
}));
