import { LegacyRef, useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import mapboxgl, { LngLat } from "mapbox-gl"
import geoHash from "ngeohash"
import "mapbox-gl/dist/mapbox-gl.css"
import { useAuthenticator } from "@aws-amplify/ui-react"
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { useAws } from "../hooks/useAws"
import { bloodTypeColors, bloodTypes } from "../constants/constants"

const GeoHashMap = () => {
  const mapContainerRef = useRef<HTMLDivElement>()
  const mapRef = useRef<mapboxgl.Map>()
  const [currentGeoHashPrefix, setCurrentGeoHashPrefix] = useState<string>()
  const [searchParams] = useSearchParams()
  const refreshIntervalSeconds = searchParams.get("refresh") || 60
  const [geoHashCount] = useState(0)
  const awsCredentials = useAws()

  const { signOut } = useAuthenticator((context) => [context.user])
  const centerMarker = new mapboxgl.Marker({ color: "orange" })


  const drawGeoHashPopUps = useCallback(
    (geoHashes: { color: string; geoHashes: string[]; id: string }[]) => {
      const geoHashMap = new Map<string, {
        color: string;
        count: number;
        lat: number;
        lng: number,
        bloodType: typeof bloodTypes[number]
      }>()

      geoHashes.forEach(({ geoHashes, color }, index) => {
        geoHashes.forEach((hash) => {
          const { latitude, longitude } = geoHash.decode(hash)
          const key = `${hash}-${color}`

          if (!geoHashMap.has(key)) {
            geoHashMap.set(key, {
              color,
              count: 0,
              lat: latitude,
              lng: longitude,
              bloodType: bloodTypes[index]
            })
          }

          geoHashMap.get(key)!.count += 1
        })
      })

      geoHashMap.forEach(({ color, count, lat, lng, bloodType }) => {
        new mapboxgl.Popup({ closeOnClick: false, closeButton: false })
          .setHTML(`<strong style="color: ${color}">${bloodType}: ${count}</strong>`)
          .setLngLat([lng, lat])
          .addTo(mapRef.current!)
      })
    },
    []
  )

  const getDataFromAws = async (prefix: string) => {
    const { accessKeyId, secretAccessKey, sessionToken } = awsCredentials!
    const s3Client = new S3Client({
      region: import.meta.env.VITE_AWS_S3_REGION,
      credentials: {
        accessKeyId,
        secretAccessKey,
        sessionToken,
      },
    })

    return Promise.all(bloodTypes.map(async (type) => s3Client.send(new GetObjectCommand({
      Bucket: import.meta.env.VITE_AWS_S3_BUCKET,
      Key: `${import.meta.env.VITE_BUCKET_PATH_PREFIX}/${prefix}-${type}.txt`,
    })).then((response) => response.Body?.transformToString().then((content) => content.split("\n"))).catch(() => [])))
  }


  const getPrefix = (center: LngLat) => geoHash.encode(center!.lat, center!.lng).substring(0, Number(import.meta.env.VITE_MAX_GEOHASH_PREFIX_SIZE))
  const refreshMap = useCallback(async () => {
    if (!mapRef.current) return
    document.querySelectorAll('.mapboxgl-popup').forEach((popup) => popup.remove())

    const center = mapRef.current.getCenter()
    centerMarker.setLngLat(center).addTo(mapRef.current)
    getDataFromAws(getPrefix(center)).then((data) => {
      drawGeoHashPopUps(data.map((items, index) => ({
        color: bloodTypeColors[index],
        geoHashes: items ?? [],
        id: `${index}-${bloodTypeColors[index]}`
      })))
    })

  }, [centerMarker, drawGeoHashPopUps])

  const moveHandler = () => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      centerMarker.setLngLat(center).addTo(mapRef.current);
      const prefix = getPrefix(center);

      setCurrentGeoHashPrefix((prev) => {
        if (prefix !== prev) {
          refreshMap();
          return prefix
        }
        return prev
      })
    }
  }

  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_PUBLIC_KEY

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current!,
      center: [90.4125, 23.8103],
      zoom: 10,
    })
    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    const setCenterMarker = () => {
      centerMarker.setLngLat(mapRef.current!.getCenter()!).addTo(mapRef.current!)
    }

    mapRef.current.on("move", setCenterMarker)
    mapRef.current.on("moveend", moveHandler)
    mapRef.current.on("load", refreshMap)

    return () => {
      mapRef.current?.off("move", setCenterMarker)
      mapRef.current?.off("moveend", moveHandler)
      mapRef.current?.off("load", refreshMap)
      mapRef.current?.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (refreshIntervalSeconds) {
      const refreshIntervalInMS = Number(refreshIntervalSeconds) * 1000
      const refreshIntervalId = setInterval(() => {
        centerMarker.remove()
        refreshMap()
      }, refreshIntervalInMS)

      return () => {
        if (refreshIntervalId) {
          clearInterval(refreshIntervalId)
        }
      }
    }
  }, [refreshIntervalSeconds, refreshMap])

  return (
    <div
      style={{ height: "100vh", width: "100vw" }}
      ref={mapContainerRef as LegacyRef<HTMLDivElement>}
      className="map-container"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "absolute",
          top: 10,
          left: 10,
          background: "white",
          padding: "10px",
          borderRadius: "5px",
          boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
          color: "black",
          zIndex: 1,
        }}
      >
        <div>
          <strong style={{ color: "red" }}>{geoHashCount}</strong> locations
          displayed
        </div>
        <div>
          <strong style={{ color: "red" }}>{currentGeoHashPrefix}</strong> area
          displayed
        </div>
        <div>
          <button onClick={signOut}>Sign Out</button>
        </div>
      </div>
    </div>
  )
}

export default GeoHashMap
