export interface Meetup {
  id: string;
  creatorId: string;
  creatorName: string;
  zoneId: string;
  zoneName: string;
  title: string;
  scheduledAt: string;
  isActive: boolean;
  checkinCount: number;
  createdAt: string;
}

export interface CreateMeetupRequest {
  zoneId: string;
  title: string;
  scheduledAt: string;
}

export interface MeetupCheckin {
  meetupId: string;
  notifyBefore: number; // minutes before to send push notification
}

export type FriendStatus = 'pending' | 'accepted' | 'rejected';

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  displayName: string;
  status: FriendStatus;
  lastSeenAt: string | null;
  lastZoneName: string | null;
  createdAt: string;
}

export interface FriendRequest {
  friendId: string;
}
