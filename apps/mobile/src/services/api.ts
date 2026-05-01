import Constants from 'expo-constants';
import type {
  ApiResponse,
  GhoulNearbyResponse,
  GhoulRouteResponse,
  GhoulRouteRequest,
  GhoulCatchRequest,
  GhoulCatchResponse,
  PlayerPositionUpdate,
  PlayerHealthState,
  CityState,
  CityStatePresence,
  Meetup,
  Friend,
  LegalPage,
  PlayerProfile,
  CollectiblePointsNearbyResponse,
  CollectPointResponse,
  PlayerPointsBalance,
  ResourcesNearbyResponse,
  CollectResourceResponse,
  ResourceBalance,
  ZoneHealResponse,
  ZoneUpgradeResponse,
  Bastion,
  BastionHealResponse,
  BastionUpgradeResponse,
  BastionReinforceResponse,
  BastionNearbyResponse,
  BastionIdleState,
  BastionCollectResponse,
  BastionWorker,
  BastionWorkerUpgradeResponse,
  WorkerType,
  Quest,
  QuestListResponse,
  QuestClaimResponse,
  DailyStreak,
  DailyVision,
  ClanType,
} from '@undead/shared';
import { getToken } from './token-storage';

/**
 * In __DEV__ (npx expo run:android) → lokale LAN-IP, kein Tunnel nötig.
 * In Production → Tunnel-/Cloud-URL aus app.config.ts extra.apiUrl.
 */
function getApiUrl(): string {
  if (__DEV__) {
    return 'http://192.168.178.45:3000';
  }

  return Constants.expoConfig?.extra?.apiUrl ?? 'http://192.168.178.45:3000';
}

const API_URL = getApiUrl();

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
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

    getClan: () =>
      request<{ clan: ClanType | null }>('/api/player/clan'),

    setClan: (clan: ClanType) =>
      request<{ clan: ClanType }>('/api/player/clan', {
        method: 'POST',
        body: JSON.stringify({ clan }),
      }),
  },

  ghouls: {
    nearby: (lat: number, lon: number) =>
      request<GhoulNearbyResponse>(`/api/ghouls/nearby?lat=${lat}&lon=${lon}`),

    getRoute: (data: GhoulRouteRequest) =>
      request<GhoulRouteResponse>('/api/ghouls/route', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    catch: (data: GhoulCatchRequest) =>
      request<GhoulCatchResponse>('/api/ghouls/catch', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  cityStates: {
    getAll: () => request<CityState[]>('/api/city-states'),

    getById: (id: string) =>
      request<CityState>(`/api/city-states/${id}`),

    enter: (id: string) =>
      request(`/api/city-states/${id}/enter`, {
        method: 'POST',
      }),

    exit: (id: string) =>
      request(`/api/city-states/${id}/exit`, {
        method: 'POST',
      }),

    reconquer: (id: string) =>
      request(`/api/city-states/${id}/reconquer`, {
        method: 'POST',
      }),

    suggest: (data: {
      name: string;
      latitude: number;
      longitude: number;
      radius: number;
    }) =>
      request('/api/city-states/suggest', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getPresence: (id: string) =>
      request<CityStatePresence>(`/api/city-states/${id}/presence`),

    heal: (id: string, amount: number) =>
      request<ZoneHealResponse>(`/api/city-states/${id}/heal`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      }),

    upgrade: (id: string) =>
      request<ZoneUpgradeResponse>(`/api/city-states/${id}/upgrade`, {
        method: 'POST',
      }),
  },

  resources: {
    nearby: (lat: number, lon: number) =>
      request<ResourcesNearbyResponse>(`/api/resources/nearby?lat=${lat}&lon=${lon}`),

    collect: (resourceId: string, playerLat: number, playerLon: number) =>
      request<CollectResourceResponse>('/api/resources/collect', {
        method: 'POST',
        body: JSON.stringify({ resourceId, playerLat, playerLon }),
      }),

    getBalance: () =>
      request<ResourceBalance>('/api/resources/balance'),
  },

  /** @deprecated Use resources instead */
  points: {
    nearby: (lat: number, lon: number) =>
      request<CollectiblePointsNearbyResponse>(`/api/points/nearby?lat=${lat}&lon=${lon}`),

    collect: (pointId: string, playerLat: number, playerLon: number) =>
      request<CollectPointResponse>('/api/points/collect', {
        method: 'POST',
        body: JSON.stringify({ pointId, playerLat, playerLon }),
      }),

    getBalance: () =>
      request<PlayerPointsBalance>('/api/points/balance'),
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

  bastion: {
    get: () =>
      request<Bastion>('/api/bastion'),

    create: (data: { name: string; latitude: number; longitude: number }) =>
      request<Bastion>('/api/bastion', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    upgrade: () =>
      request<{ bastion: Bastion; crystalsSpent: number; newBalance: ResourceBalance }>('/api/bastion/upgrade', {
        method: 'POST',
      }),

    heal: (amount: number) =>
      request<BastionHealResponse>('/api/bastion/heal', {
        method: 'POST',
        body: JSON.stringify({ amount }),
      }),

    reinforce: (bastionId: string) =>
      request<BastionReinforceResponse>(`/api/bastion/${bastionId}/reinforce`, {
        method: 'POST',
      }),

    nearby: (lat: number, lon: number) =>
      request<BastionNearbyResponse>(`/api/bastion/nearby?lat=${lat}&lon=${lon}`),

    getIdleState: () =>
      request<BastionIdleState>('/api/bastion/idle'),

    collect: () =>
      request<BastionCollectResponse>('/api/bastion/collect', {
        method: 'POST',
      }),

    assignWorker: (workerType: WorkerType) =>
      request<BastionWorker>('/api/bastion/workers', {
        method: 'POST',
        body: JSON.stringify({ workerType }),
      }),

    removeWorker: (workerId: string) =>
      request(`/api/bastion/workers/${workerId}`, {
        method: 'DELETE',
      }),

    upgradeWorker: (workerId: string) =>
      request<BastionWorkerUpgradeResponse>(`/api/bastion/workers/${workerId}/upgrade`, {
        method: 'POST',
      }),
  },

  quests: {
    getAll: () =>
      request<QuestListResponse>('/api/quests'),

    claim: (questId: string) =>
      request<QuestClaimResponse>(`/api/quests/${questId}/claim`, {
        method: 'POST',
      }),
  },

  streak: {
    get: () =>
      request<DailyStreak>('/api/player/streak'),

    useFreeze: () =>
      request<DailyStreak>('/api/player/streak/freeze', {
        method: 'POST',
      }),
  },

  vision: {
    get: () =>
      request<DailyVision>('/api/player/vision'),

    draw: () =>
      request<DailyVision>('/api/player/vision/draw', {
        method: 'POST',
      }),
  },

  steps: {
    report: (steps: number) =>
      request('/api/player/steps', {
        method: 'POST',
        body: JSON.stringify({ steps }),
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
