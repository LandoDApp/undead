import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSocialStore } from '@/stores/social';
import { useZoneStore } from '@/stores/zone';
import { MeetupCard } from '@/components/social/MeetupCard';
import { FriendCard } from '@/components/social/FriendCard';
import { Button, Input } from '@/components/ui';
import { colors, spacing, fontSize } from '@/theme';

type Tab = 'meetups' | 'friends';

export default function SocialScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('meetups');
  const [friendIdInput, setFriendIdInput] = useState('');
  const [meetupTitle, setMeetupTitle] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const {
    friends,
    meetups,
    isLoadingFriends,
    isLoadingMeetups,
    isUpdating,
    fetchFriends,
    fetchMeetups,
    sendFriendRequest,
    createMeetup,
  } = useSocialStore();
  const { zones, fetchZones } = useZoneStore();

  useEffect(() => {
    fetchMeetups();
    fetchFriends();
    fetchZones();
  }, []);

  useEffect(() => {
    if (!selectedZoneId && zones.length > 0) {
      setSelectedZoneId(zones[0].id);
    }
  }, [zones, selectedZoneId]);

  const handleFriendRequest = async () => {
    const friendId = friendIdInput.trim();
    if (!friendId) {
      Alert.alert('Hinweis', 'Bitte gib eine Friend-ID ein.');
      return;
    }
    const ok = await sendFriendRequest(friendId);
    if (!ok) {
      Alert.alert('Fehler', 'Freundschaftsanfrage konnte nicht gesendet werden.');
      return;
    }
    setFriendIdInput('');
    Alert.alert('Gesendet', 'Freundschaftsanfrage wurde versendet.');
  };

  const handleCreateMeetup = async () => {
    if (meetupTitle.trim().length < 3) {
      Alert.alert('Hinweis', 'Der Meetup-Titel muss mindestens 3 Zeichen haben.');
      return;
    }
    if (!selectedZoneId) {
      Alert.alert('Hinweis', 'Bitte waehle eine Safe Zone aus.');
      return;
    }

    const scheduledDate = scheduledAt.trim()
      ? new Date(scheduledAt.trim())
      : new Date(Date.now() + 2 * 60 * 60 * 1000);

    if (Number.isNaN(scheduledDate.getTime())) {
      Alert.alert('Hinweis', 'Zeitformat ungueltig. Nutze ISO, z.B. 2026-04-20T16:00:00Z');
      return;
    }

    const ok = await createMeetup({
      zoneId: selectedZoneId,
      title: meetupTitle.trim(),
      scheduledAt: scheduledDate.toISOString(),
    });

    if (!ok) {
      Alert.alert('Fehler', 'Meetup konnte nicht erstellt werden.');
      return;
    }
    setMeetupTitle('');
    setScheduledAt('');
    Alert.alert('Gespeichert', 'Meetup wurde erstellt.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Community</Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'meetups' && styles.tabActive]}
          onPress={() => setActiveTab('meetups')}
        >
          <Text style={[styles.tabText, activeTab === 'meetups' && styles.tabTextActive]}>
            Meetups
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
            Freunde
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'meetups' ? (
        <View style={styles.meetupsContainer}>
          <View style={styles.createMeetupCard}>
            <Text style={styles.addFriendTitle}>Meetup erstellen</Text>
            <Input
              value={meetupTitle}
              onChangeText={setMeetupTitle}
              placeholder="Titel (z.B. Samstag Laufrunde)"
            />
            <Text style={styles.zoneLabel}>Safe Zone</Text>
            <View style={styles.zoneWrap}>
              {zones.slice(0, 6).map((zone) => (
                <TouchableOpacity
                  key={zone.id}
                  onPress={() => setSelectedZoneId(zone.id)}
                  style={[
                    styles.zoneChip,
                    selectedZoneId === zone.id && styles.zoneChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.zoneChipText,
                      selectedZoneId === zone.id && styles.zoneChipTextActive,
                    ]}
                  >
                    {zone.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input
              value={scheduledAt}
              onChangeText={setScheduledAt}
              placeholder="Zeit optional (ISO), sonst +2h"
              autoCapitalize="none"
            />
            <Button
              title="Meetup anlegen"
              onPress={handleCreateMeetup}
              disabled={isUpdating}
              style={styles.addFriendButton}
            />
          </View>

          <FlatList
            data={meetups}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MeetupCard meetup={item} />}
            contentContainerStyle={styles.list}
            refreshing={isLoadingMeetups}
            onRefresh={fetchMeetups}
            ListEmptyComponent={<Text style={styles.emptyText}>Keine Meetups verfuegbar.</Text>}
          />
        </View>
      ) : (
        <View style={styles.friendsContainer}>
          <View style={styles.addFriendCard}>
            <Text style={styles.addFriendTitle}>Freund hinzufuegen</Text>
            <Input
              value={friendIdInput}
              onChangeText={setFriendIdInput}
              placeholder="Friend-ID"
              autoCapitalize="none"
            />
            <Button
              title="Anfrage senden"
              onPress={handleFriendRequest}
              disabled={isUpdating}
              style={styles.addFriendButton}
            />
          </View>

          <FlatList
            data={friends}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <FriendCard friend={item} />}
            contentContainerStyle={styles.list}
            refreshing={isLoadingFriends}
            onRefresh={fetchFriends}
            ListEmptyComponent={<Text style={styles.emptyText}>Noch keine Freunde.</Text>}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    padding: spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  list: {
    padding: spacing.md,
    gap: spacing.md,
  },
  friendsContainer: {
    flex: 1,
  },
  meetupsContainer: {
    flex: 1,
  },
  addFriendCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
    padding: spacing.md,
  },
  createMeetupCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
    padding: spacing.md,
  },
  zoneLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  zoneWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  zoneChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  zoneChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '22',
  },
  zoneChipText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  zoneChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  addFriendTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  addFriendButton: {
    marginTop: spacing.sm,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
