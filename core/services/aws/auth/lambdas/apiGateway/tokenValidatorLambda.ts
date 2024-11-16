import { getPayloadFromBearerToken } from "../../../../../application/authWorkflow/authWorkflowUseCases";
import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";

/**
 * Authorizer lambda for ApiGateway. Validates the token from "Bearer token".
 * Returns Unauthorized 401 for invalid token
 */
function tokenValidatorLambda(
  event: APIGatewayTokenAuthorizerEvent
): APIGatewayAuthorizerResult | "Unauthorized" {
  const tokenPayload = getPayloadFromBearerToken(event.authorizationToken);
  if (tokenPayload !== undefined) {
    return {
      principalId: "user",
      context: tokenPayload as APIGatewayAuthorizerResult["context"],
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Allow",
            Resource: event.methodArn,
          },
        ],
      },
    };
  }
  return "Unauthorized";
}

export default tokenValidatorLambda;
