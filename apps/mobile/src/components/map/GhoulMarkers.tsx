import React, { useMemo } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { useGameStore } from '@/stores/game';
import { sprites } from '@/assets';

const GHOUL_IMAGES = {
  ghoul: sprites.ghoul,
};

const iconStyle = {
  iconImage: 'ghoul',
  iconSize: ['interpolate', ['linear'], ['zoom'], 10, 0.08, 14, 0.25, 16, 0.45, 20, 1.2],
  iconAllowOverlap: true,
  iconIgnorePlacement: true,
  iconOpacity: ['case', ['==', ['get', 'frozen'], true], 0.65, 1],
} as const;

export function GhoulMarkers() {
  const ghouls = useGameStore((s) => s.ghouls);

  const geojson = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: ghouls.map((g) => ({
      type: 'Feature' as const,
      properties: { id: g.id, frozen: g.frozen ?? false },
      geometry: {
        type: 'Point' as const,
        coordinates: [g.position.longitude, g.position.latitude] as [number, number],
      },
    })),
  }), [ghouls]);

  if (ghouls.length === 0) return null;

  return (
    <>
      <MapLibreGL.Images images={GHOUL_IMAGES} />
      <MapLibreGL.ShapeSource id="ghouls" shape={geojson}>
        <MapLibreGL.SymbolLayer id="ghoul-icons" style={iconStyle} />
      </MapLibreGL.ShapeSource>
    </>
  );
}
