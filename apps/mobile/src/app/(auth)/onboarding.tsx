import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui';
import { colors, spacing, fontSize } from '@/theme';

export default function OnboardingScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Willkommen bei Undead</Text>

      <View style={styles.section}>
        <Text style={styles.heading}>So funktioniert's</Text>
        <Text style={styles.text}>
          Zombies spawnen in deiner Nähe und bewegen sich auf echten Gehwegen auf dich zu.
          Flieh zu einer Safe Zone, um sicher zu sein!
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Safe Zones</Text>
        <Text style={styles.text}>
          Grüne Bereiche auf der Karte sind sichere Orte. Dort frieren Zombies ein
          und du kannst andere Spieler treffen.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Sicherheitshinweis</Text>
        <Text style={[styles.text, styles.warning]}>
          Achte immer auf den Verkehr und deine Umgebung!
          Die App ist kein Grund, unaufmerksam zu sein.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Standort-Berechtigung</Text>
        <Text style={styles.text}>
          Undead benötigt Zugriff auf deinen Standort, um dir Zombies und Safe Zones
          in deiner Nähe zu zeigen. Tracking erfolgt nur im Vordergrund.
        </Text>
      </View>

      <Button
        title="Verstanden, los geht's!"
        onPress={() => router.replace('/(game)')}
        style={{ marginTop: spacing.lg }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.xxl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  heading: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  text: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  warning: {
    color: colors.warning,
  },
});
