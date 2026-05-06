import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { useResourceStore } from '@/stores/resources';
import { sprites } from '@/assets';
import { colors } from '@/theme';
import type { ResourceType } from '@undead/shared';

const RESOURCE_LABELS: Record<ResourceType, string> = {
  herb: 'Kraut',
  crystal: 'Kristall',
  relic: 'Relikt',
};

const RESOURCE_IMAGES = {
  'res-herb': sprites.resHerb,
  'res-crystal': sprites.resCrystal,
  'res-relic': sprites.resRelic,
};

const iconStyle = {
  iconImage: [
    'match', ['get', 'type'],
    'herb', 'res-herb',
    'crystal', 'res-crystal',
    'relic', 'res-relic',
    'res-herb',
  ],
  iconSize: ['interpolate', ['linear'], ['zoom'], 10, 0.08, 14, 0.25, 16, 0.45, 20, 1.2],
  iconAllowOverlap: true,
  iconIgnorePlacement: true,
} as const;

const labelStyle = {
  textField: ['get', 'label'],
  textSize: ['interpolate', ['linear'], ['zoom'], 12, 8, 15, 13, 18, 18],
  textColor: colors.gold,
  textHaloColor: 'rgba(0,0,0,0.8)',
  textHaloWidth: 1.5,
  textOffset: [0, -2.2] as [number, number],
  textAnchor: 'bottom' as const,
  textFont: ['Noto Serif Regular'],
  textAllowOverlap: true,
  textIgnorePlacement: true,
} as const;

export function ResourceMarkers() {
  const resources = useResourceStore((s) => s.resources);
  const [tappedId, setTappedId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const geojson = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: resources.map((r) => ({
      type: 'Feature' as const,
      properties: { id: r.id, type: r.type },
      geometry: {
        type: 'Point' as const,
        coordinates: [r.longitude, r.latitude] as [number, number],
      },
    })),
  }), [resources]);

  const labelGeojson = useMemo(() => {
    const r = tappedId ? resources.find((r) => r.id === tappedId) : null;
    return {
      type: 'FeatureCollection' as const,
      features: r
        ? [{
            type: 'Feature' as const,
            properties: { label: RESOURCE_LABELS[r.type as ResourceType] || r.type },
            geometry: {
              type: 'Point' as const,
              coordinates: [r.longitude, r.latitude] as [number, number],
            },
          }]
        : [],
    };
  }, [tappedId, resources]);

  const handlePress = useCallback((event: any) => {
    const feature = event?.features?.[0];
    if (!feature?.properties?.id) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setTappedId(feature.properties.id);
    timerRef.current = setTimeout(() => setTappedId(null), 2200);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <>
      <MapLibreGL.Images images={RESOURCE_IMAGES} />
      <MapLibreGL.ShapeSource id="resources" shape={geojson} onPress={handlePress}>
        <MapLibreGL.SymbolLayer id="resource-icons" style={iconStyle} />
      </MapLibreGL.ShapeSource>
      <MapLibreGL.ShapeSource id="resource-labels" shape={labelGeojson}>
        <MapLibreGL.SymbolLayer id="resource-label-text" style={labelStyle} />
      </MapLibreGL.ShapeSource>
    </>
  );
}
