import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { Meetup } from '@undead/shared';
import { Button } from '@/components/ui';
import { useSocialStore } from '@/stores/social';
import { borderRadius, colors, fontSize, spacing } from '@/theme';

interface MeetupCardProps {
  meetup: Meetup;
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return `${date.toLocaleDateString('de-DE')} ${date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export function MeetupCard({ meetup }: MeetupCardProps) {
  const { isUpdating, checkInMeetup, removeMeetupCheckIn, cancelMeetup } = useSocialStore();

  const handleCheckIn = async () => {
    const ok = await checkInMeetup(meetup.id);
    if (!ok) {
      Alert.alert('Fehler', 'Check-in konnte nicht gesetzt werden.');
    }
  };

  const handleRemoveCheckIn = async () => {
    const ok = await removeMeetupCheckIn(meetup.id);
    if (!ok) {
      Alert.alert('Fehler', 'Check-in konnte nicht entfernt werden.');
    }
  };

  const handleCancel = () => {
    Alert.alert('Meetup absagen', 'Moechtest du dieses Meetup wirklich absagen?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Absagen',
        style: 'destructive',
        onPress: async () => {
          const ok = await cancelMeetup(meetup.id);
          if (!ok) {
            Alert.alert('Fehler', 'Meetup konnte nicht abgesagt werden.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{meetup.title}</Text>
        <View style={[styles.badge, meetup.isActive ? styles.badgeActive : styles.badgeInactive]}>
          <Text style={styles.badgeText}>{meetup.isActive ? 'Aktiv' : 'Inaktiv'}</Text>
        </View>
      </View>

      <Text style={styles.meta}>Zone: {meetup.zoneName}</Text>
      <Text style={styles.meta}>Von: {meetup.creatorName}</Text>
      <Text style={styles.meta}>Zeit: {formatDateTime(meetup.scheduledAt)}</Text>
      <Text style={styles.meta}>Check-ins: {meetup.checkinCount}</Text>

      <View style={styles.actions}>
        <Button
          title="Check-in"
          onPress={handleCheckIn}
          disabled={!meetup.isActive || isUpdating}
          style={styles.actionButton}
        />
        <Button
          title="Check-in entfernen"
          variant="outline"
          onPress={handleRemoveCheckIn}
          disabled={isUpdating}
          style={styles.actionButton}
        />
      </View>

      <Button
        title="Meetup absagen"
        variant="danger"
        onPress={handleCancel}
        disabled={isUpdating}
      />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  badge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeActive: {
    backgroundColor: colors.primary + '22',
  },
  badgeInactive: {
    backgroundColor: colors.textMuted + '22',
  },
  badgeText: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: '600',
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
});
