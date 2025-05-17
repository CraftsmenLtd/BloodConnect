import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { encode, decode } from 'ngeohash'
import { Container } from 'react-bootstrap'
import GeohashMap, { MapDataPointType } from '../components/GeohashMap'
import SearchRequestsCard from '../components/SearchRequestsCard'
import { useAws } from '../hooks/AwsContext'
import { useGlobalData } from '../hooks/DataContext'
import {
  DynamoDBClient,
  GetItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb'
import type {
  AttributeValue,
  GetItemCommandInput,
  QueryCommandInput,
} from '@aws-sdk/client-dynamodb'
import { FIVE_MIN_IN_MS } from '../constants/constants'
import type { BloodGroup } from '../../../../commons/dto/DonationDTO'
import { AcceptDonationStatus } from '../../../../commons/dto/DonationDTO'
import { DonationStatus } from '../../../../commons/dto/DonationDTO'
import type { LatLong, MapDataPoint } from '../components/GeohashMap'
import type { Data } from '../components/SearchRequestsCard'
import SidePanel from '../components/SidePanel'
import type {
  BloodRequestDynamoDBUnmarshaledItem,
  NotificationDynamoDBUnmarshaledItem,
  UserLocationDynamoDBUnmarshaledItem
} from '../constants/types'

type QueryDonationsInput = {
  startTime: number;
  endTime: number;
  geoPartition: string;
  country: string;
  status: DonationStatus;
  nextPageToken?: Record<string, AttributeValue>;
};

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

  const markerPointColorMap = {
    [AcceptDonationStatus.ACCEPTED]: 'amber',
    [AcceptDonationStatus.IGNORED]: 'red',
    [AcceptDonationStatus.PENDING]: 'yellow',
    [AcceptDonationStatus.COMPLETED]: 'green'
  }

  const parsedToMapDataMarkerPoints = 
  globalData.requests
    .find(request => request.SK.S.split('#')[2] === sidePanelProps.detailsShownOnMapForRequestId)
    ?.notifiedDonors?.map((notifiedDonor) :MapDataPoint => ({
      type: MapDataPointType.MARKER,
      id: notifiedDonor.GSI1SK.S,
      latitude: Number(notifiedDonor.location.latitude.N),
      longitude: Number(notifiedDonor.location.longitude.N),
      color: markerPointColorMap[notifiedDonor.status.S as AcceptDonationStatus],
    })) ?? []

  const queryRequests = async({
    startTime,
    endTime,
    geoPartition,
    country,
    status,
    nextPageToken,
  }: QueryDonationsInput): Promise<{
    items: BloodRequestDynamoDBUnmarshaledItem[];
    nextPageToken?: Record<string, AttributeValue>;
  }> => {
    const nowIso = new Date(startTime).toISOString()
    const endIso = new Date(endTime).toISOString()

    const gsi1pk = `LOCATION#${country}-${geoPartition}#STATUS#${status}`

    const input: QueryCommandInput = {
      TableName: import.meta.env.VITE_AWS_DYNAMODB_TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      FilterExpression: 'donationDateTime BETWEEN :end AND :start',
      ExpressionAttributeValues: {
        ':gsi1pk': { S: gsi1pk },
        ':start': { S: nowIso },
        ':end': { S: endIso },
      },
      ScanIndexForward: false,
      Limit: 1,
      ExclusiveStartKey: nextPageToken,
    }

    const command = new QueryCommand(input)
    const response = await dynamodbClient.send(command)

    return {
      items: (response.Items ?? []) as BloodRequestDynamoDBUnmarshaledItem[],
      nextPageToken: response.LastEvaluatedKey,
    }
  }


  const queryNotifiedDonors = async(
    requestId: string,
    nextPageToken?: Record<string, AttributeValue>) => {
    const input: QueryCommandInput = {
      TableName: import.meta.env.VITE_AWS_DYNAMODB_TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk AND begins_with(GSI1SK, :prefix)',
      ExpressionAttributeValues: {
        ':gsi1pk': { S: requestId },
        ':prefix': { S: 'NOTIFICATION#' }
      },
      ScanIndexForward: false,
      Limit: 100,
      ExclusiveStartKey: nextPageToken,
    }

    const command = new QueryCommand(input)
    const response = await dynamodbClient.send(command)
    return {
      items: (response.Items ?? []) as NotificationDynamoDBUnmarshaledItem[],
      nextPageToken: response.LastEvaluatedKey,
    }
  }

  const queryUserLocation = async(locationId: string, userId: string) => {
    const input: GetItemCommandInput = {
      TableName: import.meta.env.VITE_AWS_DYNAMODB_TABLE,
      Key: {
        PK: { S: `USER#${userId}` },
        SK: { S: `LOCATION#${locationId}` },
      },
    }

    const command = new GetItemCommand(input)
    const response = await dynamodbClient.send(command)

    return response.Item as UserLocationDynamoDBUnmarshaledItem
  }

  const searchRequests = (data: Data) => queryRequests({
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

  const searchNotifiedDonors = (requestId: string) => queryNotifiedDonors(requestId)
    .catch((err) => {
      alert(err)
      return { items: [] }
    })
    .then(notificationResponse => notificationResponse.items)
    .then(notificationItems => Promise.all(notificationItems.map(async notification => ({
      ...notification,
      location: await queryUserLocation(
        notification.payload.M.locationId.S,
        notification.PK.S.split('#')[1],
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
        <SearchRequestsCard
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
          <SidePanel
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
