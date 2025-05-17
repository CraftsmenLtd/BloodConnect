import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { BloodGroup } from '../../../../commons/dto/DonationDTO'
import { MARKER_CONTROL_CLASS, POPUP_CONTROL_CLASS } from '../constants/constants'

export type LatLong = { latitude: number; longitude: number }

export enum MapDataPointType {
  MARKER = 'marker',
  POPUP = 'popup'
}
export type MapDataPoint = {
  id: string;
  longitude: number;
  latitude: number;
  type: MapDataPointType.POPUP;
  content: Partial<{
    [K in BloodGroup]: number;
  }>;
  onBloodGroupCountClick: (type: BloodGroup, geohash: string) => void;
} | {
  id: string;
  longitude: number;
  latitude: number;
  type: MapDataPointType.MARKER;
  color: string;
};

type GeohashMapProps = {
  data: MapDataPoint[];
  initialCenter?: [number, number];
  onCenterChange?: (arg: LatLong) => void;
  center: LatLong;
};

const GeohashMap = ({
  data,
  onCenterChange,
  center
}: GeohashMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)

  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLngLat([center.longitude, center.latitude])
      mapRef.current.setCenter([center.longitude, center.latitude])
    }
  }, [center.latitude, center.longitude])


  useEffect(() => {
    if (!mapContainerRef.current) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
          },
        ],
      },
      center: [center.longitude, center.latitude],
      zoom: 15,
    })

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right')

    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      }),
      'bottom-right'
    )

    const centerMarker = new maplibregl.Marker({ color: 'black' })
      .setLngLat([center.longitude, center.latitude])
      .addTo(map)

    map.on('drag', () => {
      const newCenter = mapRef.current!.getCenter()
      centerMarker.setLngLat(newCenter)
    })

    map.on('dragend', () => {
      const stableCenter = mapRef.current!.getCenter()
      onCenterChange?.({ latitude: stableCenter.lat, longitude: stableCenter.lng })
    })

    mapRef.current = map
    markerRef.current = centerMarker

    return () => {
      map.remove()
    }
  }, [])

  document.querySelectorAll(`.${MARKER_CONTROL_CLASS}`).forEach(el => el.remove())
  document.querySelectorAll(`.${POPUP_CONTROL_CLASS}`).forEach(el => el.remove())

  data.forEach((point) => {
    if (point.type === MapDataPointType.MARKER) {
      const markerId = `marker-${point.id}`
      // Remove marker with current id if exists
      document.getElementById(markerId)?.remove()

      // Get all markers at the same lat/lng, regardless of color
      const allMarkersAtLocation = document.querySelectorAll(
        `[data-lat="${point.latitude}"][data-lng="${point.longitude}"]`
      )

      // Among those, filter markers with the same color
      const sameColorMarkers = Array.from(allMarkersAtLocation).filter(
        (el) => el.getAttribute('data-color') === point.color
      )

      // Remove all same-color markers at this lat/lng to avoid duplicates
      sameColorMarkers.forEach((el) => el.remove())

      // Count how many markers of same color+lat/lng exist in your `data` array
      const sameColorCount = data.filter(
        (p) =>
          p.type === MapDataPointType.MARKER &&
      p.latitude === point.latitude &&
      p.longitude === point.longitude &&
      p.color === point.color
      ).length

      // Add one marker for this color+location
      const marker = new maplibregl.Marker({ color: point.color })
        .setLngLat([point.longitude, point.latitude])
        .addTo(mapRef.current!)

      const markerElement = marker.getElement()
      markerElement.id = markerId
      markerElement.setAttribute('data-lat', point.latitude.toString())
      markerElement.setAttribute('data-lng', point.longitude.toString())
      markerElement.setAttribute('data-color', point.color)
      markerElement.classList.add(MARKER_CONTROL_CLASS)

      // If more than one marker of this color at this location, add/update badge
      if (sameColorCount > 1) {
        const existingBadge = markerElement.querySelector('.marker-counter')
        if (!existingBadge) {
          const badge = document.createElement('div')
          badge.className = 'marker-counter'
          Object.assign(badge.style, {
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '12px',
            lineHeight: '18px',
            textAlign: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            boxShadow: '0 0 4px rgba(0,0,0,0.6)',
            position: 'absolute',
            top: '-8px',
            right: '16pxpx',
          })
          markerElement.appendChild(badge)
          badge.textContent = (2).toString()
        }
        else {
          existingBadge.textContent = sameColorCount.toString()
        }
      }

      // Now check if there are other markers at same lat/lng but different color
      const otherColorMarkers = Array.from(allMarkersAtLocation).filter(
        (el) => el.getAttribute('data-color') !== point.color
      )

      if (otherColorMarkers.length > 0) {
        // Rotate and offset this new marker a bit to avoid perfect overlap
        const randomRotation = (Math.random() - 0.5) * 30 // -15deg to +15deg
        markerElement.style.transform += ` rotate(${randomRotation}deg) translate(2px, 2px)`
      }
    } else {
      const popupId = `popup-${point.id}`
      const identifyingClassName = 'blood-group-count'
      document.getElementById(popupId)?.remove()
      const contentHtml = `${Object.entries(point.content || {})
        .map(([bloodGroup, value]) => {

          return `<div class="${identifyingClassName}" data-blood-group=${
            bloodGroup} style="cursor: pointer;">
              ${bloodGroup}: <text style="color: red;">${value}</text>
            </div>`
        })
        .join('')}<strong>${point.id}</strong>`

      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false })
        .setLngLat([point.longitude, point.latitude])
        .setHTML(contentHtml)
        .addTo(mapRef.current!)

      const popUpElement = popup.getElement()

      popUpElement.id = popupId
      popUpElement.classList.add(POPUP_CONTROL_CLASS)
      popUpElement
        .querySelectorAll(`.${identifyingClassName}`)
        .forEach(el => {
          const bloodGroup = el.getAttribute('data-blood-group') as BloodGroup
          el.addEventListener('click', () => {
            point.onBloodGroupCountClick(bloodGroup, point.id)
          })
        })
    }
  })

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: '100%'
      }}
    />
  )
}

export default GeohashMap
