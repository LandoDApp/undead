import React, { memo, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { colors, fontSize, fontFamily } from '@/theme';
import { useGameStore } from '@/stores/game';

let MapLibreGL: any = null;
let PlayerMarker: any = null;
let GhoulMarkers: any = null;
let CityStateLayer: any = null;
let ZoneInfoModal: any = null;
let ResourceMarkers: any = null;
let ChestMarkers: any = null;
let DungeonLayer: any = null;

try {
  MapLibreGL = require('@maplibre/maplibre-react-native').default;
  PlayerMarker = require('./PlayerMarker').PlayerMarker;
  GhoulMarkers = require('./GhoulMarkers').GhoulMarkers;
  CityStateLayer = require('./CityStateLayer').CityStateLayer;
  ZoneInfoModal = require('./ZoneInfoModal').ZoneInfoModal;
  ResourceMarkers = require('./ResourceMarkers').ResourceMarkers;
  ChestMarkers = require('./ChestMarkers').ChestMarkers;
  DungeonLayer = require('./DungeonLayer').DungeonLayer;
} catch {}

const MAPTILER_KEY = Constants.expoConfig?.extra?.mapTilerKey;

const MAP_SOURCES = {
  cartoLightNoLabels: {
    type: 'raster',
    tiles: [
      'https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
      'https://b.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
      'https://c.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
      'https://d.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
    ],
    tileSize: 256,
  },
  openmaptiles: {
    type: 'vector',
    url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_KEY}`,
  },
};

const LABEL_FONT = ['Noto Serif Regular'];

const VECTOR_LAYERS_WANDEL = [
  // Buildings
  {
    id: 'building-fill',
    type: 'fill',
    source: 'openmaptiles',
    'source-layer': 'building',
    minzoom: 14,
    paint: {
      'fill-color': '#8a8078',
      'fill-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0.15, 16, 0.35],
    },
  },
  {
    id: 'building-outline',
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'building',
    minzoom: 15,
    paint: {
      'line-color': '#6a5f55',
      'line-width': 0.6,
      'line-opacity': ['interpolate', ['linear'], ['zoom'], 15, 0.2, 17, 0.45],
    },
  },
  // Water
  {
    id: 'water-fill',
    type: 'fill',
    source: 'openmaptiles',
    'source-layer': 'water',
    minzoom: 8,
    paint: {
      'fill-color': '#5b8fa8',
      'fill-opacity': 0.35,
    },
  },
  {
    id: 'waterway-line',
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'waterway',
    minzoom: 12,
    paint: {
      'line-color': '#5b8fa8',
      'line-width': 1.5,
      'line-opacity': 0.5,
    },
  },
  {
    id: 'road-major',
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'transportation',
    minzoom: 8,
    filter: ['in', 'class', 'motorway', 'trunk', 'primary', 'secondary', 'tertiary'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#3a3228',
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.8, 15, 1.8, 18, 3],
      'line-opacity': 0.55,
    },
  },
  {
    id: 'road-minor',
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'transportation',
    minzoom: 13,
    filter: ['in', 'class', 'minor', 'service', 'track', 'path'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#5a4632',
      'line-width': ['interpolate', ['linear'], ['zoom'], 13, 0.5, 15, 1.0, 18, 2],
      'line-opacity': 0.4,
    },
  },
  // Road labels
  {
    id: 'road-label',
    type: 'symbol',
    source: 'openmaptiles',
    'source-layer': 'transportation_name',
    minzoom: 14,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': LABEL_FONT,
      'text-size': ['interpolate', ['linear'], ['zoom'], 14, 10, 18, 14],
      'symbol-placement': 'line',
      'text-rotation-alignment': 'map',
      'text-max-angle': 30,
    },
    paint: {
      'text-color': '#3a2a18',
      'text-halo-color': '#e6d3ad',
      'text-halo-width': 1.5,
      'text-opacity': 0.85,
    },
  },
  // Place labels (neighborhoods, suburbs, villages — NOT countries/states)
  {
    id: 'place-label',
    type: 'symbol',
    source: 'openmaptiles',
    'source-layer': 'place',
    minzoom: 12,
    filter: ['in', 'class', 'town', 'village', 'hamlet', 'suburb', 'quarter', 'neighbourhood'],
    layout: {
      'text-field': ['get', 'name'],
      'text-font': LABEL_FONT,
      'text-size': ['interpolate', ['linear'], ['zoom'], 12, 11, 16, 16],
      'text-anchor': 'center',
      'text-transform': 'uppercase',
      'text-letter-spacing': 0.1,
    },
    paint: {
      'text-color': '#2f1f14',
      'text-halo-color': '#e6d3ad',
      'text-halo-width': 1.8,
      'text-opacity': 0.8,
    },
  },
  // Water labels
  {
    id: 'water-label',
    type: 'symbol',
    source: 'openmaptiles',
    'source-layer': 'water_name',
    minzoom: 12,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': LABEL_FONT,
      'text-size': ['interpolate', ['linear'], ['zoom'], 12, 10, 16, 14],
      'text-letter-spacing': 0.15,
    },
    paint: {
      'text-color': '#2a4a5a',
      'text-halo-color': '#c8dde8',
      'text-halo-width': 1.2,
      'text-opacity': 0.8,
    },
  },
];

const VECTOR_LAYERS_JAGD = [
  // Buildings (Jagd — darker stone)
  {
    id: 'building-fill',
    type: 'fill',
    source: 'openmaptiles',
    'source-layer': 'building',
    minzoom: 14,
    paint: {
      'fill-color': '#3a3530',
      'fill-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0.2, 16, 0.4],
    },
  },
  {
    id: 'building-outline',
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'building',
    minzoom: 15,
    paint: {
      'line-color': '#4a4540',
      'line-width': 0.6,
      'line-opacity': ['interpolate', ['linear'], ['zoom'], 15, 0.25, 17, 0.5],
    },
  },
  // Water
  {
    id: 'water-fill',
    type: 'fill',
    source: 'openmaptiles',
    'source-layer': 'water',
    minzoom: 8,
    paint: {
      'fill-color': '#2a4a5a',
      'fill-opacity': 0.4,
    },
  },
  {
    id: 'waterway-line',
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'waterway',
    minzoom: 12,
    paint: {
      'line-color': '#2a4a5a',
      'line-width': 1.5,
      'line-opacity': 0.5,
    },
  },
  {
    id: 'road-major',
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'transportation',
    minzoom: 8,
    filter: ['in', 'class', 'motorway', 'trunk', 'primary', 'secondary', 'tertiary'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#6a5a4a',
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.8, 15, 1.8, 18, 3],
      'line-opacity': 0.5,
    },
  },
  {
    id: 'road-minor',
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'transportation',
    minzoom: 13,
    filter: ['in', 'class', 'minor', 'service', 'track', 'path'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#5a4a3a',
      'line-width': ['interpolate', ['linear'], ['zoom'], 13, 0.5, 15, 1.0, 18, 2],
      'line-opacity': 0.4,
    },
  },
  // Road labels (Jagd — dimmer)
  {
    id: 'road-label',
    type: 'symbol',
    source: 'openmaptiles',
    'source-layer': 'transportation_name',
    minzoom: 14,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': LABEL_FONT,
      'text-size': ['interpolate', ['linear'], ['zoom'], 14, 10, 18, 14],
      'symbol-placement': 'line',
      'text-rotation-alignment': 'map',
      'text-max-angle': 30,
    },
    paint: {
      'text-color': '#8a7a60',
      'text-halo-color': '#1a1510',
      'text-halo-width': 1.2,
      'text-opacity': 0.6,
    },
  },
  // Place labels (Jagd)
  {
    id: 'place-label',
    type: 'symbol',
    source: 'openmaptiles',
    'source-layer': 'place',
    minzoom: 12,
    filter: ['in', 'class', 'town', 'village', 'hamlet', 'suburb', 'quarter', 'neighbourhood'],
    layout: {
      'text-field': ['get', 'name'],
      'text-font': LABEL_FONT,
      'text-size': ['interpolate', ['linear'], ['zoom'], 12, 11, 16, 16],
      'text-anchor': 'center',
      'text-transform': 'uppercase',
      'text-letter-spacing': 0.1,
    },
    paint: {
      'text-color': '#9a8a6a',
      'text-halo-color': '#1a1510',
      'text-halo-width': 1.5,
      'text-opacity': 0.65,
    },
  },
  // Water labels (Jagd)
  {
    id: 'water-label',
    type: 'symbol',
    source: 'openmaptiles',
    'source-layer': 'water_name',
    minzoom: 12,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': LABEL_FONT,
      'text-size': ['interpolate', ['linear'], ['zoom'], 12, 10, 16, 14],
      'text-letter-spacing': 0.15,
    },
    paint: {
      'text-color': '#4a7a8a',
      'text-halo-color': '#1a1510',
      'text-halo-width': 1.0,
      'text-opacity': 0.55,
    },
  },
];

const MAP_STYLE_WANDEL = {
  version: 8,
  name: 'undead-parchment-day',
  glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${MAPTILER_KEY}`,
  sources: MAP_SOURCES,
  layers: [
    {
      id: 'bg',
      type: 'background',
      paint: {
        'background-color': '#f4e8c1',
      },
    },
    {
      id: 'raster',
      type: 'raster',
      source: 'cartoLightNoLabels',
      paint: {
        'raster-opacity': 0.55,
        'raster-saturation': -0.35,
        'raster-contrast': 0.3,
        'raster-brightness-min': 0.15,
        'raster-brightness-max': 0.95,
        'raster-hue-rotate': 15,
      },
    },
    ...VECTOR_LAYERS_WANDEL,
  ],
} as const;

const MAP_STYLE_JAGD = {
  ...MAP_STYLE_WANDEL,
  name: 'undead-parchment-night',
  layers: [
    {
      id: 'bg',
      type: 'background',
      paint: {
        'background-color': '#2a2218',
      },
    },
    {
      id: 'raster',
      type: 'raster',
      source: 'cartoLightNoLabels',
      paint: {
        'raster-opacity': 0.45,
        'raster-saturation': -0.5,
        'raster-contrast': 0.4,
        'raster-brightness-min': 0.05,
        'raster-brightness-max': 0.55,
        'raster-hue-rotate': 200,
      },
    },
    ...VECTOR_LAYERS_JAGD,
  ],
} as const;

const DEFAULT_CENTER: [number, number] = [8.8017, 53.0793];

export interface GameMapHandle {
  flyToPlayer: (lat: number, lon: number) => void;
}

const GameMapInner = memo(forwardRef<GameMapHandle, { mapStyle: any }>(function GameMapInner({ mapStyle }, ref) {
  const cameraRef = useRef<any>(null);
  const [selectedZone, setSelectedZone] = useState(null);

  useImperativeHandle(ref, () => ({
    flyToPlayer: (lat: number, lon: number) => {
      cameraRef.current?.setCamera({
        centerCoordinate: [lon, lat],
        pitch: 52,
        animationDuration: 600,
      });
    },
  }));

  const handleZonePress = useCallback((zone: any) => {
    setSelectedZone(zone);
  }, []);


  if (!MapLibreGL) {
    return (
      <View style={fallbackStyles.container}>
        <Text style={fallbackStyles.title}>Map nicht verfügbar</Text>
      </View>
    );
  }

  return (
    <>
      <View style={mapStyles.mapContainer}>
        <MapLibreGL.MapView
          style={mapStyles.map}
          mapStyle={mapStyle}
          logoEnabled={false}
          attributionEnabled={false}
        >
          <MapLibreGL.Camera
            ref={cameraRef}
            defaultSettings={{
              centerCoordinate: DEFAULT_CENTER,
              zoomLevel: 15,
              pitch: 52,
            }}
          />

          <CityStateLayer onZonePress={handleZonePress} />
          {DungeonLayer && <DungeonLayer />}
          {ResourceMarkers && <ResourceMarkers />}
          {ChestMarkers && <ChestMarkers />}
          <GhoulMarkers />
          <PlayerMarker />
        </MapLibreGL.MapView>
      </View>

      {ZoneInfoModal && (
        <ZoneInfoModal zone={selectedZone} onClose={() => setSelectedZone(null)} />
      )}
    </>
  );
}));

export const GameMap = forwardRef<GameMapHandle>(function GameMap(_, ref) {
  const gameMode = useGameStore((s) => s.gameMode);
  const style = gameMode === 'jagd' ? MAP_STYLE_JAGD : MAP_STYLE_WANDEL;

  return <GameMapInner ref={ref} mapStyle={style} />;
});

const mapStyles = StyleSheet.create({
  mapContainer: { flex: 1 },
  map: { flex: 1 },
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
    fontFamily: fontFamily.heading,
  },
});