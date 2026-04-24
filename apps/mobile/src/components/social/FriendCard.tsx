import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { Friend } from '@undead/shared';
import { Button } from '@/components/ui';
import { useSocialStore } from '@/stores/social';
import { borderRadius, colors, fontSize, spacing } from '@/theme';

interface FriendCardProps {
  friend: Friend;
}

function formatLastSeen(lastSeenAt: string | null): string {
  if (!lastSeenAt) return 'Zuletzt gesehen: -';
  return `Zuletzt gesehen: ${new Date(lastSeenAt).toLocaleString('de-DE')}`;
}

export function FriendCard({ friend }: FriendCardProps) {
  const { isUpdating, acceptFriend, rejectFriend, removeFriend } = useSocialStore();

  const handleAccept = async () => {
    const ok = await acceptFriend(friend.friendId);
    if (!ok) Alert.alert('Fehler', 'Anfrage konnte nicht angenommen werden.');
  };

  const handleReject = async () => {
    const ok = await rejectFriend(friend.friendId);
    if (!ok) Alert.alert('Fehler', 'Anfrage konnte nicht abgelehnt werden.');
  };

  const handleRemove = () => {
    Alert.alert('Freund entfernen', 'Moechtest du diese Freundschaft entfernen?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Entfernen',
        style: 'destructive',
        onPress: async () => {
          const ok = await removeFriend(friend.friendId);
          if (!ok) Alert.alert('Fehler', 'Freund konnte nicht entfernt werden.');
        },
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{friend.displayName}</Text>
        <Text
          style={[
            styles.status,
            friend.status === 'accepted'
              ? styles.accepted
              : friend.status === 'pending'
              ? styles.pending
              : styles.rejected,
          ]}
        >
          {friend.status}
        </Text>
      </View>

      <Text style={styles.meta}>{formatLastSeen(friend.lastSeenAt)}</Text>
      <Text style={styles.meta}>Letzte Zone: {friend.lastZoneName ?? '-'}</Text>

      {friend.status === 'pending' ? (
        <View style={styles.actions}>
          <Button
            title="Annehmen"
            onPress={handleAccept}
            disabled={isUpdating}
            style={styles.actionButton}
          />
          <Button
            title="Ablehnen"
            variant="outline"
            onPress={handleReject}
            disabled={isUpdating}
            style={styles.actionButton}
          />
        </View>
      ) : friend.status === 'accepted' ? (
        <Button
          title="Freund entfernen"
          variant="danger"
          onPress={handleRemove}
          disabled={isUpdating}
          style={styles.removeButton}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  status: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  accepted: {
    color: colors.primary,
  },
  pending: {
    color: colors.warning,
  },
  rejected: {
    color: colors.danger,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  removeButton: {
    marginTop: spacing.sm,
  },
});
