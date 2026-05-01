import React, { useMemo, useCallback } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { useCityStateStore } from '@/stores/zone';
import { pointAtDistance } from '@undead/shared';

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

const extrusionStyle = {
  fillExtrusionColor: [
    'case',
    ['get', 'isFallen'],
    'rgba(122, 61, 47, 0.42)',
    'rgba(92, 101, 59, 0.34)',
  ],
  fillExtrusionHeight: 16,
  fillExtrusionBase: 0,
  fillExtrusionOpacity: 0.62,
} as const;

const lineStyle = {
  lineColor: [
    'case',
    ['get', 'isFallen'],
    '#5a2f24',
    '#4f3b24',
  ],
  lineWidth: 2.5,
  lineOpacity: 0.85,
} as const;

const labelStyle = {
  textField: ['get', 'label'],
  textSize: 13,
  textColor: '#2f1f14',
  textHaloColor: '#e6d3ad',
  textHaloWidth: 1.2,
  textFont: ['Noto Serif Regular'],
  textRotate: 2,
  textOpacity: 0.93,
  textAnchor: 'center',
} as const;

interface CityStateLayerProps {
  onZonePress?: (zone: {
    id: string;
    name: string;
    charge: number;
    isFallen: boolean;
    radius: number;
    maxCharge?: number;
    upgradeLevel?: number;
    baseRadius?: number;
  }) => void;
}

export function CityStateLayer({ onZonePress }: CityStateLayerProps) {
  const cityStates = useCityStateStore((s) => s.cityStates);

  // Memoize GeoJSON - only recalculate when cityStates array changes
  const geojson = useMemo(() => {
    if (cityStates.length === 0) return null;
    return {
      type: 'FeatureCollection' as const,
      features: cityStates.map((zone) => ({
        type: 'Feature' as const,
        properties: {
          id: zone.id,
          name: zone.name,
          charge: zone.charge,
          isFallen: zone.isFallen,
          radius: zone.radius,
          maxCharge: zone.maxCharge,
          upgradeLevel: zone.upgradeLevel,
          baseRadius: zone.baseRadius,
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
  }, [cityStates]);

  const labelGeoJson = useMemo(() => {
    if (cityStates.length === 0) return null;
    return {
      type: 'FeatureCollection' as const,
      features: cityStates.map((zone) => ({
        type: 'Feature' as const,
        properties: {
          id: zone.id,
          name: zone.name,
          charge: zone.charge,
          label: `${zone.name}\n${Math.round((zone.charge / (zone.maxCharge || 100)) * 100)}%`,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [zone.longitude, zone.latitude] as [number, number],
        },
      })),
    };
  }, [cityStates]);

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
          maxCharge: feature.properties.maxCharge,
          upgradeLevel: feature.properties.upgradeLevel,
          baseRadius: feature.properties.baseRadius,
        });
      }
    },
    [onZonePress]
  );

  if (!geojson || !labelGeoJson) return null;

  return (
    <>
      <MapLibreGL.ShapeSource
        id="city-states"
        shape={geojson}
        onPress={handlePress}
      >
        <MapLibreGL.FillExtrusionLayer id="city-state-extrusion" style={extrusionStyle} />
        <MapLibreGL.LineLayer id="city-state-stroke" style={lineStyle} />
      </MapLibreGL.ShapeSource>
      <MapLibreGL.ShapeSource id="city-state-labels-source" shape={labelGeoJson}>
        <MapLibreGL.SymbolLayer
          id="city-state-labels"
          style={labelStyle}
          minZoomLevel={14}
        />
      </MapLibreGL.ShapeSource>
    </>
  );
}
