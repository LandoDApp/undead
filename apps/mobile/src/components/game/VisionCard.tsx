import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '@/theme';
import { icons, visionIcon } from '@/assets';
import { useDailyStore } from '@/stores/daily';
import type { VisionType } from '@undead/shared';

const VISION_COLORS: Record<VisionType, string> = {
  buff_herbs: colors.cityState,
  buff_crystals: '#8e44ad',
  buff_xp: colors.gold,
  bonus_resource: colors.warning,
  scout_hint: colors.player,
};

interface VisionCardProps {
  visible: boolean;
  onClose: () => void;
}

export function VisionCard({ visible, onClose }: VisionCardProps) {
  const vision = useDailyStore((s) => s.vision);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawn, setDrawn] = useState(false);

  const handleDraw = async () => {
    setIsDrawing(true);
    const success = await useDailyStore.getState().drawVision();
    setIsDrawing(false);
    if (success) {
      setDrawn(true);
    }
  };

  const handleClose = () => {
    setDrawn(false);
    onClose();
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.cardContainer} onPress={(e) => e.stopPropagation()}>
          {vision && drawn ? (
            // Show drawn vision
            <View style={[styles.card, { borderColor: VISION_COLORS[vision.type] }]}>
              <Image source={visionIcon[vision.type]} style={styles.cardIconImg} />
              <Text style={styles.cardTitle}>{vision.title}</Text>
              <Text style={styles.cardDescription}>{vision.description}</Text>
              <TouchableOpacity style={styles.acceptButton} onPress={handleClose} activeOpacity={0.7}>
                <Text style={styles.acceptText}>Annehmen</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Draw prompt
            <View style={styles.card}>
              <Image source={icons.vision} style={styles.drawIconImg} />
              <Text style={styles.drawTitle}>Tagesvision</Text>
              <Text style={styles.drawHint}>Ziehe deine t{'\u00e4'}gliche Visionskarte</Text>
              <TouchableOpacity
                style={[styles.drawButton, isDrawing && styles.buttonDisabled]}
                onPress={handleDraw}
                disabled={isDrawing}
                activeOpacity={0.7}
              >
                <Text style={styles.drawButtonText}>
                  {isDrawing ? 'Wird gezogen...' : 'Karte ziehen'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Pressable>
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
  cardContainer: {
    width: '80%',
    maxWidth: 300,
  },
  card: {
    backgroundColor: colors.parchment,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gold,
  },
  cardIconImg: {
    width: 48,
    height: 48,
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: colors.gold,
    fontSize: 10,
    fontFamily: fontFamily.heading,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  cardDescription: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  acceptButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gold + '40',
  },
  acceptText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    fontWeight: '700',
  },
  drawIconImg: {
    width: 48,
    height: 48,
    marginBottom: spacing.md,
  },
  drawTitle: {
    color: colors.gold,
    fontSize: 10,
    fontFamily: fontFamily.heading,
    marginBottom: spacing.sm,
  },
  drawHint: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  drawButton: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  drawButtonText: {
    color: colors.background,
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    fontWeight: '700',
  },
});
