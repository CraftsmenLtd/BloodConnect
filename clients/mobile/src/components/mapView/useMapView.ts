import type React from 'react'
import { useEffect, useState } from 'react'
import { LocationService } from '../../LocationService/LocationService'
import {
  DEFAULT_CENTER_COORDINATES,
  DEFAULT_ZOOM_LEVEL,
  MAX_ZOOM_LEVEL,
  WORLD_DIM
} from '../../setup/constant/consts'
import LOCAL_STORAGE_KEYS from '../../setup/constant/localStorageKeys'
import storageService from '../../utility/storageService'
import Constants from 'expo-constants'
import { Dimensions } from 'react-native'

const screenWidth = Dimensions.get('window').width

export type Marker = {
  coordinate: [number, number];
  component?: React.ReactElement;
  ripple?: boolean;
}

type BoundingBox = {
  center: [number, number];
  ne: [number, number]; // northeast [lon, lat]
  sw: [number, number]; // southwest [lon, lat]
}

type LocationWithOptions = {
  location: string;
  ripple?: boolean;
}

const { API_BASE_URL } = Constants.expoConfig?.extra ?? {}
const locationService = new LocationService(API_BASE_URL)

const getBoundingBox = (coordinates: [number, number][]): BoundingBox => {
  const lats = coordinates.map(c => c[1])
  const lons = coordinates.map(c => c[0])

  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLon = Math.min(...lons)
  const maxLon = Math.max(...lons)

  const center: [number, number] = [
    (minLon + maxLon) / 2,
    (minLat + maxLat) / 2,
  ]

  return {
    center,
    ne: [maxLon, maxLat],
    sw: [minLon, minLat],
  }
}

const getZoomLevel = (
  bbox: BoundingBox,
  mapWidth: number,
  mapHeight: number = 300,
  padding: number = 10
): number => {
  const latRad = (lat: number): number => {
    const sin = Math.sin((lat * Math.PI) / 180)
    return Math.log((1 + sin) / (1 - sin)) / 2
  }

  const neLatRad = latRad(bbox.ne[1])
  const swLatRad = latRad(bbox.sw[1])
  const latFraction = (neLatRad - swLatRad) / Math.PI

  const lngDiff = bbox.ne[0] - bbox.sw[0]
  const lngFraction = (lngDiff + 360) % 360 / 360

  const latZoom = Math.log(
    mapHeight * (1 - padding / mapHeight) /
    WORLD_DIM.height / latFraction
  ) / Math.LN2
  const lngZoom = Math.log(
    mapWidth * (1 - padding / mapWidth) /
    WORLD_DIM.width / lngFraction
  ) / Math.LN2

  return Math.min(Math.floor(Math.min(latZoom, lngZoom)) - 1, MAX_ZOOM_LEVEL)
}

const useMapView = (
  locations: (string | LocationWithOptions)[],
  markerComponent?: React.ReactElement
): {
  centerCoordinate: [number, number];
  mapMarkers: Marker[];
  zoomLevel: number;
} => {
  const [mapMarkers, setMapMarkers] = useState<Marker[]>([])
  const [zoomLevel, setZoomLevel] = useState<number>(DEFAULT_ZOOM_LEVEL)
  const [centerCoordinate, setCenterCoordinate] = useState<[number, number]>(
    DEFAULT_CENTER_COORDINATES
  )
  const [stableLocations, setStableLocations] = useState<LocationWithOptions[]>([])

  useEffect(() => {
    const normalized = locations.map(loc =>
      typeof loc === 'string' ? { location: loc } : loc
    )

    if (JSON.stringify(stableLocations) !== JSON.stringify(normalized)) {
      setStableLocations(normalized)
    }
  }, [locations])

  useEffect(() => {
    const fetchMarkers = async(): Promise<void> => {
      if (!stableLocations || stableLocations.length === 0) {
        setMapMarkers([])
        return
      }

      const coords: [number, number][] = []

      const newMarkers: Marker[] = await Promise.all(
        stableLocations.reduce<Promise<Marker>[]>((acc, { location, ripple }) => {
          if (location.trim() === '') {
            return acc
          }

          acc.push(
            (async(): Promise<Marker> => {
              let coordinate = await storageService.getItem<[number, number]>(
                `${LOCAL_STORAGE_KEYS.LOCATION_COORDINATE_PREFIX}-${location}`
              )

              if (!coordinate) {
                const { latitude, longitude } = await locationService.getLatLon(location)
                coordinate = [longitude, latitude]
                await storageService.storeItem(
                  `${LOCAL_STORAGE_KEYS.LOCATION_COORDINATE_PREFIX}-${location}`,
                  coordinate
                )
              }

              coords.push(coordinate)

              return {
                coordinate,
                component: markerComponent,
                ripple: ripple ?? false,
              }
            })()
          )

          return acc
        }, [])
      )

      setMapMarkers(newMarkers)

      if (coords.length === 0) {
        setZoomLevel(DEFAULT_ZOOM_LEVEL)
        setCenterCoordinate(DEFAULT_CENTER_COORDINATES)
        return
      }

      if (coords.length === 1) {
        setZoomLevel(DEFAULT_ZOOM_LEVEL)
        setCenterCoordinate(coords[0])
        return
      }

      const bbox = getBoundingBox(coords)
      const zoom = getZoomLevel(bbox, screenWidth, 300)
      setZoomLevel(zoom)
      setCenterCoordinate(bbox.center)
    }

    void fetchMarkers()
  }, [stableLocations])

  return {
    centerCoordinate,
    mapMarkers,
    zoomLevel,
  }
}

export default useMapView
