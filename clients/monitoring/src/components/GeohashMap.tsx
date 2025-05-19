import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { AcceptDonationStatus, BloodGroup } from '../../../../commons/dto/DonationDTO'
import { HTML_DATA_BLOOD_GROUP_KEY, 
  DONOR_CONTROL_CLASS, 
  MARKER_POINT_COLOR_STATUS_MAP, 
  REQUEST_CONTROL_CLASS } from '../constants/constants'
import type { Feature, GeoJsonProperties, LineString } from 'geojson';


export type LatLong = { latitude: number; longitude: number }

export enum MapDataPointType {
  DONOR = 'donor',
  REQUEST = 'request'
}
export type MapDataPoint = {
  id: string;
  longitude: number;
  latitude: number;
  type: MapDataPointType.REQUEST;
  content: Partial<{
    [K in BloodGroup]: number;
  }>;
  onBloodGroupCountClick: (type: BloodGroup, geohash: string) => void;
} | {
  id: string;
  longitude: number;
  latitude: number;
  type: MapDataPointType.DONOR;
  content: Partial<{
    [K in AcceptDonationStatus]: number;
  }>;
}

type GeohashMapProps = {
  data: MapDataPoint[];
  initialCenter?: [number, number];
  onCenterChange?: (arg: LatLong) => void;
  center: LatLong;
  lines?: {
    from: LatLong;
    to: LatLong[];
  };
};

const GeohashMap = ({
  data,
  onCenterChange,
  center,
  lines
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

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-left')

    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      }),
      'bottom-left'
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

  document.querySelectorAll(`.${REQUEST_CONTROL_CLASS}`).forEach(el => el.remove())
  document.querySelectorAll(`.${DONOR_CONTROL_CLASS}`).forEach(el => el.remove())

  data.forEach((point) => {
    const popupId = `${point.type === MapDataPointType.REQUEST ? 'request' : 'donor' }-${point.id}`

    document.getElementById(popupId)?.remove()
    const contentHtml = `${Object.entries(point.content || {})
      .map(([contentKey, value]) => {

        return `<div class="${point.type === MapDataPointType.REQUEST ? 
          REQUEST_CONTROL_CLASS : DONOR_CONTROL_CLASS}" ${HTML_DATA_BLOOD_GROUP_KEY}=${
          contentKey} style="cursor: ${
          point.type === MapDataPointType.REQUEST ? 'pointer' : 'inherit'};">
              ${contentKey}: <span style="vertical-align: middle;  background-color: ${
  point.type === MapDataPointType.REQUEST
    ? 'black' : 
    MARKER_POINT_COLOR_STATUS_MAP[
      contentKey as AcceptDonationStatus]}" class="badge pill text-white">${value}</span></div>`
      })
      .join('')}<strong>${point.id}</strong>`

    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false })
      .setLngLat([point.longitude, point.latitude])
      .setHTML(contentHtml)
      .addTo(mapRef.current!)

    const popUpElement = popup.getElement()

    popUpElement.id = popupId
    popUpElement.classList.add(REQUEST_CONTROL_CLASS)

    if ( point.type === MapDataPointType.REQUEST ) {
      popUpElement
        .querySelectorAll(`.${REQUEST_CONTROL_CLASS}`)
        .forEach(el => {
          const bloodGroup = el.getAttribute(HTML_DATA_BLOOD_GROUP_KEY) as BloodGroup
          el.addEventListener('click', () => {
            point.onBloodGroupCountClick(bloodGroup, point.id)
          })
        })
    }
  } )

  if (mapRef.current?.getLayer('line-layer')) {
    mapRef.current.removeLayer('line-layer');
  }

  if (mapRef.current?.getSource('lines')) {
    mapRef.current.removeSource('lines');
  }

  const linesToDraw = lines?.to.map((to) => ({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [[lines.from.longitude, lines.from.latitude], [to.longitude, to.latitude]]
    },
    properties: {}
  }));
    
  linesToDraw && mapRef.current?.addSource('lines', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: linesToDraw as Feature<LineString, GeoJsonProperties>[]
    }
  }).addLayer({
    id: 'line-layer',
    type: 'line',
    source: 'lines',
    paint: {
      'line-color': '#ff0000',
      'line-width': 2
    }
  });

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
