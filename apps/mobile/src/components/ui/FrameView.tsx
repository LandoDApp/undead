import React from 'react';
import { ImageBackground, type StyleProp, type ViewStyle } from 'react-native';
import { frames } from '@/assets';

const frameSources = {
  dark: frames.dark,
  light: frames.light,
  gold: frames.gold,
} as const;

interface FrameViewProps {
  variant: 'dark' | 'light' | 'gold';
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Uniform padding (overridden by individual sides if set) */
  padding?: number;
  /** Horizontal padding (left + right) */
  paddingH?: number;
  /** Top padding */
  paddingTop?: number;
  /** Bottom padding */
  paddingBottom?: number;
}

export function FrameView({
  variant,
  children,
  style,
  padding = 14,
  paddingH,
  paddingTop: pTop,
  paddingBottom: pBottom,
}: FrameViewProps) {
  const pt = pTop ?? padding;
  const pb = pBottom ?? padding;
  const ph = paddingH ?? padding;

  return (
    <ImageBackground
      source={frameSources[variant]}
      resizeMode="stretch"
      style={[
        {
          paddingTop: pt,
          paddingBottom: pb,
          paddingLeft: ph,
          paddingRight: ph,
        },
        style,
      ]}
    >
      {children}
    </ImageBackground>
  );
}
