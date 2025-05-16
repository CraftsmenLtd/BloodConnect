import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { encode, decode } from 'ngeohash';
import { Container } from 'react-bootstrap';
import GeohashMap, { MapDataPointType } from '../components/GeohashMap';
import SearchRequestsCard from '../components/SearchRequestsCard';
import { useAws } from '../hooks/AwsContext';
import { useGlobalData } from '../hooks/DataContext';
import {
  DynamoDBClient,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import type {
  AttributeValue,
  QueryCommandInput,
} from '@aws-sdk/client-dynamodb';
import { FIVE_MIN_IN_MS } from '../constants/constants';
import type { BloodGroup } from '../../../../commons/dto/DonationDTO';
import { DonationStatus } from '../../../../commons/dto/DonationDTO';
import type { LatLong, MapDataPoint } from '../components/GeohashMap';
import type { Data } from '../components/SearchRequestsCard';
import SidePanel from '../components/SidePanel';
import type { BloodRequestDynamoDBUnmarshaledItem } from '../constants/types';

type QueryDonationsInput = {
  startTime: number;
  endTime: number;
  geoPartition: string;
  country: string;
  status: DonationStatus;
  nextPageToken?: Record<string, AttributeValue>;
};

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchRequestsLoading, setSearchRequestsLoading] = useState(false);

  const centerHash = searchParams.get('centerHash') ?? 'wh0r3mw8';
  const [sidePanelProps, setSidePanelProps] = useState<{
    show: boolean;
    bloodGroup?: BloodGroup;
    geohash: string;
  }>({
    show: false,
    bloodGroup: undefined,
    geohash: centerHash
  });
  const country = searchParams.get('country') ?? 'BD';
  const status = (searchParams.get('status') as DonationStatus) ?? DonationStatus.PENDING;
  const startTime = Number(searchParams.get('startTime') ?? Date.now());
  const endTime = Number(searchParams.get('endTime') ?? startTime as number - FIVE_MIN_IN_MS);

  const centerLatLng = decode(centerHash);
  const centerHashPrefix = centerHash.substring(0,
    Number(import.meta.env.VITE_MAX_GEOHASH_PREFIX_SIZE));

  const [mapDataPoints, setMapDataPoints] = useState<MapDataPoint[]>([]);
  const { credentials } = useAws()!;
  const [globalData, setGlobalData] = useGlobalData();

  const dynamodbClient = useMemo(() => new DynamoDBClient({
    region: import.meta.env.VITE_AWS_REGION as string,
    credentials: credentials!,
  }), [credentials]);

  const queryDonations = async({
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
    const nowIso = new Date(startTime).toISOString();
    const endIso = new Date(endTime).toISOString();

    const gsi1pk = `LOCATION#${country}-${geoPartition}#STATUS#${status}`;

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
    };

    const command = new QueryCommand(input);
    const response = await dynamodbClient.send(command);

    return {
      items: (response.Items ?? []) as BloodRequestDynamoDBUnmarshaledItem[],
      nextPageToken: response.LastEvaluatedKey,
    };
  };

  const handleBloodTypePopupClick = (bloodGroup: BloodGroup, geohash: string) => {
    setSidePanelProps({
      show: true,
      bloodGroup,
      geohash
    })
  }
  const parseToMapDataPopupPoints = (records: Record<string, AttributeValue>[]) =>
    records.reduce((acc, item) => {
      const geohash = item.geohash?.S;
      const bloodGroup = item.requestedBloodGroup?.S as BloodGroup;

      if (!geohash || !bloodGroup) return acc;

      const existing = acc.find((dp) => dp.id === geohash) as
        MapDataPoint & { type: MapDataPointType.POPUP }

      if (!existing) {
        const { latitude, longitude } = decode(geohash);
        acc.push({
          id: geohash,
          latitude,
          longitude,
          content: {
            [bloodGroup]: 1
          },
          type: MapDataPointType.POPUP,
          onBloodGroupCountClick: (...arg) => { handleBloodTypePopupClick(...arg) }
        });
      } else {
        const count = existing.content[bloodGroup] ?? 0
        existing.content[bloodGroup] = count + 1
      }

      return acc;
    }, [] as MapDataPoint[]);

  const searchDonations = (data: Data) => queryDonations({
    ...data,
    geoPartition: centerHashPrefix,
  }).
    catch((err) => {
      alert(err);
      return [{ items: [] }]
    })
    .then(response => response.items)
    .then(items => {
      setGlobalData(prev => ({ ...prev, requests: items as BloodRequestDynamoDBUnmarshaledItem[] }));
      return items;
    })
    .then(parseToMapDataPopupPoints)
    .then(setMapDataPoints);


  const sidePanelRquests = globalData.requests.filter(
    request => request.requestedBloodGroup.S === sidePanelProps.bloodGroup &&
      request.geohash.S === sidePanelProps.geohash)


  return (
    <Container
      fluid
      className="position-relative p-0"
      style={{ flexGrow: 1 }}>
      <div
        className="position-absolute top-0 start-0 m-2"
        style={{ zIndex: 1000 }}>
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
            setSearchParams(prev => ({ ...prev, centerHash: hash }));
          }}
          onDataSubmit={(data) => {
            setSearchParams(prev => {
              const current = Object.fromEntries(prev.entries());
              return {
                ...current,
                ...data,
                startTime: data.startTime.toString(),
                endTime: data.endTime.toString(),
              };
            });
            setSearchRequestsLoading(true);
            searchDonations(data).finally(() => { setSearchRequestsLoading(false) })
          }}
        />
      </div>

      <GeohashMap
        center={centerLatLng}
        data={mapDataPoints}
        onCenterChange={(arg: LatLong) => {
          const newHash = encode(arg.latitude, arg.longitude);
          setSearchParams(prev => {
            const current = Object.fromEntries(prev.entries());
            return { ...current, centerHash: newHash };
          });
        }}
      />
      <div
        className="position-absolute top-0 end-0"
        style={{ zIndex: 1000 }}>
        {
          sidePanelProps.show && sidePanelProps.bloodGroup &&
          <SidePanel
            bloodGroup={sidePanelProps!.bloodGroup}
            geohash={sidePanelProps.geohash}
            onClose={() => { setSidePanelProps((prev) => ({ ...prev, show: false })) }}
            requests={sidePanelRquests} />
        }
      </div>
    </Container>
  );
};

export default Home;
