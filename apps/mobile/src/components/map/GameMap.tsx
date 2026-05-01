import React, { memo, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { colors, fontSize, fontFamily } from '@/theme';
import { useGameStore } from '@/stores/game';
import type { Bastion } from '@undead/shared';

let MapLibreGL: any = null;
let PlayerMarker: any = null;
let GhoulMarkers: any = null;
let CityStateLayer: any = null;
let ZoneInfoModal: any = null;
let ResourceMarkers: any = null;
let BastionMarkersComp: any = null;
let BastionPanelComp: any = null;

try {
  MapLibreGL = require('@maplibre/maplibre-react-native').default;
  PlayerMarker = require('./PlayerMarker').PlayerMarker;
  GhoulMarkers = require('./GhoulMarkers').GhoulMarkers;
  CityStateLayer = require('./CityStateLayer').CityStateLayer;
  ZoneInfoModal = require('./ZoneInfoModal').ZoneInfoModal;
  ResourceMarkers = require('./ResourceMarkers').ResourceMarkers;
  BastionMarkersComp = require('./BastionMarkers').BastionMarkers;
  BastionPanelComp = require('../bastion/BastionPanel').BastionPanel;
} catch {}

const MAPTILER_KEY = Constants.expoConfig?.extra?.mapTilerKey;

const MAP_STYLE_WANDEL = {
  version: 8,
  name: 'undead-parchment-day',
  glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${MAPTILER_KEY}`,
  sources: {
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
  },
  layers: [
    {
      id: 'bg',
      type: 'background',
      paint: {
        'background-color': '#f6edd6',
      },
    },
    {
      id: 'raster',
      type: 'raster',
      source: 'cartoLightNoLabels',
      paint: {
        'raster-opacity': 0.4,
        'raster-saturation': -0.6,
        'raster-contrast': 0.25,
        'raster-brightness-min': 0.2,
        'raster-brightness-max': 1.0,
        'raster-hue-rotate': 28,
      },
    },
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
        'background-color': '#d8c6a0',
      },
    },
    {
      id: 'raster',
      type: 'raster',
      source: 'cartoLightNoLabels',
      paint: {
        'raster-opacity': 0.35,
        'raster-saturation': -0.7,
        'raster-contrast': 0.35,
        'raster-brightness-min': 0.2,
        'raster-brightness-max': 0.8,
        'raster-hue-rotate': 210,
      },
    },
  ],
} as const;

const DEFAULT_CENTER: [number, number] = [8.8017, 53.0793];

export interface GameMapHandle {
  flyToPlayer: (lat: number, lon: number) => void;
}

const GameMapInner = memo(forwardRef<GameMapHandle, { mapStyle: any }>(function GameMapInner({ mapStyle }, ref) {
  const cameraRef = useRef<any>(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedBastion, setSelectedBastion] = useState<Bastion | null>(null);
  const [isBastionOwn, setIsBastionOwn] = useState(false);

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

  const handleBastionPress = useCallback((props: any) => {
    const { useBastionStore } = require('@/stores/bastion');
    const own = useBastionStore.getState().bastion;
    setIsBastionOwn(own?.id === props.id);

    setSelectedBastion({
      ...props,
      latitude: 0,
      longitude: 0,
      createdAt: 0,
    });
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
          {ResourceMarkers && <ResourceMarkers />}
          {BastionMarkersComp && <BastionMarkersComp onBastionPress={handleBastionPress} />}
          <GhoulMarkers />
          <PlayerMarker />
        </MapLibreGL.MapView>

        {/* TEXTURE */}
        <View pointerEvents="none" style={mapStyles.textureWrapper}>
          <Image
            source={require('@/assets/images/parchment.png')}
            style={mapStyles.textureOverlay}
            resizeMode="cover"
          />
        </View>

        {/* LIGHT SEPIA */}
        <View pointerEvents="none" style={mapStyles.sepiaOverlay} />

        {/* FRAME PNG */}
        <View pointerEvents="none" style={mapStyles.frameWrapper}>
          <Image
            source={require('@/assets/images/Frame.png')}
            style={mapStyles.frameOverlay}
            resizeMode="stretch"
          />
        </View>
      </View>

      {ZoneInfoModal && (
        <ZoneInfoModal zone={selectedZone} onClose={() => setSelectedZone(null)} />
      )}
      {BastionPanelComp && (
        <BastionPanelComp
          bastion={selectedBastion}
          isOwn={isBastionOwn}
          onClose={() => setSelectedBastion(null)}
        />
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

  textureWrapper: {
    ...StyleSheet.absoluteFillObject,
  },

  textureOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
  },

  sepiaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#b89a6a',
    opacity: 0.08,
  },

  frameWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  frameOverlay: {
    width: '100%',
    height: '100%',
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
    fontFamily: fontFamily.heading,
  },
});