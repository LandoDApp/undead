import Constants from 'expo-constants';
import type {
  ApiResponse,
  ZombieNearbyResponse,
  ZombieRouteResponse,
  ZombieRouteRequest,
  ZombieCatchRequest,
  ZombieCatchResponse,
  PlayerPositionUpdate,
  PlayerHealthState,
  SafeZone,
  SafeZonePresence,
  Meetup,
  Friend,
  LegalPage,
  PlayerProfile,
} from '@undead/shared';
import { getToken } from './token-storage';

/**
 * 👉 WICHTIG:
 * Verwende IMMER deine echte LAN-IP im Development.
 * Alles andere (localhost, debuggerHost) ist in deinem Setup fehleranfällig.
 */
function getApiUrl(): string {
  const envUrl = Constants.expoConfig?.extra?.apiUrl;

  if (envUrl && envUrl !== 'http://localhost:3000') {
    return envUrl;
  }

  // Fallback: stabile lokale Netzwerk-IP (dein PC im WLAN)
  return 'http://192.168.178.45:3000';
}

const API_URL = getApiUrl();

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Fastify expects a valid JSON body when Content-Type is application/json.
  // If method is not GET/HEAD and no body was provided, send empty object.
  const method = (options.method || 'GET').toUpperCase();
  const needsBody = method !== 'GET' && method !== 'HEAD' && !options.body;
  const body = needsBody ? '{}' : options.body;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body,
  });

  return res.json();
}

// ==========================
// API
// ==========================

export const api = {
  auth: {
    signUp: (email: string, displayName: string) =>
      request('/api/auth/sign-up', {
        method: 'POST',
        body: JSON.stringify({ email, name: displayName }),
      }),

    sendMagicLink: (email: string) =>
      request('/api/auth/mobile-magic-link/send', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    verifyMagicLink: (email: string, token: string) =>
      request<{ token: string }>('/api/auth/mobile-magic-link/verify', {
        method: 'POST',
        body: JSON.stringify({ email, token }),
      }),

    getSession: () => request('/api/auth/get-session'),

    signOut: () =>
      request('/api/auth/sign-out', {
        method: 'POST',
      }),

    deleteUser: () =>
      request('/api/auth/delete-user', {
        method: 'DELETE',
      }),

    devLogin: (email: string) =>
      request<{ token: string }>('/api/auth/dev-login', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
  },

  player: {
    updatePosition: (data: PlayerPositionUpdate) =>
      request('/api/player/position', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    getProfile: () =>
      request<PlayerProfile>('/api/player/profile'),

    updateProfile: (displayName: string) =>
      request('/api/player/profile', {
        method: 'PATCH',
        body: JSON.stringify({ displayName }),
      }),

    registerPushToken: (token: string, platform: 'android' | 'ios') =>
      request('/api/player/push-token', {
        method: 'POST',
        body: JSON.stringify({ token, platform }),
      }),

    setInactive: () =>
      request('/api/player/inactive', {
        method: 'POST',
      }),

    getHealth: () =>
      request<PlayerHealthState>('/api/player/health'),

    revive: () =>
      request<PlayerHealthState>('/api/player/revive', {
        method: 'POST',
      }),
  },

  zombies: {
    nearby: (lat: number, lon: number) =>
      request<ZombieNearbyResponse>(`/api/zombies/nearby?lat=${lat}&lon=${lon}`),

    getRoute: (data: ZombieRouteRequest) =>
      request<ZombieRouteResponse>('/api/zombies/route', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    catch: (data: ZombieCatchRequest) =>
      request<ZombieCatchResponse>('/api/zombies/catch', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  zones: {
    getAll: () => request<SafeZone[]>('/api/zones'),

    getById: (id: string) =>
      request<SafeZone>(`/api/zones/${id}`),

    enter: (id: string) =>
      request(`/api/zones/${id}/enter`, {
        method: 'POST',
      }),

    exit: (id: string) =>
      request(`/api/zones/${id}/exit`, {
        method: 'POST',
      }),

    reconquer: (id: string) =>
      request(`/api/zones/${id}/reconquer`, {
        method: 'POST',
      }),

    suggest: (data: {
      name: string;
      latitude: number;
      longitude: number;
      radius: number;
    }) =>
      request('/api/zones/suggest', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getPresence: (id: string) =>
      request<SafeZonePresence>(`/api/zones/${id}/presence`),
  },

  meetups: {
    getAll: () => request<Meetup[]>('/api/meetups'),

    create: (data: {
      zoneId: string;
      title: string;
      scheduledAt: string;
    }) =>
      request('/api/meetups', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    checkin: (id: string, notifyBefore: number = 30) =>
      request(`/api/meetups/${id}/checkin`, {
        method: 'POST',
        body: JSON.stringify({ notifyBefore }),
      }),

    removeCheckin: (id: string) =>
      request(`/api/meetups/${id}/checkin`, {
        method: 'DELETE',
      }),

    cancel: (id: string) =>
      request(`/api/meetups/${id}`, {
        method: 'DELETE',
      }),
  },

  friends: {
    getAll: () => request<Friend[]>('/api/friends'),

    request: (friendId: string) =>
      request('/api/friends/request', {
        method: 'POST',
        body: JSON.stringify({ friendId }),
      }),

    accept: (friendId: string) =>
      request('/api/friends/accept', {
        method: 'POST',
        body: JSON.stringify({ friendId }),
      }),

    reject: (friendId: string) =>
      request('/api/friends/reject', {
        method: 'POST',
        body: JSON.stringify({ friendId }),
      }),

    remove: (friendId: string) =>
      request(`/api/friends/${friendId}`, {
        method: 'DELETE',
      }),
  },

  legal: {
    getPage: (slug: string) =>
      request<LegalPage>(`/api/legal/${slug}`),
  },

  dev: {
    reset: () =>
      request<{ message: string }>('/api/dev/reset', {
        method: 'POST',
      }),
  },
};