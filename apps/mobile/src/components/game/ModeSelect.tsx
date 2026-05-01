import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '@/theme';
import { useGameStore } from '@/stores/game';
import type { GameMode } from '@undead/shared';

interface ModeSelectProps {
  visible: boolean;
  onSelect: (mode: GameMode) => void;
}

export function ModeSelect({ visible, onSelect }: ModeSelectProps) {
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.title}>Modus w\u00e4hlen</Text>
          <Text style={styles.subtitle}>Wie m\u00f6chtest du spielen?</Text>

          <TouchableOpacity
            style={[styles.modeCard, { borderColor: colors.cityState }]}
            onPress={() => onSelect('wandel')}
            activeOpacity={0.7}
          >
            <Text style={styles.modeIcon}>🌿</Text>
            <View style={styles.modeInfo}>
              <Text style={styles.modeName}>Wandel</Text>
              <Text style={styles.modeDesc}>Entspannt erkunden, Ressourcen sammeln, Schritte z\u00e4hlen</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeCard, { borderColor: colors.danger }]}
            onPress={() => onSelect('jagd')}
            activeOpacity={0.7}
          >
            <Text style={styles.modeIcon}>⚔️</Text>
            <View style={styles.modeInfo}>
              <Text style={styles.modeName}>Jagd</Text>
              <Text style={styles.modeDesc}>Ghoule bek\u00e4mpfen, h\u00f6here Belohnungen</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  container: {
    width: '85%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
  },
  modeCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    gap: spacing.md,
  },
  modeIcon: {
    fontSize: 36,
  },
  modeInfo: {
    flex: 1,
  },
  modeName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  modeDesc: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
});
