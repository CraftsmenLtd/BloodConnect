import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { encode, decode } from 'ngeohash'
import { Container } from 'react-bootstrap'
import GeohashMap, { MapDataPointType } from '../components/GeohashMap'
import RequestSearchCard from '../components/Requests/RequestSearchCard'
import { useAws } from '../hooks/AwsContext'
import { useGlobalData } from '../hooks/DataContext'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { FIVE_MIN_IN_MS, MARKER_POINT_COLOR_STATUS_MAP } from '../constants/constants'
import type { BloodGroup } from '../../../../commons/dto/DonationDTO'
import type { AcceptDonationStatus } from '../../../../commons/dto/DonationDTO'
import { DonationStatus } from '../../../../commons/dto/DonationDTO'
import type { LatLong, MapDataPoint } from '../components/GeohashMap'
import type { Data } from '../components/Requests/RequestSearchCard'
import RequestList from '../components/Requests/RequestList'
import type { BloodRequestDynamoDBUnmarshaledItem } from '../constants/types'
import { queryRequests, queryUserLocation, queryNotifiedDonors } from '../queries/Requests'

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchRequestsLoading, setSearchRequestsLoading] = useState(false)

  const centerHash = searchParams.get('centerHash') ?? 'wh0r3mw8'
  const [sidePanelProps, setSidePanelProps] = useState<{
    show: boolean;
    bloodGroup?: BloodGroup;
    geohash: string;
    detailsShownOnMapForRequestId: string | null;
  }>({
    show: false,
    bloodGroup: undefined,
    geohash: centerHash,
    detailsShownOnMapForRequestId: null
  })
  const country = searchParams.get('country') ?? 'BD'
  const status = (searchParams.get('status') as DonationStatus) ?? DonationStatus.PENDING
  const startTime = Number(searchParams.get('startTime') ?? Date.now())
  const endTime = Number(searchParams.get('endTime') ?? startTime as number - FIVE_MIN_IN_MS)

  const centerLatLng = decode(centerHash)
  const centerHashPrefix = centerHash.substring(0,
    Number(import.meta.env.VITE_MAX_GEOHASH_PREFIX_SIZE))

  const { credentials } = useAws()!
  const [globalData, setGlobalData] = useGlobalData()

  const dynamodbClient = useMemo(() => new DynamoDBClient({
    region: import.meta.env.VITE_AWS_REGION as string,
    credentials: credentials!,
  }), [credentials])

  const handleBloodTypePopupClick = (bloodGroup: BloodGroup, geohash: string) => {
    setSidePanelProps({
      show: true,
      bloodGroup,
      geohash,
      detailsShownOnMapForRequestId: null
    })
  }
  const parsedToMapDataPopupPoints =
    globalData.requests.reduce((acc, item) => {
      const geohash = item.geohash?.S
      const bloodGroup = item.requestedBloodGroup?.S as BloodGroup

      if (!geohash || !bloodGroup) return acc

      const existing = acc.find((dp) => dp.id === geohash) as
        MapDataPoint & { type: MapDataPointType.POPUP }

      if (!existing) {
        const { latitude, longitude } = decode(geohash)
        acc.push({
          type: MapDataPointType.POPUP,
          id: geohash,
          latitude,
          longitude,
          onBloodGroupCountClick: (...arg) => { handleBloodTypePopupClick(...arg) },
          content: {
            [bloodGroup]: 1
          },
        })
      } else {
        const count = existing.content[bloodGroup] ?? 0
        existing.content[bloodGroup] = count + 1
      }

      return acc
    }, [] as MapDataPoint[])



  const parsedToMapDataMarkerPoints =
    globalData.requests
      .find(request => request.SK.S.split('#')[2] === sidePanelProps.detailsShownOnMapForRequestId)
      ?.notifiedDonors?.map((notifiedDonor): MapDataPoint => ({
        type: MapDataPointType.MARKER,
        id: notifiedDonor.GSI1SK.S,
        latitude: Number(notifiedDonor.location.latitude.N),
        longitude: Number(notifiedDonor.location.longitude.N),
        color: MARKER_POINT_COLOR_STATUS_MAP[notifiedDonor.status.S as AcceptDonationStatus],
      })) ?? []

  const searchRequests = (data: Data) => queryRequests(dynamodbClient,
    {
      ...data,
      geoPartition: centerHashPrefix,
    }).
    catch((err) => {
      alert(err)
      return { items: [] }
    })
    .then(response => response.items)
    .then(items => {
      setGlobalData(prev => ({
        ...prev, requests: items as BloodRequestDynamoDBUnmarshaledItem[]
      }))
      return items
    })

  const searchNotifiedDonors = (requestId: string) => queryNotifiedDonors(dynamodbClient,
    { requestId })
    .catch((err) => {
      alert(err)
      return { items: [] }
    })
    .then(notificationResponse => notificationResponse.items)
    .then(notificationItems => Promise.all(notificationItems.map(async notification => ({
      ...notification,
      location: await queryUserLocation(
        dynamodbClient,
        { 
          locationId: notification.payload.M.locationId.S,
          userId: notification.PK.S.split('#')[1], }
      )
    }))))
    .then(notificationWithLocation => {
      setGlobalData(prev => {
        const request = prev.requests.find(request => requestId === request.SK.S.split('#')[2])
        request!.notifiedDonors = notificationWithLocation
        return { ...prev }
      })
    })

  const sidePanelRequests = globalData.requests.filter(
    request => request.requestedBloodGroup.S === sidePanelProps.bloodGroup &&
      request.geohash.S === sidePanelProps.geohash)

  return (
    <Container
      fluid
      className="position-relative p-0"
      style={{ flexGrow: 1 }}>
      <div
        className="position-absolute top-0 start-0 m-2">
        <RequestSearchCard
          loading={searchRequestsLoading}
          data={{
            startTime: startTime,
            endTime: endTime,
            centerHash,
            country,
            status,
          }}
          onCenterHashChange={(hash) => {
            setSearchParams(prev => ({ ...prev, centerHash: hash }))
          }}
          onDataSubmit={(data) => {
            setSearchParams(prev => {
              const current = Object.fromEntries(prev.entries())
              return {
                ...current,
                ...data,
                startTime: data.startTime.toString(),
                endTime: data.endTime.toString(),
              }
            })
            setSearchRequestsLoading(true)
            searchRequests(data).finally(() => { setSearchRequestsLoading(false) })
          }}
        />
      </div>

      <GeohashMap
        center={centerLatLng}
        data={[...parsedToMapDataPopupPoints, ...parsedToMapDataMarkerPoints]}
        onCenterChange={(arg: LatLong) => {
          const newHash = encode(arg.latitude, arg.longitude)
          setSearchParams(prev => {
            const current = Object.fromEntries(prev.entries())
            return { ...current, centerHash: newHash }
          })
        }}
      />
      <div
        className="position-absolute top-0 end-0">
        {
          sidePanelProps.show && sidePanelProps.bloodGroup &&
          <RequestList
            onCardClick={(requestId) => {
              setSidePanelProps(prev => ({ ...prev, detailsShownOnMapForRequestId: requestId }))
              setSearchRequestsLoading(true)
              searchNotifiedDonors(requestId).finally(() => { setSearchRequestsLoading(false) })
            }}
            bloodGroup={sidePanelProps!.bloodGroup}
            geohash={sidePanelProps.geohash}
            onClose={() => { setSidePanelProps((prev) => ({ ...prev, show: false })) }}
            requests={sidePanelRequests} />
        }
      </div>
    </Container>
  )
}

export default Home
