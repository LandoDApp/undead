import React, { useMemo } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { useGameStore } from '@/stores/game';
import { colors } from '@/theme';

// Static style objects — never recreated between renders
const circleStyle = {
  circleRadius: 6,
  circleColor: [
    'case',
    ['get', 'frozen'],
    colors.textMuted,
    colors.zombie,
  ],
  circleOpacity: 0.9,
  circleStrokeWidth: 3,
  circleStrokeColor: [
    'case',
    ['get', 'frozen'],
    'rgba(148, 163, 184, 0.25)',
    'rgba(239, 68, 68, 0.25)',
  ],
} as const;

export function ZombieMarkers() {
  const zombies = useGameStore((s) => s.zombies);

  const geojson = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: zombies.map((z) => ({
        type: 'Feature' as const,
        id: z.id,
        properties: { frozen: z.frozen },
        geometry: {
          type: 'Point' as const,
          coordinates: [z.position.longitude, z.position.latitude],
        },
      })),
    }),
    [zombies]
  );

  if (zombies.length === 0) return null;

  return (
    <MapLibreGL.ShapeSource id="zombies" shape={geojson}>
      <MapLibreGL.CircleLayer id="zombie-circles" style={circleStyle} />
    </MapLibreGL.ShapeSource>
  );
}
