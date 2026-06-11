import React, { useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Animated, Easing } from 'react-native'
import {
  MapView as MMapView,
  Camera,
  ShapeSource,
  FillLayer,
  LineLayer,
  MarkerView,
  RasterSource,
  RasterLayer,
  StyleURL
} from '@maplibre/maplibre-react-native'
import { MaterialIcons } from '@expo/vector-icons'
import useDonationSearchStatus from './useDonationSearchStatus'

type SearchStatusProps = {
  seekerId: string;
  requestPostId: string;
  createdAt: string;
  latitude: number;
  longitude: number;
}

type CircleGeojson = {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: [Array<[number, number]>];
  };
  properties: Record<string, never>;
}

const EARTH_RADIUS_KM = 6371
const CIRCLE_POINTS = 64
const INITIAL_SEARCH_RADIUS_KM = 2

export const getCircleGeoJson = (
  longitude: number,
  latitude: number,
  radiusKm: number
): CircleGeojson => {
  if (radiusKm <= 0) {
    return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[]] }, properties: {} }
  }

  const d = radiusKm / EARTH_RADIUS_KM
  const latRad = latitude * (Math.PI / 180)
  const lonRad = longitude * (Math.PI / 180)
  const coordinates: Array<[number, number]> = []

  for (let i = 0; i <= CIRCLE_POINTS; i++) {
    const bearing = (2 * Math.PI * i) / CIRCLE_POINTS
    const lat2 = Math.asin(
      Math.sin(latRad) * Math.cos(d) + Math.cos(latRad) * Math.sin(d) * Math.cos(bearing)
    )
    const lon2 = lonRad + Math.atan2(
      Math.sin(bearing) * Math.sin(d) * Math.cos(latRad),
      Math.cos(d) - Math.sin(latRad) * Math.sin(lat2)
    )
    coordinates.push([lon2 * (180 / Math.PI), lat2 * (180 / Math.PI)])
  }

  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coordinates] }, properties: {} }
}

export const getZoomLevel = (radiusKm: number): number => {
  if (radiusKm <= 0) return 13

  return Math.max(7, Math.round(13 - Math.log2(Math.max(1, radiusKm))))
}

export const getDisplayRadius = (radiusKm: number, isPending: boolean): number => {
  if (radiusKm > 0) return radiusKm
  if (isPending) return INITIAL_SEARCH_RADIUS_KM

  return 0
}

export const formatElapsedTime = (createdAt: string): string => {
  const elapsedMs = Math.max(0, Date.now() - new Date(createdAt).getTime())
  const totalMinutes = Math.floor(elapsedMs / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const days = Math.floor(hours / 24)
  const remainHours = hours % 24

  if (days > 0) return `${days}d ${remainHours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`

  return `${minutes}m`
}

type PulsingMarkerProps = {
  coordinate: [number, number];
  isPending: boolean;
}

const PulsingMarker = ({ coordinate, isPending }: PulsingMarkerProps): React.ReactElement => {
  const ring1 = useRef(new Animated.Value(0)).current
  const ring2 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!isPending) return

    const pulse = (anim: Animated.Value, delay: number): Animated.CompositeAnimation =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )

    const a1 = pulse(ring1, 0)
    const a2 = pulse(ring2, 900)

    a1.start()
    a2.start()

    return () => {
      a1.stop()
      a2.stop()
    }
  }, [isPending])

  const ringStyle = (anim: Animated.Value) => ({
    position: 'absolute' as const,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#E53935',
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.8] }) }],
  })

  return (
    <MarkerView coordinate={coordinate}>
      <View style={styles.pulsingMarkerContainer}>
        {isPending && <Animated.View style={ringStyle(ring1)} />}
        {isPending && <Animated.View style={ringStyle(ring2)} />}
        <MaterialIcons name="location-pin" size={32} color="#E53935" />
      </View>
    </MarkerView>
  )
}

