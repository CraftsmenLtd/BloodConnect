import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { encode, decode } from 'ngeohash'
import { Container } from 'react-bootstrap'
import GeohashMap, { MapDataPointType } from '../components/GeohashMap'
import RequestSearchCard from '../components/Requests/RequestSearchCard'
import { useAws } from '../hooks/AwsContext'
import { useGlobalData } from '../hooks/DataContext'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { FIVE_MIN_IN_MS } from '../constants/constants'
import type { BloodGroup } from '../../../../commons/dto/DonationDTO'
import type { AcceptDonationStatus } from '../../../../commons/dto/DonationDTO'
import { DonationStatus } from '../../../../commons/dto/DonationDTO'
import type { MapDataPoint } from '../components/GeohashMap'
import type { Data } from '../components/Requests/RequestSearchCard'
import RequestList from '../components/Requests/RequestList'
import type { BloodRequestDynamoDBUnmarshaledItem } from '../constants/types'
import { queryRequests, queryUserLocation, queryNotifiedDonors } from '../queries/Requests'

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchRequestsLoading, setSearchRequestsLoading] = useState(false)

  const centerHash = searchParams.get('centerHash') ?? 'wh0r3mw8'
  const [requestListProps, setRequestListProps] = useState<{
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
  const endTime = Number(searchParams.get('endTime') ?? Date.now())
  const startTime = Number(searchParams.get('startTime') ?? endTime as number - FIVE_MIN_IN_MS)

  const centerLatLng = decode(centerHash)
  const centerHashPrefix = centerHash.substring(0,
    Number(import.meta.env.VITE_MAX_GEOHASH_PREFIX_SIZE))

  const { credentials } = useAws()
  const [globalData, setGlobalData] = useGlobalData()

  const dynamodbClient = useMemo(() => new DynamoDBClient({
    region: import.meta.env.VITE_AWS_REGION as string,
    credentials: credentials!,
  }), [credentials])

  const handleBloodTypePopupClick = (bloodGroup: BloodGroup, geohash: string) => {
    setRequestListProps({
      show: true,
      bloodGroup,
      geohash,
      detailsShownOnMapForRequestId: null
    })
  }

  const parsedRequestsToMapDataPoints = useMemo(() => globalData.requests.reduce((acc, item) => {
    const geohash = item.geohash.S
    const bloodGroup = item.requestedBloodGroup?.S as BloodGroup
    const detailsShownOnMap = item.SK.S.split('#')[2] ===
        requestListProps.detailsShownOnMapForRequestId ||
        requestListProps.detailsShownOnMapForRequestId === null

    if (!geohash || !bloodGroup || !detailsShownOnMap) return acc

    const existing = acc.find(
      dp => dp.id === geohash) as MapDataPoint & { type: MapDataPointType.REQUEST }

    if (!existing) {
      const { latitude, longitude } = decode(geohash)
      acc.push({
        type: MapDataPointType.REQUEST,
        id: item.geohash.S,
        latitude,
        longitude,
        onBloodGroupCountClick: (...arg) => { handleBloodTypePopupClick(...arg) },
        content: {
          [bloodGroup]: requestListProps.detailsShownOnMapForRequestId === null ?
            1 : item.bloodQuantity.N,
        },
      })
    } else {
      const count = existing.content[bloodGroup] ?? 0
      existing.content[bloodGroup] = count + 1
    }

    return acc
  }, [] as MapDataPoint[]), [globalData.requests, requestListProps.detailsShownOnMapForRequestId])

  const parsedDonorsToMapDataPoints = useMemo(() => globalData.requests
    .find(
      request => request.SK.S.split('#')[2] === requestListProps.detailsShownOnMapForRequestId)
    ?.notifiedDonors?.reduce((acc, notifiedDonor) => {
      const latitude = Number(notifiedDonor.location.latitude.N)
      const longitude = Number(notifiedDonor.location.longitude.N)
      const status = notifiedDonor.status.S as AcceptDonationStatus

      const existing = acc.find(dp =>
        dp.latitude === latitude &&
          dp.longitude === longitude
      )

      if (!existing) {
        acc.push({
          type: MapDataPointType.DONOR,
          id: encode(latitude, longitude),
          latitude,
          longitude,
          distance: Number(notifiedDonor.payload.M.distance.N),
          content: {
            [status]: 1
          },
        })
      } else {
        const count = existing.content[status] ?? 0
        existing.content[status] = count + 1
      }

      return acc
    }, [] as (MapDataPoint & { type: MapDataPointType.DONOR })[]) ?? [],
  [globalData.requests, requestListProps.detailsShownOnMapForRequestId])

  const data = useMemo(() => ([
    ...parsedRequestsToMapDataPoints,
    ...parsedDonorsToMapDataPoints]),
  [parsedDonorsToMapDataPoints, parsedRequestsToMapDataPoints])

  const lines = useMemo(() => ({
    from: parsedRequestsToMapDataPoints?.[0],
    to: parsedDonorsToMapDataPoints
  }), [parsedDonorsToMapDataPoints, parsedRequestsToMapDataPoints])

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
    .catch(err => {
      alert(err)
      return { items: [] }
    })
    .then(notificationResponse => {
      return notificationResponse.items
    })
    .then(notificationItems => notificationItems.filter(
      item => item.payload.M?.locationId?.S))
    .then(notificationItems => Promise.all(notificationItems.map(
      async notification => ({
        ...notification,
        location: await queryUserLocation(dynamodbClient,
          {
            locationId: notification.payload.M.locationId.S,
            userId: notification.PK.S.split('#')[1]
          })
      })
    )))
    .then(notificationsWithLocation => notificationsWithLocation
      .filter(notificationWithLocation => notificationWithLocation.location))
    .then(notificationsWithLocation => {
      setGlobalData(prev => {
        const requests = [...prev.requests]
        const request = requests.find(request => requestId === request.SK.S.split('#')[2])
        request!.notifiedDonors = notificationsWithLocation
        return { requests }
      })
    })

  const sidePanelRequests = globalData.requests.filter(
    request => request.requestedBloodGroup.S === requestListProps.bloodGroup &&
      request.geohash.S === requestListProps.geohash)

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
            endTime,
            startTime,
            centerHash,
            country,
            status,
          }}
          onCenterHashChange={hash => {
            searchParams.set('centerHash', hash)
            setSearchParams(searchParams)
          }}
          onDataSubmit={data => {
            searchParams.set('centerHash', data.centerHash)
            searchParams.set('country', data.country)
            searchParams.set('startTime', data.startTime.toString())
            searchParams.set('endTime', data.endTime.toString())
            searchParams.set('status', data.status)
            setSearchParams(searchParams)
            setSearchRequestsLoading(true)
            searchRequests(data).finally(() => { setSearchRequestsLoading(false) })
          }}
        />
      </div>
      <GeohashMap
        lines={lines}
        center={centerLatLng}
        data={data}
        onCenterChange={arg => {
          searchParams.set('centerHash', encode(arg.latitude, arg.longitude))
          setSearchParams(searchParams)
        }}
      />
      <div
        className="position-absolute top-0 end-0">
        {
          requestListProps.show && requestListProps.bloodGroup &&
          <RequestList
            activeRequestOnMap={requestListProps.detailsShownOnMapForRequestId}
            onCardClickToClose={requestId => setRequestListProps(prev => (
              { ...prev, detailsShownOnMapForRequestId:
                requestId === requestListProps.detailsShownOnMapForRequestId ?
                  null : requestListProps.detailsShownOnMapForRequestId }))}
            onCardClickToOpen={requestId => {
              setSearchRequestsLoading(true)
              setRequestListProps(prev => ({ ...prev, detailsShownOnMapForRequestId: requestId }))
              searchNotifiedDonors(requestId).finally(() => { setSearchRequestsLoading(false) })
            }}
            bloodGroup={requestListProps!.bloodGroup}
            geohash={requestListProps.geohash}
            onClose={() => { setRequestListProps(prev => ({
              ...prev, show: false,
              detailsShownOnMapForRequestId: null })) }}
            requests={sidePanelRequests} />
        }
      </div>
    </Container>
  )
}

export default Home
