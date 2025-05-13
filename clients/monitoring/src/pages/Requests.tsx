import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { MapDataPoint } from '../components/GeohashMap';
import GeohashMap from '../components/GeohashMap'
import { useAws } from '../hooks/useAws'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { encode, decode } from 'ngeohash'
import { bloodTypes } from '../constants/constants'
import { Container } from 'react-bootstrap';
import InfoCard from '../components/InfoCard';


const GeohashMapMemoed = memo(GeohashMap)

const Requests = () => {
  const [centerGeoHash, setCenterGeohash] = useState('wh0r3mw8')
  const [data, setData] = useState<MapDataPoint[]>([])
  const awsCredentials = useAws()!
  const s3Client = useMemo(() => new S3Client({
    region: import.meta.env.VITE_AWS_S3_REGION,
    credentials: {
      ...awsCredentials
    }
  }), [awsCredentials])

  const centerLatLng = decode(centerGeoHash)

  const centerGeohashPrefix = centerGeoHash.substring(0,
    Number(import.meta.env.VITE_MAX_GEOHASH_PREFIX_SIZE))

  const fetchDonationRequests = useCallback((prefix: string) => Promise.all(
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
  ).then(data => data.reduce((acc, geohashes, index) => {
    const bloodType = bloodTypes[index];
    geohashes.forEach((location) => {
      const existingDataPoint = acc.find(dp => dp.id === location);

      if (!existingDataPoint) {
        const { latitude, longitude } = decode(location);
        acc.push({
          id: location,
          longitude,
          latitude,
          content: `${bloodType}: 1`
        });
      } else {
        const { content } = existingDataPoint;
        const regex = new RegExp(`^(${bloodType}):\\s*(\\d+)$`, 'm');
        const match = content.match(regex);
        if (match) {
          const currentCount = parseInt(match[2], 10);
          const updatedLine = `${bloodType}: ${currentCount + 1}`;
          existingDataPoint.content = updatedLine;
        } else {
          existingDataPoint.content = `${content}\n${bloodType}: 1`;
        }
      }
    });

    return acc;
  }, [] as MapDataPoint[])), [s3Client])

  useEffect(() => {
    fetchDonationRequests(centerGeohashPrefix).then((data) => {
      setData(data)
    })
  }, [centerGeohashPrefix, fetchDonationRequests])

  const infoCard = <InfoCard data={centerGeoHash} onDataChange={
    (hash: string) => {
      setCenterGeohash(hash);
    }} />


  return (
    <Container
      fluid
      style={{ width: '100vw', height: '97.7vh', padding: 0 }}>
      <GeohashMapMemoed
        center={centerLatLng}
        data={data}
        onCenterChange={(arg) => { setCenterGeohash(encode(arg.latitude, arg.longitude)) }}
        floatingComponent={infoCard}
      />
    </Container>
  )
}


export default Requests
