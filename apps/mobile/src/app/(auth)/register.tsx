import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { Button, Input } from '@/components/ui';
import { colors, spacing, fontSize } from '@/theme';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const signUp = useAuthStore((s) => s.signUp);

  const handleRegister = async () => {
    if (!email.includes('@')) {
      setError('Bitte gib eine gültige E-Mail ein');
      return;
    }
    if (displayName.length < 2) {
      setError('Name muss mindestens 2 Zeichen haben');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const success = await signUp(email, displayName);
      if (success) {
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
      <Text style={styles.title}>Account erstellen</Text>
      <Text style={styles.subtitle}>Wähle einen Anzeigenamen für andere Spieler</Text>

      <View style={styles.form}>
        <Input
          label="Anzeigename"
          placeholder="z.B. Zombie_Slayer_42"
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
        <Button title="Registrieren" onPress={handleRegister} loading={loading} />
      </View>

      <Button
        title="Bereits registriert? Einloggen"
        variant="outline"
        onPress={() => router.back()}
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
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
});
