import type React from 'react';
import { useEffect, useState } from 'react'
import { LocationService } from '../../LocationService/LocationService'
import storageService from '../../utility/storageService'
import Constants from 'expo-constants'
import { Dimensions } from 'react-native'

const screenWidth = Dimensions.get('window').width

export type Marker = {
  coordinate: [number, number];
  component?: React.ReactElement;
}

type BoundingBox = {
  ne: [number, number]; // northeast [lon, lat]
  sw: [number, number]; // southwest [lon, lat]
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

  return {
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
  const WORLD_DIM = { width: 256, height: 256 }
  const ZOOM_MAX = 22

  const latRad = (lat: number): number => {
    const sin = Math.sin((lat * Math.PI) / 180)
    return Math.log((1 + sin) / (1 - sin)) / 2
  }

  const neLatRad = latRad(bbox.ne[1])
  const swLatRad = latRad(bbox.sw[1])
  const latFraction = (neLatRad - swLatRad) / Math.PI

  const lngDiff = bbox.ne[0] - bbox.sw[0]
  const lngFraction = (lngDiff + 360) % 360 / 360

  const latZoom = Math.log(mapHeight * (1 - padding / mapHeight) / WORLD_DIM.height / latFraction) / Math.LN2
  const lngZoom = Math.log(mapWidth * (1 - padding / mapWidth) / WORLD_DIM.width / lngFraction) / Math.LN2

  return Math.min(Math.floor(Math.min(latZoom, lngZoom)) - 1, ZOOM_MAX)
}

const useMapView = (
  locations: string[],
  markerComponent?: React.ReactElement
): {
  mapMarkers: Marker[];
  zoomLevel: number;
} => {
  const [mapMarkers, setMapMarkers] = useState<Marker[]>([])
  const [zoomLevel, setZoomLevel] = useState<number>(13)

  useEffect(() => {
    const fetchMarkers = async(): Promise<void> => {
      if (!locations || locations.length === 0) {
        setMapMarkers([])
        return
      }

      const newMarkers: Marker[] = await Promise.all(
        locations.map(async(location): Promise<Marker> => {
          const cached = await storageService.getItem<[number, number]>(`location-coord-${location}`)
          if (cached) return { coordinate: cached, component: markerComponent }

          const { latitude, longitude } = await locationService.getLatLon(location)
          const coordinate: [number, number] = [longitude, latitude]
          await storageService.storeItem(`location-coord-${location}`, coordinate)

          return { coordinate, component: markerComponent }
        })
      )

      setMapMarkers(newMarkers)

      const coords = newMarkers.map(marker => marker.coordinate)
      if (coords.length > 1) {
        const bbox = getBoundingBox(coords)
        const zoom = getZoomLevel(bbox, screenWidth, 300)
        setZoomLevel(zoom)
      }
    }

    void fetchMarkers()
  }, [locations, markerComponent])

  return {
    mapMarkers,
    zoomLevel,
  }
}

export default useMapView
