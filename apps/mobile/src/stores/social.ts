import { create } from 'zustand';
import type { Friend, Meetup } from '@undead/shared';
import { api } from '@/services/api';

interface SocialState {
  friends: Friend[];
  meetups: Meetup[];
  isLoadingFriends: boolean;
  isLoadingMeetups: boolean;
  isUpdating: boolean;
  fetchFriends: () => Promise<void>;
  fetchMeetups: () => Promise<void>;
  createMeetup: (data: { zoneId: string; title: string; scheduledAt: string }) => Promise<boolean>;
  checkInMeetup: (meetupId: string) => Promise<boolean>;
  removeMeetupCheckIn: (meetupId: string) => Promise<boolean>;
  cancelMeetup: (meetupId: string) => Promise<boolean>;
  sendFriendRequest: (friendId: string) => Promise<boolean>;
  acceptFriend: (friendId: string) => Promise<boolean>;
  rejectFriend: (friendId: string) => Promise<boolean>;
  removeFriend: (friendId: string) => Promise<boolean>;
}

export const useSocialStore = create<SocialState>((set) => ({
  friends: [],
  meetups: [],
  isLoadingFriends: false,
  isLoadingMeetups: false,
  isUpdating: false,

  fetchFriends: async () => {
    set({ isLoadingFriends: true });
    try {
      const res = await api.friends.getAll();
      if (res.success && res.data) {
        set({ friends: res.data as Friend[] });
      }
    } finally {
      set({ isLoadingFriends: false });
    }
  },

  fetchMeetups: async () => {
    set({ isLoadingMeetups: true });
    try {
      const res = await api.meetups.getAll();
      if (res.success && res.data) {
        set({ meetups: res.data as Meetup[] });
      }
    } finally {
      set({ isLoadingMeetups: false });
    }
  },

  createMeetup: async (data) => {
    set({ isUpdating: true });
    try {
      const res = await api.meetups.create(data);
      if (!res.success) return false;
      await useSocialStore.getState().fetchMeetups();
      return true;
    } finally {
      set({ isUpdating: false });
    }
  },

  checkInMeetup: async (meetupId) => {
    set({ isUpdating: true });
    try {
      const res = await api.meetups.checkin(meetupId);
      if (!res.success) return false;
      await useSocialStore.getState().fetchMeetups();
      return true;
    } finally {
      set({ isUpdating: false });
    }
  },

  removeMeetupCheckIn: async (meetupId) => {
    set({ isUpdating: true });
    try {
      const res = await api.meetups.removeCheckin(meetupId);
      if (!res.success) return false;
      await useSocialStore.getState().fetchMeetups();
      return true;
    } finally {
      set({ isUpdating: false });
    }
  },

  cancelMeetup: async (meetupId) => {
    set({ isUpdating: true });
    try {
      const res = await api.meetups.cancel(meetupId);
      if (!res.success) return false;
      await useSocialStore.getState().fetchMeetups();
      return true;
    } finally {
      set({ isUpdating: false });
    }
  },

  sendFriendRequest: async (friendId) => {
    set({ isUpdating: true });
    try {
      const res = await api.friends.request(friendId);
      if (!res.success) return false;
      await useSocialStore.getState().fetchFriends();
      return true;
    } finally {
      set({ isUpdating: false });
    }
  },

  acceptFriend: async (friendId) => {
    set({ isUpdating: true });
    try {
      const res = await api.friends.accept(friendId);
      if (!res.success) return false;
      await useSocialStore.getState().fetchFriends();
      return true;
    } finally {
      set({ isUpdating: false });
    }
  },

  rejectFriend: async (friendId) => {
    set({ isUpdating: true });
    try {
      const res = await api.friends.reject(friendId);
      if (!res.success) return false;
      await useSocialStore.getState().fetchFriends();
      return true;
    } finally {
      set({ isUpdating: false });
    }
  },

  removeFriend: async (friendId) => {
    set({ isUpdating: true });
    try {
      const res = await api.friends.remove(friendId);
      if (!res.success) return false;
      await useSocialStore.getState().fetchFriends();
      return true;
    } finally {
      set({ isUpdating: false });
    }
  },
}));
