import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api } from '@/services/api';
import type { LegalPage } from '@undead/shared';
import { colors, spacing, fontSize } from '@/theme';

export default function LegalPageScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [page, setPage] = useState<LegalPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      api.legal.getPage(slug).then((res) => {
        if (res.success && res.data) {
          setPage(res.data);
        }
        setLoading(false);
      });
    }
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!page) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Seite nicht gefunden</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{page.title}</Text>
      <Text style={styles.content}>{page.content}</Text>
      <Text style={styles.date}>Stand: {new Date(page.updatedAt).toLocaleDateString('de-DE')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  content: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  date: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
});
