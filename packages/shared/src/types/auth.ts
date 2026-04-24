export interface User {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
}

export interface SignUpRequest {
  email: string;
  displayName: string;
}

export interface MagicLinkRequest {
  email: string;
}

export interface AuthResponse {
  user: User;
  session: Session;
}

export interface PushTokenRequest {
  token: string;
  platform: 'android' | 'ios';
}
