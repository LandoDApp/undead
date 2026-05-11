import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { useChestStore } from '@/stores/chests';
import { useEquipmentStore } from '@/stores/equipment';
import { useLocationStore } from '@/stores/location';
import { sprites } from '@/assets';
import { colors } from '@/theme';
import { CHEST_COLLECT_RADIUS, distanceMeters } from '@undead/shared';
import { api } from '@/services/api';
import type { ItemRarity } from '@undead/shared';

const RARITY_LABELS: Record<ItemRarity, string> = {
  common: 'Truhe',
  rare: 'Seltene Truhe',
  epic: 'Epische Truhe',
  legendary: 'Legendäre Truhe',
};

const CHEST_IMAGE = {
  'chest-icon': sprites.resRelic,
};

const iconStyle = {
  iconImage: 'chest-icon',
  iconSize: ['interpolate', ['linear'], ['zoom'], 10, 0.1, 14, 0.3, 16, 0.5, 20, 1.3],
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

export function ChestMarkers() {
  const chests = useChestStore((s) => s.chests);
  const [tappedId, setTappedId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openingRef = useRef(new Set<string>());

  const geojson = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: chests.map((c) => ({
      type: 'Feature' as const,
      properties: { id: c.id, rarity: c.rarity },
      geometry: {
        type: 'Point' as const,
        coordinates: [c.longitude, c.latitude] as [number, number],
      },
    })),
  }), [chests]);

  const labelGeojson = useMemo(() => {
    const c = tappedId ? chests.find((c) => c.id === tappedId) : null;
    return {
      type: 'FeatureCollection' as const,
      features: c
        ? [{
            type: 'Feature' as const,
            properties: { label: RARITY_LABELS[c.rarity as ItemRarity] || 'Truhe' },
            geometry: {
              type: 'Point' as const,
              coordinates: [c.longitude, c.latitude] as [number, number],
            },
          }]
        : [],
    };
  }, [tappedId, chests]);

  const handlePress = useCallback((event: any) => {
    const feature = event?.features?.[0];
    if (!feature?.properties?.id) return;
    const chestId = feature.properties.id;

    if (openingRef.current.has(chestId)) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    setTappedId(chestId);
    timerRef.current = setTimeout(() => setTappedId(null), 2200);

    // Try to open if in range
    const pos = useLocationStore.getState().position;
    if (!pos) return;

    const chest = useChestStore.getState().chests.find((c) => c.id === chestId);
    if (!chest) return;

    const dist = distanceMeters(pos, { latitude: chest.latitude, longitude: chest.longitude });
    if (dist > CHEST_COLLECT_RADIUS) return;

    openingRef.current.add(chestId);
    api.chests.open(chestId, pos.latitude, pos.longitude)
      .then((res) => {
        if (res.success && res.data?.opened) {
          useChestStore.getState().removeChest(chestId);
          useEquipmentStore.getState().setKeys(res.data.keysRemaining);
          if (res.data.item) {
            useEquipmentStore.getState().addItem(res.data.item);
          }
        }
      })
      .finally(() => {
        openingRef.current.delete(chestId);
      });
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <>
      <MapLibreGL.Images images={CHEST_IMAGE} />
      <MapLibreGL.ShapeSource id="chests" shape={geojson} onPress={handlePress}>
        <MapLibreGL.SymbolLayer id="chest-icons" style={iconStyle} />
      </MapLibreGL.ShapeSource>
      <MapLibreGL.ShapeSource id="chest-labels" shape={labelGeojson}>
        <MapLibreGL.SymbolLayer id="chest-label-text" style={labelStyle} />
      </MapLibreGL.ShapeSource>
    </>
  );
}
