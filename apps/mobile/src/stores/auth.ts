import { create } from 'zustand';
import type { User, ClanType } from '@undead/shared';
import { api } from '@/services/api';
import * as tokenStorage from '@/services/token-storage';

interface AuthState {
  user: User | null;
  clan: ClanType | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, displayName: string) => Promise<boolean>;
  sendMagicLink: (email: string) => Promise<boolean>;
  devLogin: (email: string) => Promise<boolean>;
  checkSession: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  setToken: (token: string) => Promise<void>;
  setClan: (clan: ClanType) => Promise<boolean>;
  fetchClan: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  clan: null,
  isLoading: true,
  isAuthenticated: false,

  signUp: async (email, displayName) => {
    const res = await api.auth.signUp(email, displayName);
    return res.success ?? false;
  },

  sendMagicLink: async (email) => {
    const res = await api.auth.sendMagicLink(email);
    return res.success ?? false;
  },

  devLogin: async (email) => {
    const res = await api.auth.devLogin(email);
    const token = res.data?.token;
    if (!res.success || !token) return false;
    await tokenStorage.setToken(token);
    await useAuthStore.getState().checkSession();
    return useAuthStore.getState().isAuthenticated;
  },

  checkSession: async () => {
    set({ isLoading: true });
    try {
      const token = await tokenStorage.getToken();
      if (token) {
        const profileRes = await api.player.getProfile();
        if (profileRes.success && profileRes.data) {
          set({ user: profileRes.data as any, isAuthenticated: true });
          // Fetch clan in background
          useAuthStore.getState().fetchClan();
          return;
        }
      }

      const res = await api.auth.getSession();
      if (res.success && res.data) {
        set({ user: res.data as any, isAuthenticated: true });
        useAuthStore.getState().fetchClan();
      } else {
        set({ user: null, isAuthenticated: false, clan: null });
      }
    } catch {
      set({ user: null, isAuthenticated: false, clan: null });
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    await api.auth.signOut();
    await tokenStorage.removeToken();
    set({ user: null, isAuthenticated: false, clan: null });
  },

  deleteAccount: async () => {
    await api.auth.deleteUser();
    await tokenStorage.removeToken();
    set({ user: null, isAuthenticated: false, clan: null });
  },

  setToken: async (token) => {
    await tokenStorage.setToken(token);
    await useAuthStore.getState().checkSession();
  },

  setClan: async (clan) => {
    const res = await api.player.setClan(clan);
    if (res.success) {
      set({ clan });
      return true;
    }
    return false;
  },

  fetchClan: async () => {
    try {
      const res = await api.player.getClan();
      if (res.success && res.data) {
        set({ clan: res.data.clan });
      }
    } catch {
      // Ignore fetch errors for clan
    }
  },
}));
