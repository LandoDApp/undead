import React, { useMemo } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { useLocationStore } from '@/stores/location';
import { useAuthStore } from '@/stores/auth';
import { sprites } from '@/assets';
import type { ClanType } from '@undead/shared';

const PLAYER_IMAGES = {
  'player-glut': sprites.playerGlut,
  'player-frost': sprites.playerFrost,
  'player-hain': sprites.playerHain,
};

const CLAN_ICON: Record<ClanType, string> = {
  glut: 'player-glut',
  frost: 'player-frost',
  hain: 'player-hain',
};

const iconStyle = {
  iconImage: ['get', 'icon'],
  iconSize: ['interpolate', ['linear'], ['zoom'], 10, 0.1, 14, 0.3, 16, 0.55, 20, 1.4],
  iconAllowOverlap: true,
  iconIgnorePlacement: true,
  textField: ['get', 'name'],
  textSize: ['interpolate', ['linear'], ['zoom'], 12, 8, 15, 12, 18, 16],
  textColor: '#f4e8c1',
  textHaloColor: '#2f1f14',
  textHaloWidth: 1.2,
  textOffset: [0, -2.5] as [number, number],
  textAnchor: 'bottom' as const,
  textFont: ['Noto Serif Regular'],
  textAllowOverlap: true,
  textIgnorePlacement: true,
} as const;

export function PlayerMarker() {
  const displayPosition = useLocationStore((s) => s.displayPosition);
  const position = useLocationStore((s) => s.position);
  const clan: ClanType | null = useAuthStore((s) => s.clan);
  const user = useAuthStore((s) => s.user);

  const coord = displayPosition ?? position;
  const iconName = clan ? CLAN_ICON[clan] : 'player-glut';
  const displayName = user?.displayName ?? '';

  const geojson = useMemo(() => {
    if (!coord) return { type: 'FeatureCollection' as const, features: [] };
    return {
      type: 'FeatureCollection' as const,
      features: [{
        type: 'Feature' as const,
        properties: { icon: iconName, name: displayName },
        geometry: {
          type: 'Point' as const,
          coordinates: [coord.longitude, coord.latitude] as [number, number],
        },
      }],
    };
  }, [coord?.longitude, coord?.latitude, iconName, displayName]);

  return (
    <>
      <MapLibreGL.Images images={PLAYER_IMAGES} />
      <MapLibreGL.ShapeSource id="player" shape={geojson}>
        <MapLibreGL.SymbolLayer id="player-icon" style={iconStyle} />
      </MapLibreGL.ShapeSource>
    </>
  );
}
