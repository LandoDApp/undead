import React, { useMemo, useCallback } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { useZoneStore } from '@/stores/zone';
import { pointAtDistance } from '@undead/shared';
import { colors } from '@/theme';

/** Generate a polygon ring (64 points) approximating a circle */
function createCirclePolygon(
  center: { latitude: number; longitude: number },
  radiusMeters: number
): [number, number][] {
  const points: [number, number][] = [];
  const steps = 64;
  for (let i = 0; i <= steps; i++) {
    const bearing = (360 / steps) * i;
    const pt = pointAtDistance(center, radiusMeters, bearing);
    points.push([pt.longitude, pt.latitude]);
  }
  return points;
}

// Static style objects - never recreated
const fillStyle = {
  fillColor: [
    'case',
    ['get', 'isFallen'],
    'rgba(239, 68, 68, 0.2)',
    'rgba(16, 185, 129, 0.2)',
  ],
} as const;

const lineStyle = {
  lineColor: [
    'case',
    ['get', 'isFallen'],
    colors.safeZoneFallen,
    colors.safeZone,
  ],
  lineWidth: 2,
} as const;

const labelStyle = {
  textField: ['get', 'label'],
  textSize: 12,
  textColor: colors.text,
  textHaloColor: colors.background,
  textHaloWidth: 1,
  textAnchor: 'center',
} as const;

interface SafeZoneLayerProps {
  onZonePress?: (zone: {
    id: string;
    name: string;
    charge: number;
    isFallen: boolean;
    radius: number;
  }) => void;
}

export function SafeZoneLayer({ onZonePress }: SafeZoneLayerProps) {
  const zones = useZoneStore((s) => s.zones);

  // Memoize GeoJSON - only recalculate when zones array changes
  const geojson = useMemo(() => {
    if (zones.length === 0) return null;
    return {
      type: 'FeatureCollection' as const,
      features: zones.map((zone) => ({
        type: 'Feature' as const,
        properties: {
          id: zone.id,
          name: zone.name,
          charge: zone.charge,
          isFallen: zone.isFallen,
          radius: zone.radius,
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [
            createCirclePolygon(
              { latitude: zone.latitude, longitude: zone.longitude },
              zone.radius
            ),
          ],
        },
      })),
    };
  }, [zones]);

  const labelGeoJson = useMemo(() => {
    if (zones.length === 0) return null;
    return {
      type: 'FeatureCollection' as const,
      features: zones.map((zone) => ({
        type: 'Feature' as const,
        properties: {
          id: zone.id,
          name: zone.name,
          charge: zone.charge,
          label: `${zone.name}\n${Math.round(zone.charge)}%`,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [zone.longitude, zone.latitude] as [number, number],
        },
      })),
    };
  }, [zones]);

  const handlePress = useCallback(
    (event: any) => {
      if (!onZonePress) return;
      const feature = event?.features?.[0];
      if (feature?.properties) {
        onZonePress({
          id: feature.properties.id,
          name: feature.properties.name,
          charge: feature.properties.charge,
          isFallen: feature.properties.isFallen,
          radius: feature.properties.radius,
        });
      }
    },
    [onZonePress]
  );

  if (!geojson || !labelGeoJson) return null;

  return (
    <>
      <MapLibreGL.ShapeSource
        id="safe-zones"
        shape={geojson}
        onPress={handlePress}
      >
        <MapLibreGL.FillLayer id="safe-zone-fill" style={fillStyle} />
        <MapLibreGL.LineLayer id="safe-zone-stroke" style={lineStyle} />
      </MapLibreGL.ShapeSource>
      <MapLibreGL.ShapeSource id="safe-zone-labels-source" shape={labelGeoJson}>
        <MapLibreGL.SymbolLayer
          id="safe-zone-labels"
          style={labelStyle}
          minZoomLevel={14}
        />
      </MapLibreGL.ShapeSource>
    </>
  );
}