const SearchStatus: React.FC<SearchStatusProps> = ({
  seekerId,
  requestPostId,
  createdAt,
  latitude,
  longitude
}) => {
  const { searchStatus, isLoading, error } = useDonationSearchStatus(seekerId, requestPostId, createdAt)
  const radiusKm = searchStatus?.currentSearchRadiusKm ?? 0
  const isPending = searchStatus?.donorSearchStatus === 'PENDING'
  const displayRadiusKm = getDisplayRadius(radiusKm, isPending)
  const circleGeoJson = getCircleGeoJson(longitude, latitude, displayRadiusKm)
  const zoomLevel = getZoomLevel(displayRadiusKm)
  const elapsedTime = formatElapsedTime(createdAt)
  const centerCoordinate: [number, number] = [longitude, latitude]

  if (isLoading && searchStatus === null) {
    return (
      <View testID="search-status-skeleton" style={styles.skeleton}>
        <View style={styles.skeletonMap} />
        <View style={styles.skeletonMetrics} />
      </View>
    )
  }

  return (
    <View testID="search-status-container" style={styles.container}>
      <View testID="search-status-map" style={styles.mapContainer}>
        <MMapView
          style={StyleSheet.absoluteFill}
          mapStyle={StyleURL.Default}
          attributionEnabled={false}
        >
          <RasterSource
            id="osm-ss"
            tileUrlTemplates={['https://tile.openstreetmap.org/{z}/{x}/{y}.png']}
            tileSize={256}
          >
            <RasterLayer id="osmTiles-ss" sourceID="osm-ss" style={{ rasterOpacity: 1 }} />
          </RasterSource>
          <Camera
            centerCoordinate={centerCoordinate}
            zoomLevel={zoomLevel}
            animationDuration={1500}
            animationMode="easeTo"
          />
          {displayRadiusKm > 0 && (
            <>
              <ShapeSource id="search-radius" shape={circleGeoJson as unknown as Parameters<typeof ShapeSource>[0]['shape']}>
                <FillLayer id="radius-fill" sourceID="search-radius" style={{ fillColor: '#E53935', fillOpacity: 0.15 }} />
              </ShapeSource>
              <ShapeSource id="search-radius-outline" shape={circleGeoJson as unknown as Parameters<typeof ShapeSource>[0]['shape']}>
                <LineLayer id="radius-outline" sourceID="search-radius-outline" style={{ lineColor: '#E53935', lineWidth: 2 }} />
              </ShapeSource>
            </>
          )}
          <PulsingMarker coordinate={centerCoordinate} isPending={isPending} />
        </MMapView>

        <View style={styles.radiusLabel} testID="search-status-radius-label">
          <Text style={styles.radiusLabelText}>
            {radiusKm > 0 ? `${radiusKm.toFixed(1)} km radius` : 'Starting search…'}
          </Text>
        </View>
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue} testID="search-status-notified-count">
            {searchStatus?.notifiedDonorsCount ?? 0}
          </Text>
          <Text style={styles.metricLabel}>Notified</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue} testID="search-status-accepted-count">
            {searchStatus?.acceptedDonorsCount ?? 0}
          </Text>
          <Text style={styles.metricLabel}>Accepted</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue} testID="search-status-rejected-count">
            {searchStatus?.rejectedDonorsCount ?? 0}
          </Text>
          <Text style={styles.metricLabel}>Rejected</Text>
        </View>
      </View>

      <Text testID="search-status-elapsed-time" style={styles.elapsedTime}>
        {'Searching for '}
        {elapsedTime}
      </Text>

      {error !== null && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginTop: 8
  },
  mapContainer: {
    height: 200,
    overflow: 'hidden'
  },
  pulsingMarkerContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center'
  },
  radiusLabel: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  radiusLabelText: {
    color: '#fff',
    fontSize: 12
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  metricItem: {
    alignItems: 'center'
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333'
  },
  metricLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2
  },
  elapsedTime: {
    textAlign: 'center',
    color: '#666',
    fontSize: 13,
    paddingBottom: 12
  },
  errorText: {
    color: '#E53935',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8
  },
  skeleton: {
    marginTop: 8
  },
  skeletonMap: {
    height: 200,
    backgroundColor: '#e0e0e0'
  },
  skeletonMetrics: {
    height: 60,
    backgroundColor: '#f5f5f5',
    marginTop: 4
  }
})

export default SearchStatus
