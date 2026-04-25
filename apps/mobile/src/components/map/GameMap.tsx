import React, { useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize } from '@/theme';

let MapLibreGL: any = null;
let PlayerMarker: any = null;
let ZombieMarkers: any = null;
let SafeZoneLayer: any = null;
let ZoneInfoModal: any = null;
let CollectiblePointMarkers: any = null;

try {
  MapLibreGL = require('@maplibre/maplibre-react-native').default;
  PlayerMarker = require('./PlayerMarker').PlayerMarker;
  ZombieMarkers = require('./ZombieMarkers').ZombieMarkers;
  SafeZoneLayer = require('../safe-zone/SafeZoneLayer').SafeZoneLayer;
  ZoneInfoModal = require('../safe-zone/ZoneInfoModal').ZoneInfoModal;
  CollectiblePointMarkers = require('./CollectiblePointMarkers').CollectiblePointMarkers;
} catch {
  // Expo Go fallback
}

// Inline OSM raster style — kein externer Style-Server nötig, funktioniert immer
const OSM_STYLE = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    'osm-raster': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm-raster',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// Default Startpunkt Bremen
const DEFAULT_CENTER: [number, number] = [8.8017, 53.0793];
const DEFAULT_ZOOM = 15;

interface SelectedZone {
  id: string;
  name: string;
  charge: number;
  isFallen: boolean;
  radius: number;
  maxCharge?: number;
  upgradeLevel?: number;
  baseRadius?: number;
}

export interface GameMapHandle {
  flyToPlayer: (lat: number, lon: number) => void;
}

export const GameMap = forwardRef<GameMapHandle>(function GameMap(_props, ref) {
  const cameraRef = useRef<any>(null);
  const [selectedZone, setSelectedZone] = useState<SelectedZone | null>(null);

  useImperativeHandle(ref, () => ({
    flyToPlayer: (lat: number, lon: number) => {
      cameraRef.current?.flyTo([lon, lat], 600);
    },
  }));

  // Stable callback reference - prevents SafeZoneLayer re-renders
  const handleZonePress = useCallback((zone: SelectedZone) => {
    setSelectedZone(zone);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedZone(null);
  }, []);

  if (!MapLibreGL) {
    return (
      <View style={fallbackStyles.container}>
        <Text style={fallbackStyles.title}>Map nicht verfügbar</Text>
        <Text style={fallbackStyles.text}>
          Native MapLibre Modul nicht geladen.
        </Text>
      </View>
    );
  }

  return (
    <>
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle={OSM_STYLE}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: DEFAULT_CENTER,
            zoomLevel: DEFAULT_ZOOM,
          }}
        />

        <SafeZoneLayer onZonePress={handleZonePress} />
        {CollectiblePointMarkers && <CollectiblePointMarkers />}
        <ZombieMarkers />
        <PlayerMarker />
      </MapLibreGL.MapView>

      {ZoneInfoModal && (
        <ZoneInfoModal zone={selectedZone} onClose={handleCloseModal} />
      )}
    </>
  );
});

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

const fallbackStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  text: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
});
