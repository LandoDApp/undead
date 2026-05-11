import React, { useMemo, useCallback, useState } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { useDungeonStore } from '@/stores/dungeon';
import { pointAtDistance } from '@undead/shared';
import { sprites } from '@/assets';
import { DungeonEntryModal } from '@/components/game/DungeonEntryModal';

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

const DUNGEON_IMAGES = {
  'dungeon-icon': sprites.ghoul,
};

const extrusionStyle = {
  fillExtrusionColor: 'rgba(80, 40, 100, 0.35)',
  fillExtrusionHeight: 20,
  fillExtrusionBase: 0,
  fillExtrusionOpacity: 0.55,
} as const;

const lineStyle = {
  lineColor: '#5a2a6a',
  lineWidth: 2.5,
  lineOpacity: 0.8,
} as const;

const labelStyle = {
  textField: ['get', 'label'],
  textSize: 12,
  textColor: '#c8a0e8',
  textHaloColor: 'rgba(0,0,0,0.85)',
  textHaloWidth: 1.5,
  textFont: ['Noto Serif Regular'],
  textOpacity: 0.9,
  textAnchor: 'center' as const,
} as const;

const iconStyle = {
  iconImage: 'dungeon-icon',
  iconSize: ['interpolate', ['linear'], ['zoom'], 10, 0.06, 14, 0.2, 16, 0.35, 20, 0.8],
  iconAllowOverlap: true,
  iconIgnorePlacement: true,
  iconOffset: [0, -25] as [number, number],
} as const;

interface DungeonLayerProps {
  onDungeonPress?: (dungeon: { id: string; name: string; minLevel: number }) => void;
}

export function DungeonLayer({ onDungeonPress }: DungeonLayerProps) {
  const dungeons = useDungeonStore((s) => s.dungeons);
  const [selectedDungeon, setSelectedDungeon] = useState<{ id: string; name: string; minLevel: number } | null>(null);

  const geojson = useMemo(() => {
    if (dungeons.length === 0) return null;
    return {
      type: 'FeatureCollection' as const,
      features: dungeons.map((d) => ({
        type: 'Feature' as const,
        properties: {
          id: d.id,
          name: d.name,
          minLevel: d.minLevel,
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [
            createCirclePolygon(
              { latitude: d.latitude, longitude: d.longitude },
              d.radius
            ),
          ],
        },
      })),
    };
  }, [dungeons]);

  const labelGeoJson = useMemo(() => {
    if (dungeons.length === 0) return null;
    return {
      type: 'FeatureCollection' as const,
      features: dungeons.map((d) => ({
        type: 'Feature' as const,
        properties: {
          id: d.id,
          label: `${d.name}\nLv.${d.minLevel}+`,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [d.longitude, d.latitude] as [number, number],
        },
      })),
    };
  }, [dungeons]);

  const handlePress = useCallback((event: any) => {
    const feature = event?.features?.[0];
    if (feature?.properties) {
      const d = {
        id: feature.properties.id,
        name: feature.properties.name,
        minLevel: feature.properties.minLevel,
      };
      setSelectedDungeon(d);
      onDungeonPress?.(d);
    }
  }, [onDungeonPress]);

  if (!geojson || !labelGeoJson) return null;

  return (
    <>
      <MapLibreGL.Images images={DUNGEON_IMAGES} />
      <MapLibreGL.ShapeSource id="dungeons" shape={geojson} onPress={handlePress}>
        <MapLibreGL.FillExtrusionLayer id="dungeon-extrusion" style={extrusionStyle} />
        <MapLibreGL.LineLayer id="dungeon-stroke" style={lineStyle} />
      </MapLibreGL.ShapeSource>
      <MapLibreGL.ShapeSource id="dungeon-labels-source" shape={labelGeoJson}>
        <MapLibreGL.SymbolLayer
          id="dungeon-labels"
          style={labelStyle}
          minZoomLevel={13}
        />
      </MapLibreGL.ShapeSource>
      <MapLibreGL.ShapeSource id="dungeon-icons-source" shape={labelGeoJson}>
        <MapLibreGL.SymbolLayer
          id="dungeon-icon-layer"
          style={iconStyle}
          minZoomLevel={12}
        />
      </MapLibreGL.ShapeSource>
      <DungeonEntryModal
        dungeon={selectedDungeon}
        onClose={() => setSelectedDungeon(null)}
      />
    </>
  );
}
