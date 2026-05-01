import React, { useMemo } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { usePointsStore } from '@/stores/points';

// Glow layer — flat on the ground
const glowStyle = {
  circleRadius: 18,
  circleColor: '#f59e0b',
  circleOpacity: 0.18,
  circleBlur: 1,
  circlePitchAlignment: 'map' as const,
} as const;

// Amber/gold collectible points — flat on the ground for 3D effect
const circleStyle = {
  circleRadius: 11,
  circleColor: '#f59e0b',
  circleOpacity: 0.9,
  circleStrokeWidth: 2,
  circleStrokeColor: 'rgba(245, 158, 11, 0.35)',
  circlePitchAlignment: 'map' as const,
} as const;

export function CollectiblePointMarkers() {
  const points = usePointsStore((s) => s.collectiblePoints);

  const geojson = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: points.map((p) => ({
        type: 'Feature' as const,
        id: p.id,
        properties: {},
        geometry: {
          type: 'Point' as const,
          coordinates: [p.longitude, p.latitude],
        },
      })),
    }),
    [points]
  );

  if (points.length === 0) return null;

  return (
    <MapLibreGL.ShapeSource id="collectible-points" shape={geojson}>
      <MapLibreGL.CircleLayer id="collectible-point-glow" style={glowStyle} />
      <MapLibreGL.CircleLayer id="collectible-point-circles" style={circleStyle} />
    </MapLibreGL.ShapeSource>
  );
}
