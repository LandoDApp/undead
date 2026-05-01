import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { Button, Input } from '@/components/ui';
import { colors, spacing, fontSize, fontFamily, borderRadius } from '@/theme';
import type { ClanType } from '@undead/shared';

const CLANS: { id: ClanType; name: string; subtitle: string; color: string; letter: string }[] = [
  { id: 'glut', name: 'Glut', subtitle: 'Orden der Flamme', color: colors.clanGlut, letter: 'G' },
  { id: 'frost', name: 'Frost', subtitle: 'Bund des Eises', color: colors.clanFrost, letter: 'F' },
  { id: 'hain', name: 'Hain', subtitle: 'H\u00fcter des Hains', color: colors.clanHain, letter: 'H' },
];

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedClan, setSelectedClan] = useState<ClanType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const signUp = useAuthStore((s) => s.signUp);

  const handleRegister = async () => {
    if (!email.includes('@')) {
      setError('Bitte gib eine g\u00fcltige E-Mail ein');
      return;
    }
    if (displayName.length < 2) {
      setError('Name muss mindestens 2 Zeichen haben');
      return;
    }
    if (!selectedClan) {
      setError('W\u00e4hle einen Clan');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const success = await signUp(email, displayName);
      if (success) {
        // Set clan after successful registration
        await useAuthStore.getState().setClan(selectedClan);
        router.replace('/(auth)/login');
      } else {
        setError('Registrierung fehlgeschlagen');
      }
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Account erstellen</Text>
        <Text style={styles.subtitle}>W{'\u00e4'}hle einen Namen und deinen Clan</Text>

        <View style={styles.form}>
          <Input
            label="Anzeigename"
            placeholder="z.B. Ghoul_Slayer_42"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="none"
          />
          <Input
            label="E-Mail"
            placeholder="deine@email.de"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={error}
          />
        </View>

        {/* Clan selection */}
        <Text style={styles.clanHeading}>Clan w{'\u00e4'}hlen</Text>
        <View style={styles.clanRow}>
          {CLANS.map((clan) => {
            const isSelected = selectedClan === clan.id;
            return (
              <TouchableOpacity
                key={clan.id}
                style={[
                  styles.clanCard,
                  { borderColor: isSelected ? clan.color : colors.gold + '30' },
                  isSelected && { backgroundColor: clan.color + '20' },
                ]}
                onPress={() => setSelectedClan(clan.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.clanCircle, { backgroundColor: clan.color }]}>
                  <Text style={styles.clanLetter}>{clan.letter}</Text>
                </View>
                <Text style={[styles.clanName, { color: isSelected ? clan.color : colors.text }]}>
                  {clan.name}
                </Text>
                <Text style={styles.clanSubtitle}>{clan.subtitle}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button title="Registrieren" onPress={handleRegister} loading={loading} />

        <Button
          title="Bereits registriert? Einloggen"
          variant="outline"
          onPress={() => router.back()}
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: 10,
    fontFamily: fontFamily.heading,
    color: colors.gold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  clanHeading: {
    fontSize: 8,
    fontFamily: fontFamily.heading,
    color: colors.gold,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  clanRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  clanCard: {
    flex: 1,
    backgroundColor: colors.parchment,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  clanCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  clanLetter: {
    color: colors.text,
    fontSize: 10,
    fontFamily: fontFamily.heading,
  },
  clanName: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    fontWeight: '700',
  },
  clanSubtitle: {
    fontSize: 11,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
