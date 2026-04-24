import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui';
import { colors, spacing, fontSize } from '@/theme';

export default function ProfileScreen() {
  const { user, signOut, deleteAccount } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const handleDelete = () => {
    Alert.alert(
      'Account löschen',
      'Bist du sicher? Alle deine Daten werden unwiderruflich gelöscht.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            await deleteAccount();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profil</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Anzeigename</Text>
        <Text style={styles.value}>{user?.displayName || 'Unbekannt'}</Text>

        <Text style={[styles.label, { marginTop: spacing.md }]}>E-Mail</Text>
        <Text style={styles.value}>{user?.email || '-'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rechtliches</Text>
        <Button
          title="Impressum"
          variant="outline"
          onPress={() => router.push('/(legal)/impressum')}
        />
        <Button
          title="AGB"
          variant="outline"
          onPress={() => router.push('/(legal)/agb')}
          style={{ marginTop: spacing.sm }}
        />
        <Button
          title="Datenschutz"
          variant="outline"
          onPress={() => router.push('/(legal)/datenschutz')}
          style={{ marginTop: spacing.sm }}
        />
      </View>

      <View style={styles.section}>
        <Button title="Ausloggen" variant="outline" onPress={handleSignOut} />
        <Button
          title="Account löschen"
          variant="danger"
          onPress={handleDelete}
          style={{ marginTop: spacing.sm }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
    paddingTop: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  value: {
    fontSize: fontSize.lg,
    color: colors.text,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
});
