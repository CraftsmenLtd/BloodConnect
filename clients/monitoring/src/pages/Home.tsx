import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { encode, decode } from 'ngeohash';
import { Container } from 'react-bootstrap';
import GeohashMap from '../components/GeohashMap';
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
import { DonationStatus } from '../../../../commons/dto/DonationDTO';
import type { LatLong, MapDataPoint } from '../components/GeohashMap';
import type { Data } from '../components/SearchRequestsCard';

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
  const [loading, setLoading] = useState(false);

  const centerHash = searchParams.get('centerHash') ?? 'wh0r3mw8';
  const country = searchParams.get('country') ?? 'BD';
  const status = (searchParams.get('status') as DonationStatus) ?? DonationStatus.PENDING;
  const startTime = Number(searchParams.get('startTime') ?? Date.now());
  const endTime = Number(searchParams.get('endTime') ?? startTime as number - FIVE_MIN_IN_MS);

  const centerLatLng = decode(centerHash);
  const centerHashPrefix = centerHash.substring(0,
    Number(import.meta.env.VITE_MAX_GEOHASH_PREFIX_SIZE));

  const [mapDataPoints, setMapDataPoints] = useState<MapDataPoint[]>([]);
  const { credentials } = useAws()!;
  const [_, setGlobalData] = useGlobalData();

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
  }: QueryDonationsInput) => {
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
      items: response.Items ?? [],
      nextPageToken: response.LastEvaluatedKey,
    };
  };

  const parseToMapDataPoints = (records: Record<string, AttributeValue>[]) =>
    records.reduce((acc, item) => {
      const geohash = item.geohash?.S;
      const bloodType = item.requestedBloodGroup?.S;

      if (!geohash || !bloodType) return acc;

      const existing = acc.find((dp) => dp.id === geohash);

      if (!existing) {
        const { latitude, longitude } = decode(geohash);
        acc.push({
          id: geohash,
          latitude,
          longitude,
          content: `${bloodType}: 1`,
        });
      } else {
        const regex = new RegExp(`^${bloodType}:\\s*(\\d+)$`, 'm');
        const match = existing.content.match(regex);

        if (match) {
          const count = parseInt(match[1], 10);
          existing.content = existing.content.replace(regex, `${bloodType}: ${count + 1}`);
        } else {
          existing.content += `\n${bloodType}: 1`;
        }
      }

      return acc;
    }, [] as MapDataPoint[]);

  const searchDonations = (data: Data) => queryDonations({
    ...data,
    geoPartition: centerHashPrefix,
  })
    .then(response => response.items)
    .then(items => {
      setGlobalData(prev => ({ ...prev, requests: items }));
      return items;
    })
    .then(parseToMapDataPoints)
    .then(setMapDataPoints);
  

  return (
    <Container
      fluid
      className="position-relative p-0"
      style={{ flexGrow: 1 }}>
      <div
        className="position-absolute top-0 start-0"
        style={{ zIndex: 1000 }}>
        <SearchRequestsCard
          loading={loading}
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
            setLoading(true);
            searchDonations(data).finally(()=> { setLoading(false) })
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
    </Container>
  );
};

export default Home;
