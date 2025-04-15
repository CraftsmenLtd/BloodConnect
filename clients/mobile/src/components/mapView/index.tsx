import React from 'react'
import { View, StyleSheet, Text } from 'react-native';
import {
  MapView as MMapView,
  Camera,
  MarkerView,
  RasterSource,
  RasterLayer,
  StyleURL
} from '@maplibre/maplibre-react-native'
import type { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'

type Marker = {
  coordinate: [number, number];
  component?: React.ReactElement;
};

type MapViewProps = {
  centerCoordinate: [number, number];
  markers?: Marker[];
  zoomLevel?: number;
  style?: object;
};

/**
 * MapView Component
 * ------------------
 * A reusable map component built with `@maplibre/maplibre-react-native`, displaying a raster tile map
 * (OpenStreetMap by default) and customizable markers. Supports zoom level and styling.
 *
 * Props:
 * -------
 * @param centerCoordinate - `[longitude, latitude]` coordinates to center the map view.
 * @param markers - Optional array of marker objects. Each marker includes:
 *                  - `coordinate`: [longitude, latitude]
 *                  - `component`: Optional custom React element to render at the marker location.
 * @param zoomLevel - Optional number (default = 13) that controls the initial zoom level of the map.
 * @param style - Optional custom style object to apply to the container.
 *
 * Example Usage:
 * ---------------
 * ```tsx
 * import MapView from './MapView';
 * import useMapView from './useMapView';
 * import { View, Text } from 'react-native';
 *
 * const ExampleScreen = () => {
 *   const { mapMarkers, zoomLevel } = useMapView(locations) // locations -> string[]
 *
 *   return (
 *     <MapView
 *       centerCoordinate={[90.4125, 23.8103]}
 *       zoomLevel={10}
 *       markers={markers}
 *       style={{
 *         borderRadius: 6
 *       }}
 *     />
 *   );
 * };
 * ```
 *
 * Dependencies:
 * - @maplibre/maplibre-react-native
 *
 */
const MapView: React.FC<MapViewProps> = ({
  centerCoordinate,
  markers = [],
  zoomLevel = 13,
  style = {}
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.container, style]}>
      <MMapView
        style={StyleSheet.absoluteFill}
        mapStyle={StyleURL.Default}
        attributionEnabled={false}
      >
        <RasterSource
          id="osm"
          tileUrlTemplates={[
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          ]}
          tileSize={256}>
          <RasterLayer id="osmTiles" sourceID="osm" style={{ rasterOpacity: 1 }} />
        </RasterSource>
        <Camera
          zoomLevel={zoomLevel}
          centerCoordinate={centerCoordinate}
        />
        {markers.map((marker, index) => {
          const markerContent = React.isValidElement(marker.component)
            ? marker.component
            : <DefaultMarker />;

          return (
            <MarkerView key={index} coordinate={marker.coordinate}>
              {markerContent}
            </MarkerView>
          );
        })}
      </MMapView>
      <MapAttribution />
    </View>
  );
};

const DefaultMarker = () => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.markerContainer}>
      <View style={styles.pinHead}>
        <View style={styles.innerDot} />
      </View>
      <View style={styles.pinTail} />
    </View>
  );
};

const MapAttribution = () => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.attributionContainer}>
      <Text style={styles.attributionText}>© OpenStreetMap contributors</Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      height: 300,
      overflow: 'hidden',
      marginTop: 2,
      borderColor: theme.colors.lightGrey
    },
    markerContainer: {
      width: 30,
      height: 40,
      alignItems: 'center',
      justifyContent: 'flex-start',
      backgroundColor: 'transparent'
    },
    pinHead: {
      width: 24,
      height: 24,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: 'red',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 4,
    },
    innerDot: {
      width: 8,
      height: 8,
      backgroundColor: 'white',
      borderRadius: 4,
    },
    pinTail: {
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderTopWidth: 10,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: theme.colors.primary,
      marginTop: -2,
    },
    attributionContainer: {
      position: 'absolute',
      bottom: 5,
      right: 10,
      backgroundColor: theme.colors.textSecondary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    attributionText: {
      fontSize: 10,
      color: theme.colors.white,
    }
  });

export default MapView;