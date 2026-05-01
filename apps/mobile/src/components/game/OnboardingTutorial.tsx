import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '@/theme';
import { useBastionStore } from '@/stores/bastion';
import { useLocationStore } from '@/stores/location';
import { useQuestStore } from '@/stores/quests';
import { VisionCard } from './VisionCard';

const ONBOARDING_KEY = 'onboarding_complete';

const TOTAL_STEPS = 9;

interface OnboardingTutorialProps {
  onComplete: () => void;
}

export async function isOnboardingComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === 'true';
}

export async function markOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

export function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const [step, setStep] = useState(0);
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [loading, setLoading] = useState(false);
  const [bastionCreated, setBastionCreated] = useState(false);
  const [showVision, setShowVision] = useState(false);
  const [workerAssigned, setWorkerAssigned] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const animateStep = useCallback((nextStep: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
    setStep(nextStep);
  }, [fadeAnim]);

  const handleNext = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      animateStep(step + 1);
    }
  }, [step, animateStep]);

  // Step 2: Create bastion at current location
  const handleCreateBastion = useCallback(async () => {
    if (bastionCreated) {
      handleNext();
      return;
    }
    setLoading(true);
    const pos = useLocationStore.getState().position;
    const lat = pos?.latitude ?? 48.137;
    const lon = pos?.longitude ?? 11.576;
    const success = await useBastionStore.getState().createBastion('Meine Bastion', lat, lon);
    if (success) {
      setBastionCreated(true);
      // Also assign a starter herbalist worker
      await useBastionStore.getState().assignWorker('herbalist');
      setWorkerAssigned(true);
    }
    setLoading(false);
    handleNext();
  }, [bastionCreated, handleNext]);

  // Step 3: "Collect" from bastion (simulated for new player)
  const handleBastionCollect = useCallback(() => {
    handleNext();
  }, [handleNext]);

  // Step 4: Draw vision
  const handleDrawVision = useCallback(() => {
    setShowVision(true);
  }, []);

  const handleVisionClose = useCallback(() => {
    setShowVision(false);
    handleNext();
  }, [handleNext]);

  // Step 5: Show map
  const handleMapNext = useCallback(() => {
    handleNext();
  }, [handleNext]);

  // Step 6: City-state explanation
  const handleCityStateNext = useCallback(() => {
    handleNext();
  }, [handleNext]);

  // Step 7: Quest activation
  const handleQuestNext = useCallback(async () => {
    // Fetch quests to trigger auto-generation
    await useQuestStore.getState().fetchQuests();
    handleNext();
  }, [handleNext]);

  // Step 8: Jagd teaser
  const handleJagdNext = useCallback(() => {
    handleNext();
  }, [handleNext]);

  // Step 9: Complete onboarding
  const handleComplete = useCallback(async () => {
    await markOnboardingComplete();
    onComplete();
  }, [onComplete]);

  const renderProgressDots = () => (
    <View style={styles.progressContainer}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <View
          key={i}
          style={[
            styles.progressDot,
            i === step && styles.progressDotActive,
            i < step && styles.progressDotDone,
          ]}
        />
      ))}
    </View>
  );

  const renderStep = () => {
    switch (step) {
      // Step 0: Intro
      case 0:
        return (
          <View style={styles.stepCenter}>
            <Text style={styles.introIcon}>{'\u2694\uFE0F'}</Text>
            <Text style={styles.introTitle}>Die Welt ist gefallen.</Text>
            <Text style={styles.introSubtitle}>Du bist einer der Letzten.</Text>
            <Text style={styles.introFlavor}>
              Die Ghoule haben alles {'\u00fc'}berrannt. Doch es gibt noch Hoffnung{'\u2026'}
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleNext} activeOpacity={0.7}>
              <Text style={styles.primaryButtonText}>Beginnen</Text>
            </TouchableOpacity>
          </View>
        );

      // Step 1: Bastion placement
      case 1:
        return (
          <View style={styles.stepCenter}>
            <Text style={styles.stepIcon}>{'\uD83C\uDFF0'}</Text>
            <Text style={styles.stepTitle}>Deine Bastion</Text>
            <Text style={styles.stepBody}>
              Jeder {'\u00dc'}berlebende braucht einen sicheren Ort.{'\n'}
              Deine Bastion wird an deinem aktuellen Standort errichtet.
            </Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                Hier beginnt dein Gebiet. Deine Bastion produziert Ressourcen, auch wenn du offline bist.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleCreateBastion}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Wird errichtet...' : 'Bastion errichten'}
              </Text>
            </TouchableOpacity>
          </View>
        );

      // Step 2: Bastion Idle
      case 2:
        return (
          <View style={styles.stepCenter}>
            <Text style={styles.stepIcon}>{'\uD83D\uDD28'}</Text>
            <Text style={styles.stepTitle}>Arbeiter & Lager</Text>
            <View style={styles.featureRow}>
              <View style={styles.featureCard}>
                <Text style={styles.featureIcon}>{'\uD83C\uDF3F'}</Text>
                <Text style={styles.featureLabel}>Kr{'\u00e4'}utersammler</Text>
                <Text style={styles.featureDesc}>Sammelt automatisch Kr{'\u00e4'}uter</Text>
              </View>
              <View style={styles.featureCard}>
                <Text style={styles.featureIcon}>{'\uD83D\uDCE6'}</Text>
                <Text style={styles.featureLabel}>Lager</Text>
                <Text style={styles.featureDesc}>Hier lagern deine Ressourcen</Text>
              </View>
            </View>
            <Text style={styles.stepBody}>
              Deine Arbeiter produzieren auch w{'\u00e4'}hrend du offline bist.
              Sammle regelm{'\u00e4'}{'\u00df'}ig dein Lager ein!
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleBastionCollect} activeOpacity={0.7}>
              <Text style={styles.primaryButtonText}>Verstanden</Text>
            </TouchableOpacity>
          </View>
        );

      // Step 3: Vision
      case 3:
        return (
          <View style={styles.stepCenter}>
            <Text style={styles.stepIcon}>{'\uD83C\uDCCF'}</Text>
            <Text style={styles.stepTitle}>Tagesvision</Text>
            <Text style={styles.stepBody}>
              Jeden Tag kannst du eine Visionskarte ziehen.{'\n'}
              Sie gew{'\u00e4'}hrt dir einen Bonus f{'\u00fc'}r 24 Stunden.
            </Text>
            <View style={styles.visionPreview}>
              <View style={[styles.visionCard, { borderColor: colors.cityState }]}>
                <Text style={styles.visionCardIcon}>{'\uD83C\uDF3F'}</Text>
              </View>
              <View style={[styles.visionCard, { borderColor: '#8e44ad' }]}>
                <Text style={styles.visionCardIcon}>{'\uD83D\uDC8E'}</Text>
              </View>
              <View style={[styles.visionCard, { borderColor: colors.gold }]}>
                <Text style={styles.visionCardIcon}>{'\u2B50'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={handleDrawVision} activeOpacity={0.7}>
              <Text style={styles.primaryButtonText}>Vision ziehen</Text>
            </TouchableOpacity>
            <VisionCard visible={showVision} onClose={handleVisionClose} />
          </View>
        );

      // Step 4: World Map
      case 4:
        return (
          <View style={styles.stepCenter}>
            <Text style={styles.stepIcon}>{'\uD83D\uDDFA\uFE0F'}</Text>
            <Text style={styles.stepTitle}>Die Weltkarte</Text>
            <Text style={styles.stepBody}>
              Auf der Karte findest du:
            </Text>
            <View style={styles.legendList}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.legendText}>Deine Bastion</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.cityState }]} />
                <Text style={styles.legendText}>Stadtstaaten (sichere Orte)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.gold }]} />
                <Text style={styles.legendText}>Ressourcen zum Einsammeln</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.ghoul }]} />
                <Text style={styles.legendText}>Ghoule (im Jagd-Modus)</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={handleMapNext} activeOpacity={0.7}>
              <Text style={styles.primaryButtonText}>Weiter</Text>
            </TouchableOpacity>
          </View>
        );

      // Step 5: City-State
      case 5:
        return (
          <View style={styles.stepCenter}>
            <Text style={styles.stepIcon}>{'\uD83D\uDEE1\uFE0F'}</Text>
            <Text style={styles.stepTitle}>Stadtstaaten</Text>
            <Text style={styles.stepBody}>
              Stadtstaaten sind sichere Orte auf der Karte.{'\n'}
              Ghoule werden dort gebannt.
            </Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                St{'\u00e4'}rke deinen Clan, indem du Stadtstaaten heilst und verteidigst.
                Nutze Kr{'\u00e4'}uter zum Heilen und Kristalle zum Ausbauen.
              </Text>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={handleCityStateNext} activeOpacity={0.7}>
              <Text style={styles.primaryButtonText}>Verstanden</Text>
            </TouchableOpacity>
          </View>
        );

      // Step 6: Quests
      case 6:
        return (
          <View style={styles.stepCenter}>
            <Text style={styles.stepIcon}>{'\uD83D\uDCDC'}</Text>
            <Text style={styles.stepTitle}>Auftr{'\u00e4'}ge</Text>
            <Text style={styles.stepBody}>
              T{'\u00e4'}gliche und w{'\u00f6'}chentliche Auftr{'\u00e4'}ge geben dir Ziele
              und belohnen dich mit Ressourcen.
            </Text>
            <View style={styles.questExamples}>
              <View style={styles.questItem}>
                <Text style={styles.questBullet}>{'\uD83C\uDF3F'}</Text>
                <Text style={styles.questText}>Sammle 3 Kr{'\u00e4'}uter</Text>
              </View>
              <View style={styles.questItem}>
                <Text style={styles.questBullet}>{'\uD83C\uDFF0'}</Text>
                <Text style={styles.questText}>{'\u00d6'}ffne deine Bastion</Text>
              </View>
              <View style={styles.questItem}>
                <Text style={styles.questBullet}>{'\u2694\uFE0F'}</Text>
                <Text style={styles.questText}>Besiege 5 Ghoule</Text>
              </View>
            </View>
            <Text style={styles.stepHint}>Auftr{'\u00e4'}ge findest du links auf dem Bildschirm.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleQuestNext} activeOpacity={0.7}>
              <Text style={styles.primaryButtonText}>Weiter</Text>
            </TouchableOpacity>
          </View>
        );

      // Step 7: Jagd
      case 7:
        return (
          <View style={styles.stepCenter}>
            <Text style={styles.jagdIcon}>{'\u2694\uFE0F'}</Text>
            <Text style={styles.stepTitle}>Jagd-Modus</Text>
            <Text style={styles.stepBody}>
              Im Jagd-Modus erscheinen Ghoule in deiner N{'\u00e4'}he
              und greifen dich an!
            </Text>
            <View style={styles.warningCard}>
              <Text style={styles.warningText}>
                Aktiviere Jagd nur, wenn du bereit bist.{'\n'}
                Du kannst jederzeit fliehen (3 Sekunden Abklingzeit).
              </Text>
            </View>
            <View style={styles.jagdPreview}>
              <View style={styles.jagdGhoul}>
                <Text style={styles.jagdGhoulIcon}>{'\uD83D\uDC80'}</Text>
              </View>
              <View style={[styles.jagdGhoul, { opacity: 0.6, transform: [{ scale: 0.8 }] }]}>
                <Text style={styles.jagdGhoulIcon}>{'\uD83D\uDC80'}</Text>
              </View>
              <View style={[styles.jagdGhoul, { opacity: 0.3, transform: [{ scale: 0.6 }] }]}>
                <Text style={styles.jagdGhoulIcon}>{'\uD83D\uDC80'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={handleJagdNext} activeOpacity={0.7}>
              <Text style={styles.primaryButtonText}>Verstanden</Text>
            </TouchableOpacity>
          </View>
        );

      // Step 8: Wandel / Complete
      case 8:
        return (
          <View style={styles.stepCenter}>
            <Text style={styles.stepIcon}>{'\uD83D\uDEB6'}</Text>
            <Text style={styles.stepTitle}>Wandel-Modus</Text>
            <Text style={styles.stepBody}>
              Im Wandel-Modus sammelst du Ressourcen,{'\n'}
              entdeckst die Welt und baust dein Gebiet aus.{'\n\n'}
              Bewegung bringt dir Fortschritt {'\u2014'}{'\n'}
              aber auch ohne Bewegung produziert deine Bastion.
            </Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                Erst Progress, dann Motivation, dann Bewegung.{'\n'}
                Du bestimmst das Tempo.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.primaryButton, styles.completeButton]}
              onPress={handleComplete}
              activeOpacity={0.7}
            >
              <Text style={styles.primaryButtonText}>Abenteuer beginnen</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {renderStep()}
      </Animated.View>
      {step > 0 && renderProgressDots()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    zIndex: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    maxWidth: 380,
    alignItems: 'center',
  },
  // Progress dots
  progressContainer: {
    position: 'absolute',
    bottom: spacing.xxl,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceLight,
  },
  progressDotActive: {
    backgroundColor: colors.gold,
    width: 20,
    borderRadius: 4,
  },
  progressDotDone: {
    backgroundColor: colors.gold + '60',
  },
  // Step layouts
  stepCenter: {
    alignItems: 'center',
    width: '100%',
  },
  // Intro step
  introIcon: {
    fontSize: 64,
    marginBottom: spacing.xl,
  },
  introTitle: {
    color: colors.gold,
    fontSize: 12,
    fontFamily: fontFamily.heading,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  introSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.xl,
    fontFamily: fontFamily.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  introFlavor: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 24,
  },
  // Step elements
  stepIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  stepTitle: {
    color: colors.gold,
    fontSize: 10,
    fontFamily: fontFamily.heading,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  stepBody: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
    fontFamily: fontFamily.body,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: spacing.lg,
  },
  stepHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  // Info card
  infoCard: {
    backgroundColor: colors.parchment,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gold + '40',
  },
  infoText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Feature row (bastion idle)
  featureRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    width: '100%',
  },
  featureCard: {
    flex: 1,
    backgroundColor: colors.parchment,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold + '30',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  featureLabel: {
    color: colors.gold,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.body,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  featureDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fontFamily.body,
    textAlign: 'center',
  },
  // Vision preview
  visionPreview: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  visionCard: {
    width: 72,
    height: 100,
    backgroundColor: colors.parchment,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visionCardIcon: {
    fontSize: 28,
  },
  // Legend (map)
  legendList: {
    width: '100%',
    backgroundColor: colors.parchment,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gold + '40',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
  },
  // Quest examples
  questExamples: {
    width: '100%',
    backgroundColor: colors.parchment,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gold + '40',
    gap: spacing.sm,
  },
  questItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  questBullet: {
    fontSize: 16,
  },
  questText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
  },
  // Warning card (jagd)
  warningCard: {
    backgroundColor: colors.danger + '20',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.danger + '60',
  },
  warningText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Jagd preview
  jagdIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  jagdPreview: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  jagdGhoul: {
    width: 48,
    height: 48,
    backgroundColor: colors.ghoul + '30',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.ghoul,
  },
  jagdGhoulIcon: {
    fontSize: 24,
  },
  // Buttons
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold + '40',
  },
  completeButton: {
    backgroundColor: colors.gold,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontFamily: fontFamily.body,
    fontWeight: '700',
  },
});
