import React, { useMemo } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { usePointsStore } from '@/stores/points';

// Amber/gold color for collectible points
const circleStyle = {
  circleRadius: 5,
  circleColor: '#f59e0b',
  circleOpacity: 0.9,
  circleStrokeWidth: 2,
  circleStrokeColor: 'rgba(245, 158, 11, 0.3)',
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
      <MapLibreGL.CircleLayer id="collectible-point-circles" style={circleStyle} />
    </MapLibreGL.ShapeSource>
  );
}
