import type { LegacyRef } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react'
import type { LngLat } from 'mapbox-gl';
import mapboxgl from 'mapbox-gl'
import geoHash from 'ngeohash'
import 'mapbox-gl/dist/mapbox-gl.css'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { useAws } from '../hooks/useAws'
import { bloodTypes } from '../constants/constants'
import { Card, Form } from 'react-bootstrap';
import './GeohashMap.css'

const centerMarker = new mapboxgl.Marker({ color: 'black' })


const GeoHashMap = () => {
  const mapContainerRef = useRef<HTMLDivElement>()
  const mapRef = useRef<mapboxgl.Map>()
  const [currentGeoHashPrefix, setCurrentGeoHashPrefix] = useState<string>()
  const [geoHashCount, setGeoHashCount] = useState(0)
  const awsCredentials = useAws()

  const getDataFromAws = useCallback(async(prefix: string) => {
    const { accessKeyId, secretAccessKey, sessionToken } = awsCredentials!
    const s3Client = new S3Client({
      region: import.meta.env.VITE_AWS_S3_REGION,
      credentials: {
        accessKeyId,
        secretAccessKey,
        sessionToken
      }
    })

    return Promise.all(
      bloodTypes.map(async(type) =>
        s3Client
          .send(
            new GetObjectCommand({
              Bucket: import.meta.env.VITE_AWS_S3_BUCKET,
              Key: `${import.meta.env.VITE_BUCKET_PATH_PREFIX
              }/${prefix}-${type}.txt`
            })
          )
          .then(async(
            response
          ) => 
            response.Body ? response.Body.transformToString().then((content) =>
              content.split('\n')
            ) : [])
          .catch(() => [])
      )
    )
  }, [awsCredentials])

  const getPrefix = (center: LngLat) =>
    geoHash
      .encode(center.lat, center.lng)
      .substring(0, Number(import.meta.env.VITE_MAX_GEOHASH_PREFIX_SIZE))
  const refreshMap = useCallback(async() => {
    if (mapRef.current == null) return
    document
      .querySelectorAll('.mapboxgl-popup')
      .forEach((popup) => { popup.remove() })

    const center = mapRef.current.getCenter()
    centerMarker.setLngLat(center).addTo(mapRef.current)
    getDataFromAws(getPrefix(center)).then((data) => {
      setGeoHashCount(0)
      const mappedGeoHashes = data.reduce((geoHashMap, geoHashes, index) => {
        const bloodType = bloodTypes[index]
        geoHashes.forEach((key) => {
          const { latitude, longitude } = geoHash.decode(key)
          if (!geoHashMap.has(key)) {
            geoHashMap.set(key, {
              lat: latitude,
              lng: longitude,
              counter: {
                [bloodType]: 0
              },
              totalCount: 0
            })
          }
          const currentData = geoHashMap.get(key)!

          currentData.counter[bloodType] = currentData.counter[bloodType] ?
            currentData.counter[bloodType] + 1 :
            1
          currentData.totalCount += 1

          geoHashMap.set(key, currentData)
        })
        return geoHashMap
      }, new Map<string,
        {
          lat: number;
          lng: number;
          counter: { [k in (typeof bloodTypes)[number]]: number; };
          totalCount: number;
        }>())

      mappedGeoHashes.forEach(({ counter, lat, lng, totalCount }) => {
        const list = Object.entries(counter)
          .map(([bloodType, count]) => `<text>${count} : ${bloodType}</text>`)
          .join('<br/>')

        new mapboxgl.Popup({ closeOnClick: false, closeButton: false })
          .setHTML(`<div style="color: red; font-weight: bold; font-size: small">${list}</div>`)
          .setLngLat([lng, lat])
          .addTo(mapRef.current!)

        setGeoHashCount((prev) => prev + totalCount)
      })

      // eslint-disable-next-line no-console
    }).catch(console.error)
  }, [getDataFromAws])

  const moveHandler = useCallback(() => {
    if (mapRef.current != null) {
      const center = mapRef.current.getCenter()
      centerMarker.setLngLat(center).addTo(mapRef.current)
      const prefix = getPrefix(center)

      setCurrentGeoHashPrefix((prev) => {
        if (prefix !== prev) {
          void refreshMap()
          return prefix
        }
        return prev
      })
    }
  }, [refreshMap])

  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_PUBLIC_KEY

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current!,
      center: [90.4125, 23.8103],
      zoom: 13,
      pitch: 20,
    })
    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    const setCenterMarker = () => {
      centerMarker
        .setLngLat(mapRef.current!.getCenter())
        .addTo(mapRef.current!)
    }

    mapRef.current.on('move', setCenterMarker)
    mapRef.current.on('moveend', moveHandler)
    mapRef.current.on('load', () => {
      const center = mapRef.current!.getCenter()
      const prefix = getPrefix(center)
      setCurrentGeoHashPrefix(prefix)
      void refreshMap()
    })

    return () => {
      mapRef.current?.off('move', setCenterMarker)
      mapRef.current?.off('moveend', moveHandler)
      mapRef.current?.off('load', () => { void refreshMap() })
      mapRef.current?.remove()
    }
  }, [awsCredentials, moveHandler, refreshMap])

  return (
    <div
      style={{ height: '100vh', width: '100vw' }}
      ref={mapContainerRef as LegacyRef<HTMLDivElement>}
      className='map-container'
    >
      <InfoCard 
        geoHashCount={geoHashCount}
        currentGeoHashPrefix={currentGeoHashPrefix}
        setCurrentGeoHashPrefix={setCurrentGeoHashPrefix}
      />
    </div>
  )
}

type InfoCardProps = {
  geoHashCount: number;
  currentGeoHashPrefix?: string;
  setCurrentGeoHashPrefix: (arg:string) => void;
}

const InfoCard = ({
  geoHashCount,
  currentGeoHashPrefix,
  setCurrentGeoHashPrefix
}: InfoCardProps) => {
  return (
    <Card style={{ 
      width: '18rem', zIndex: 1, margin: '4px' }}>
      <Card.Body>
        <Card.Title>Current View</Card.Title>
        <Card.Text>
          Showing <strong>{geoHashCount}</strong> location(s) in {currentGeoHashPrefix}
          <Form.Control
            type="text"
            aria-describedby="enter geohash"
            value={currentGeoHashPrefix}
            onChange={(e) => { setCurrentGeoHashPrefix(e.target.value) }}
          />
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default GeoHashMap
