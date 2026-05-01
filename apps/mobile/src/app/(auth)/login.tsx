import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { Button, Input } from '@/components/ui';
import { colors, spacing, fontSize, fontFamily } from '@/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sendMagicLink = useAuthStore((s) => s.sendMagicLink);
  const devLogin = useAuthStore((s) => s.devLogin);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(game)');
    }
  }, [isAuthenticated]);

  const handleSendLink = async () => {
    if (!email.includes('@')) {
      setError('Bitte gib eine g\u00fcltige E-Mail ein');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const success = await sendMagicLink(email);
      if (success) {
        setSent(true);
      } else {
        setError('Fehler beim Senden. Versuche es erneut.');
      }
    } catch {
      setError('Netzwerkfehler. Bitte pr\u00fcfe deine Verbindung.');
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    if (!email.includes('@')) {
      setError('Bitte gib eine g\u00fcltige E-Mail ein');
      return;
    }
    setError('');
    setDevLoading(true);
    try {
      const success = await devLogin(email);
      if (success) {
        router.replace('/(game)');
      } else {
        setError('Dev-Login fehlgeschlagen. Pr\u00fcfe, ob der Account existiert.');
      }
    } catch {
      setError('Dev-Login fehlgeschlagen.');
    } finally {
      setDevLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Check deine Mails</Text>
        <Text style={styles.subtitle}>
          Wir haben dir einen Login-Link an {email} geschickt.
        </Text>
        <Button
          title="Andere E-Mail verwenden"
          variant="outline"
          onPress={() => setSent(false)}
          style={{ marginTop: spacing.lg }}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Undead</Text>
      <Text style={styles.subtitle}>Melde dich an oder erstelle einen Account</Text>

      <View style={styles.form}>
        <Input
          label="E-Mail"
          placeholder="deine@email.de"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={error}
        />
        <Button title="Magic Link senden" onPress={handleSendLink} loading={loading} />
        <Button
          title="Intern testen (Dev Login)"
          variant="outline"
          onPress={handleDevLogin}
          loading={devLoading}
        />
      </View>

      <Button
        title="Neu hier? Registrieren"
        variant="outline"
        onPress={() => router.push('/(auth)/register')}
        style={{ marginTop: spacing.md }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 14,
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
  },
});
