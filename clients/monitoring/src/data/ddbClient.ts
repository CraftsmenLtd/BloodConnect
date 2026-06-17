import { useMemo } from 'react'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { useAws } from '../hooks/AwsContext'

// Centralized Cognito-cred'd DynamoDB client (reads stay browser -> DDB-direct).
export const useDdbClient = (): DynamoDBClient => {
  const { credentials } = useAws()

  return useMemo(() => new DynamoDBClient({
    region: import.meta.env.VITE_AWS_REGION as string,
    credentials: credentials!,
  }), [credentials])
}
