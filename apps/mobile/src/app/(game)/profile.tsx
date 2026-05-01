import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui';
import { colors, spacing, fontSize, fontFamily, borderRadius } from '@/theme';
import type { ClanType } from '@undead/shared';

const CLAN_INFO: Record<ClanType, { name: string; subtitle: string; color: string }> = {
  glut: { name: 'Glut', subtitle: 'Orden der Flamme', color: colors.clanGlut },
  frost: { name: 'Frost', subtitle: 'Bund des Eises', color: colors.clanFrost },
  hain: { name: 'Hain', subtitle: 'H\u00fcter des Hains', color: colors.clanHain },
};

const TUTORIAL_SECTIONS = [
  {
    title: 'Ghoule',
    content: 'Ghoule sind untote Wesen, die dich jagen. Im Jagd-Modus spawnen sie in deiner N\u00e4he und bewegen sich auf dich zu. Wenn ein Ghoul dich ber\u00fchrt, verlierst du ein Herz. Bei 0 Herzen bist du f\u00fcr eine kurze Zeit kampfunf\u00e4hig. Fliehe in einen Stadtstaat, um sicher zu sein!',
  },
  {
    title: 'Stadtstaaten',
    content: 'Stadtstaaten sind sichere Zonen auf der Karte. Betritt einen Stadtstaat, um Ghoule zu bannen und dich zu heilen. Du kannst Stadtstaaten mit Kr\u00e4utern heilen und mit Kristallen upgraden, um ihren Radius und ihre maximale Ladung zu erh\u00f6hen.',
  },
  {
    title: 'Ressourcen',
    content: 'Es gibt drei Ressourcen:\n\u2022 Kr\u00e4uter (gr\u00fcn) \u2014 Heilen von Stadtstaaten & Bastionen\n\u2022 Kristalle (lila) \u2014 Upgrades f\u00fcr Stadtstaaten, Bastionen & Arbeiter\n\u2022 Reliquien (gold) \u2014 Seltene Event-Ressource\n\nSammle sie auf der Karte ein, indem du nah genug herangehst.',
  },
  {
    title: 'Bastion',
    content: 'Deine pers\u00f6nliche Festung! Baue sie an einem Ort deiner Wahl. 3 Level: Holzh\u00fctte \u2192 Holzfestung \u2192 Steinfestung. Stelle Arbeiter ein, die automatisch Ressourcen produzieren \u2014 auch wenn du offline bist (max. 8h). Heile deine Bastion mit Kr\u00e4utern und upgrade sie mit Kristallen.',
  },
  {
    title: 'Auftr\u00e4ge',
    content: 'Erledige t\u00e4gliche und w\u00f6chentliche Auftr\u00e4ge f\u00fcr Belohnungen. Kategorien: Sammeln, Besuchen, Besiegen, Laufen, Heilen, Upgraden. Tippe auf den Quest-Tracker links auf der Karte, um alle Auftr\u00e4ge zu sehen.',
  },
  {
    title: 'Tagesvision',
    content: 'Ziehe jeden Tag eine Visionskarte f\u00fcr einen Buff:\n\u2022 Kr\u00e4uter-Boost\n\u2022 Kristall-Boost\n\u2022 XP-Boost\n\u2022 Bonus-Ressource\n\u2022 Sp\u00e4her-Hinweis\n\nDie Karte wird beim App-Start angeboten.',
  },
  {
    title: 'Streaks',
    content: '\u00d6ffne die App jeden Tag f\u00fcr Login-Serien. Boni bei 3, 7 und 30 Tagen. Du hast 1 Freeze pro Monat, um deine Serie zu sch\u00fctzen.',
  },
  {
    title: 'Spielmodi',
    content: 'Wandel (Standard): Entspanntes Erkunden. Sammle Ressourcen, besuche Stadtstaaten, erledige Auftr\u00e4ge. Keine Ghoule.\n\nJagd: Aktiviere den Jagd-Modus \u00fcber den Button unten rechts. Ghoule spawnen und jagen dich! 3 Sekunden Abk\u00fchlzeit zum Fliehen.',
  },
  {
    title: 'Clans',
    content: 'W\u00e4hle bei der Registrierung einen Clan:\n\u2022 Glut (rot) \u2014 Orden der Flamme\n\u2022 Frost (blau) \u2014 Bund des Eises\n\u2022 Hain (gr\u00fcn) \u2014 H\u00fcter des Hains\n\nDein Clan bestimmt deine Teamfarbe.',
  },
];

function TutorialCard({ title, content }: { title: string; content: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={styles.tutorialCard}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.tutorialHeader}>
        <Text style={styles.tutorialTitle}>{title}</Text>
        <Text style={styles.tutorialChevron}>{expanded ? '\u25B2' : '\u25BC'}</Text>
      </View>
      {expanded && (
        <Text style={styles.tutorialContent}>{content}</Text>
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, clan, signOut, deleteAccount } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const handleDelete = () => {
    Alert.alert(
      'Account l\u00f6schen',
      'Bist du sicher? Alle deine Daten werden unwiderruflich gel\u00f6scht.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'L\u00f6schen',
          style: 'destructive',
          onPress: async () => {
            await deleteAccount();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const clanInfo = clan && (clan as ClanType) in CLAN_INFO ? CLAN_INFO[clan as ClanType] : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profil</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Anzeigename</Text>
        <Text style={styles.value}>{user?.displayName || 'Unbekannt'}</Text>

        <Text style={[styles.label, { marginTop: spacing.md }]}>E-Mail</Text>
        <Text style={styles.value}>{user?.email || '-'}</Text>

        {/* Clan badge */}
        {clanInfo && (
          <View style={styles.clanRow}>
            <Text style={[styles.label, { marginTop: spacing.md }]}>Clan</Text>
            <View style={[styles.clanBadge, { backgroundColor: clanInfo.color + '22', borderColor: clanInfo.color }]}>
              <View style={[styles.clanDot, { backgroundColor: clanInfo.color }]} />
              <Text style={[styles.clanText, { color: clanInfo.color }]}>
                {clanInfo.name} — {clanInfo.subtitle}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Tutorial / Handbuch */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Handbuch</Text>
        {TUTORIAL_SECTIONS.map((s) => (
          <TutorialCard key={s.title} title={s.title} content={s.content} />
        ))}
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
          title="Account l\u00f6schen"
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
    paddingTop: spacing.xxl + spacing.md,
  },
  title: {
    fontSize: 12,
    fontFamily: fontFamily.heading,
    color: colors.gold,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.parchment,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gold + '40',
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
  },
  value: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.body,
    color: colors.text,
    marginTop: spacing.xs,
  },
  clanRow: {
    marginTop: spacing.xs,
  },
  clanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  clanDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  clanText: {
    fontSize: 14,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: fontFamily.heading,
    color: colors.gold,
    marginBottom: spacing.md,
  },
  // Tutorial cards
  tutorialCard: {
    backgroundColor: colors.parchment,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gold + '20',
  },
  tutorialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tutorialTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    fontWeight: '700',
    flex: 1,
  },
  tutorialChevron: {
    color: colors.gold,
    fontSize: 12,
  },
  tutorialContent: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fontFamily.body,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
});
