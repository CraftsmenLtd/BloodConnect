import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { Config } from '../../../../commons/libs/config/config'
import { createServiceLogger } from '../commons/logger/ServiceLogger'

const config = new Config<{
  cognitoUserPoolId: string;
  cognitoClientId: string;
}>().getConfig()

// Created once per container so the JWKS is fetched and cached across invocations.
// tokenUse 'access': the WebSocket client (Phase 6) sends the Cognito access token as ?token=.
const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: config.cognitoUserPoolId,
  tokenUse: 'access',
  clientId: config.cognitoClientId
})

type AuthorizerEvent = {
  methodArn: string;
  queryStringParameters?: Record<string, string | undefined> | null;
}

type AuthorizerResult = {
  principalId: string;
  policyDocument: {
    Version: string;
    Statement: { Action: string; Effect: 'Allow' | 'Deny'; Resource: string }[];
  };
  context?: { userId: string };
}

const buildPolicy = (
  principalId: string,
  effect: 'Allow' | 'Deny',
  resource: string,
  context?: { userId: string }
): AuthorizerResult => ({
  principalId,
  policyDocument: {
    Version: '2012-10-17',
    Statement: [{ Action: 'execute-api:Invoke', Effect: effect, Resource: resource }]
  },
  ...(context !== undefined ? { context } : {})
})

// WebSocket $connect REQUEST authorizer: validates the Cognito JWT carried as the `token` query
// param and passes the userId to the connect handler via the authorizer context. An invalid token
// yields a Deny policy (403), never an allow.
async function chatConnectAuthorizer(event: AuthorizerEvent): Promise<AuthorizerResult> {
  const token = event.queryStringParameters?.token
  const logger = createServiceLogger('chat-authorizer')

  if (token === undefined || token === '') {
    logger.error('missing token query parameter')

    return buildPolicy('unauthorized', 'Deny', event.methodArn)
  }

  try {
    const payload = await jwtVerifier.verify(token)

    return buildPolicy(payload.sub, 'Allow', event.methodArn, { userId: payload.sub })
  } catch (error) {
    logger.error({ error }, 'token verification failed')

    return buildPolicy('unauthorized', 'Deny', event.methodArn)
  }
}

export default chatConnectAuthorizer
