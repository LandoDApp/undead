import { create } from 'zustand';
import type { ZombieState, TimeOfDay, ZombieCatchResponse } from '@undead/shared';
import { PLAYER_MAX_HITS } from '@undead/shared';
import { api } from '@/services/api';

interface GameState {
  zombies: ZombieState[];
  timeOfDay: TimeOfDay;
  isGameActive: boolean;
  isInSafeZone: boolean;
  currentZoneId: string | null;
  sessionStartedAt: number | null;
  isPaused: boolean;
  // Player health (synced with server)
  playerHits: number;
  isDown: boolean;
  downUntil: number | null;
  showAttackOverlay: boolean;
  setZombies: (zombies: ZombieState[]) => void;
  updateZombie: (id: string, update: Partial<ZombieState>) => void;
  removeZombie: (id: string) => void;
  addZombie: (zombie: ZombieState) => void;
  setTimeOfDay: (time: TimeOfDay) => void;
  setInSafeZone: (inZone: boolean, zoneId?: string | null) => void;
  /** Player presses "Start" — begin spawning zombies */
  startGame: () => void;
  /** Stop the game — clear zombies, go back to lobby */
  stopGame: () => void;
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  resetSession: () => void;
  /** Apply server catch response to local state */
  applyServerHit: (result: ZombieCatchResponse) => void;
  revivePlayer: () => void;
  dismissAttackOverlay: () => void;
  /** Fetch health state from server on session start */
  syncHealth: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  zombies: [],
  timeOfDay: 'day',
  isGameActive: false,
  isInSafeZone: false,
  currentZoneId: null,
  sessionStartedAt: null,
  isPaused: false,
  playerHits: 0,
  isDown: false,
  downUntil: null,
  showAttackOverlay: false,

  setZombies: (zombies) => set({ zombies }),

  updateZombie: (id, update) =>
    set((state) => ({
      zombies: state.zombies.map((z) => (z.id === id ? { ...z, ...update } : z)),
    })),

  removeZombie: (id) =>
    set((state) => ({
      zombies: state.zombies.filter((z) => z.id !== id),
    })),

  addZombie: (zombie) =>
    set((state) => ({
      zombies: [...state.zombies, zombie],
    })),

  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),

  setInSafeZone: (isInSafeZone, zoneId = null) => set({ isInSafeZone, currentZoneId: zoneId }),

  startGame: () => set({ isGameActive: true, sessionStartedAt: Date.now(), isPaused: false }),

  stopGame: () =>
    set({
      isGameActive: false,
      zombies: [],
      sessionStartedAt: null,
      playerHits: 0,
      isDown: false,
      downUntil: null,
      showAttackOverlay: false,
    }),

  startSession: () => set({ sessionStartedAt: Date.now(), isPaused: false }),

  pauseSession: () => set({ isPaused: true }),

  resumeSession: () => set({ isPaused: false }),

  resetSession: () =>
    set({
      zombies: [],
      sessionStartedAt: Date.now(),
      isPaused: false,
      playerHits: 0,
      isDown: false,
      downUntil: null,
      showAttackOverlay: false,
    }),

  applyServerHit: (result: ZombieCatchResponse) => {
    if (!result.hit) return; // Server rejected the catch

    if (result.isDown) {
      set({
        playerHits: result.totalHits,
        isDown: true,
        downUntil: result.downUntil,
        showAttackOverlay: true,
        zombies: get().zombies.map((z) => ({ ...z, frozen: true })),
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
      zombies: state.isInSafeZone
        ? state.zombies
        : state.zombies.map((z) => ({ ...z, frozen: false })),
    }));
  },

  dismissAttackOverlay: () => set({ showAttackOverlay: false }),

  syncHealth: () => {
    api.player.getHealth().then((res) => {
      if (res.success && res.data) {
        const { hits, isDown, downUntil } = res.data;
        set({ playerHits: hits, isDown, downUntil });
        if (isDown) {
          set({ zombies: get().zombies.map((z) => ({ ...z, frozen: true })) });
        }
      }
    });
  },
}));
