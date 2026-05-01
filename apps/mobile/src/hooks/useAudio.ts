import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { useGameStore } from '@/stores/game';
import { audio } from '@/assets';

export function useAudio() {
  const gameMode = useGameStore((s) => s.gameMode);
  const wandelSound = useRef<Audio.Sound | null>(null);
  const jagdSound = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    // Configure audio to play in background/silent mode
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // Pre-load both tracks
    const load = async () => {
      const { sound: w } = await Audio.Sound.createAsync(audio.wandel, {
        isLooping: true,
        volume: 0.4,
      });
      wandelSound.current = w;

      const { sound: j } = await Audio.Sound.createAsync(audio.jagd, {
        isLooping: true,
        volume: 0.5,
      });
      jagdSound.current = j;

      // Start wandel immediately
      await w.playAsync();
    };

    load();

    return () => {
      wandelSound.current?.unloadAsync();
      jagdSound.current?.unloadAsync();
    };
  }, []);

  // Switch tracks when game mode changes
  useEffect(() => {
    const switchAudio = async () => {
      if (gameMode === 'jagd') {
        await wandelSound.current?.pauseAsync();
        await jagdSound.current?.playAsync();
      } else {
        await jagdSound.current?.pauseAsync();
        await wandelSound.current?.playAsync();
      }
    };
    switchAudio();
  }, [gameMode]);
}
