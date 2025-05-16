import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { BloodGroup } from '../../../../commons/dto/DonationDTO';

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLngLat([center.longitude, center.latitude])
      mapRef.current.setCenter([center.longitude, center.latitude])
    }
  }, [center.latitude, center.longitude])


  useEffect(() => {
    if (!mapContainerRef.current) return;

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
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      }),
      'bottom-right'
    );

    const centerMarker = new maplibregl.Marker({ color: 'black' })
      .setLngLat([center.longitude, center.latitude])
      .addTo(map);

    map.on('drag', () => {
      const newCenter = mapRef.current!.getCenter()
      centerMarker.setLngLat(newCenter)
    });

    map.on('dragend', () => {
      const stableCenter = mapRef.current!.getCenter()
      onCenterChange?.({ latitude: stableCenter.lat, longitude: stableCenter.lng })
    })

    mapRef.current = map;
    markerRef.current = centerMarker;

    return () => {
      map.remove();
    };
  }, []);

  data.forEach((point) => {
    const type = point.type
    if (type === MapDataPointType.MARKER) {
      //
    } else {
      const popupId = `popup-${point.id}`;
      const identifyingClassName = 'blood-group-count'
      document.getElementById(popupId)?.remove()
      const contentHtml = `${Object.entries(point.content || {})
        .map(([bloodGroup, value]) => {

          return `<div class="${identifyingClassName}" data-blood-group=${
            bloodGroup} style="cursor: pointer;">
              ${bloodGroup}: <text style="color: red;">${value}</text>
            </div>`;
        })
        .join('')}<strong>${point.id}</strong>`;

      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false })
        .setLngLat([point.longitude, point.latitude])
        .setHTML(contentHtml)
        .addTo(mapRef.current!);

      popup.getElement().id = popupId;

      popup.getElement()
        .querySelectorAll(`.${identifyingClassName}`)
        .forEach(el => {
          const bloodGroup = el.getAttribute('data-blood-group') as BloodGroup;
          el.addEventListener('click', () => {
            point.onBloodGroupCountClick(bloodGroup, point.id)
          });
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
  );
};

export default GeohashMap;
