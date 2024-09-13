import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const region = process.env.AWS_REGION;
const USER_POOL_ID = process.env.USER_POOL_ID;
const ORGANIZATION_GROUP = 'organization';

const client = new CognitoIdentityProviderClient({ region });

async function RegisterOrganizationLambda(event: any): Promise<APIGatewayProxyResult> {
  try {
    const { email, organizationName } = event;

    if (!email || !organizationName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Email and organization name are required.' }),
      };
    }

    // Create the user in Cognito
    const createUserParams = {
      UserPoolId: USER_POOL_ID!,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
      ],
      DesiredDeliveryMediums: ['EMAIL'],
    };

    const createUserCommand = new AdminCreateUserCommand(createUserParams);
    const createUserResponse = await client.send(createUserCommand);

    // Add the user to the "organization" group
    const addToGroupParams = {
      UserPoolId: USER_POOL_ID!,
      Username: email,
      GroupName: ORGANIZATION_GROUP, // Adding the user to the organization group
    };

    const addUserToGroupCommand = new AdminAddUserToGroupCommand(addToGroupParams);
    await client.send(addUserToGroupCommand); // Wait for the user to be added to the group

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'User successfully registered and added to the organization group',
        data: createUserResponse,
      }),
    };
  } catch (error) {
    console.error('Error creating user or adding to group:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error', error: error.message }),
    };
  }
}

export default RegisterOrganizationLambda;
