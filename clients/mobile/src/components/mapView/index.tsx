import React, { useRef } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity
} from 'react-native'
import { Text } from '../text/AppText'
import { MaterialIcons } from '@expo/vector-icons'
import type {
  CameraRef
} from '@maplibre/maplibre-react-native'
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
import type { Marker } from './useMapView'
import { spacing, radius } from '../../setup/theme/tokens'

type MapViewProps = {
  centerCoordinate: [number, number];
  markers?: Marker[];
  zoomLevel?: number;
  style?: object;
}

/**
 * MapView Component
 * ------------------
 * A reusable map component built with `@maplibre/maplibre-react-native`,
 * displaying a raster tile map (OpenStreetMap by default) and customizable
 * markers. Supports zoom level and styling.
 *
 * Props:
 * -------
 * @param centerCoordinate - `[longitude, latitude]` coordinates to center the map view.
 * @param markers - Optional array of marker objects. Each marker includes:
 *                  - `coordinate`: [longitude, latitude]
 *                  - `component`: Optional custom React element to render at the marker
 *                  location.
 * @param zoomLevel - Optional number (default = 13) that controls the initial zoom level
 * of the map.
 * @param style - Optional custom style object to apply to the container.
 *
 * Example Usage:
 * ---------------
 * ```tsx
 * import { View, Text } from 'react-native';
 * import { MaterialIcons } from '@expo/vector-icons'
 * import MapView from './MapView'
 * import useMapView from './useMapView'
 *
 * const ExampleScreen = () => {
 *   const CustomMarker = (): React.ReactElement => {
 *     const theme = useTheme();
 *     const styles = createStyles(theme);
 *
 *     return (
 *       <MaterialIcons
 *         name={'location-pin'}
 *         size={32}
 *         color={theme.colors.primary}
 *         style={{
 *           width: 30,
 *           height: 40
 *         }}
 *       />
 *     )
 *   }
 *
 *   const { centerCoordinate, mapMarkers, zoomLevel } = useMapView(locations, CustomMarker)
 *
 *   return (
 *     <MapView
 *       centerCoordinate={centerCoordinate}
 *       zoomLevel={zoomLevel}
 *       markers={markers}
 *       style={{
 *         borderRadius: radius.md
 *       }}
 *     />
 *   )
 * }
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
}): React.ReactElement => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const cameraRef = useRef<CameraRef>(null)

  return (
    <View
      style={[styles.container, style]}
    >
      <MMapView
        style={StyleSheet.absoluteFill}
        mapStyle={StyleURL.Default}
        attributionEnabled={false}
        zoomEnabled={true}
        compassEnabled={true}
        rotateEnabled={true}
      >
        <RasterSource
          id="osm"
          tileUrlTemplates={[
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          ]}
          tileSize={256}>
          <RasterLayer id="osmTiles" sourceID="osm" style={{ rasterOpacity: 1 }} />
        </RasterSource>
        <Camera ref={cameraRef} centerCoordinate={centerCoordinate} zoomLevel={zoomLevel} />
        {markers.map((marker, index) => {
          const markerContent = React.isValidElement(marker.component)
            ? marker.component
            : <DefaultMarker />

          return (
            <MarkerView key={index} coordinate={marker.coordinate}>
              {markerContent}
            </MarkerView>
          )
        })}
      </MMapView>

      <ResetToInitialView
        cameraRef={cameraRef}
        centerCoordinate={centerCoordinate}
        zoomLevel={zoomLevel}
      />

      <MapAttribution />
    </View>
  )
}

const DefaultMarker = (): React.ReactElement => {
  const theme = useTheme()
  const styles = createStyles(theme)

  return (
    <MaterialIcons
      name={'location-pin'}
      size={32}
      color={theme.colors.primary}
      style={styles.markerContainer}
    />
  )
}

const ResetToInitialView = ({ cameraRef, centerCoordinate, zoomLevel }): React.ReactElement => {
  const theme = useTheme()
  const styles = createStyles(theme)

  const handlePress = (): void => {
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate,
        zoomLevel,
        animationDuration: 1000
      })
    }
  }

  return (
    <TouchableOpacity style={styles.resetButton} onPress={handlePress}>
      <MaterialIcons name="my-location" size={24} color={theme.colors.onPrimary} />
    </TouchableOpacity>
  )
}

const MapAttribution = (): React.ReactElement => {
  const theme = useTheme()
  const styles = createStyles(theme)

  return (
    <View style={styles.attributionContainer}>
      <Text style={styles.attributionText}>© OpenStreetMap Contributors</Text>
    </View>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      flex: 1,
      height: 300,
      overflow: 'hidden',
      marginTop: 2,
      borderColor: theme.colors.borderStrong
    },
    markerContainer: {
      width: 30,
      height: 40
    },
    attributionContainer: {
      position: 'absolute',
      bottom: 5,
      right: 10,
      backgroundColor: theme.colors.textSecondary,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.sm
    },
    attributionText: {
      fontSize: 10,
      color: theme.colors.onPrimary
    },
    resetButton: {
      position: 'absolute',
      bottom: 50,
      right: 15,
      backgroundColor: theme.colors.primary,
      padding: spacing.md,
      borderRadius: radius.xl,
      ...theme.elevation.md
    }
  })

export default MapView
