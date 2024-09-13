import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

const region = process.env.AWS_REGION;
const USER_POOL_ID = process.env.USER_POOL_ID;
const DYNAMODB_TABLE_ARN = process.env.DYNAMODB_TABLE_ARN;
const ORGANIZATION_GROUP = 'organization';

const cognitoClient = new CognitoIdentityProviderClient({ region });
const dynamoClient = new DynamoDBClient({ region });

async function RegisterOrganizationLambda(event: any): Promise<APIGatewayProxyResult> {
  try {
    const { email, organizationName } = event;

    if (!email || !organizationName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Email and organization name are required.' }),
      };
    }

    // Step 1: Check if the organization exists in DynamoDB
    const getItemParams = {
      TableName: DYNAMODB_TABLE_ARN!,
      Key: {
        pk: { S: `ORG#${email}` }, // Partition key as ORG#<email>
        sk: { S: 'PROFILE' },      // Sort key as PROFILE
      },
    };

    const getItemCommand = new GetItemCommand(getItemParams);
    const getItemResponse = await dynamoClient.send(getItemCommand);

    // Step 2: If the organization exists, return a message
    if (getItemResponse.Item) {
      return {
        statusCode: 409, // Conflict
        body: JSON.stringify({ message: 'Organization already exists.' }),
      };
    }

    // Step 3: If the organization does not exist, add it
    const putItemParams = {
      TableName: DYNAMODB_TABLE_ARN!,
      Item: {
        pk: { S: `ORG#${email}` },        // Partition key
        sk: { S: 'PROFILE' },             // Sort key
        email: { S: email },              // Email
        organizationName: { S: organizationName }, // Organization Name
      },
    };

    const putItemCommand = new PutItemCommand(putItemParams);
    await dynamoClient.send(putItemCommand); // Add the new organization

    // Step 4: Create the user in Cognito
    const createUserParams = {
      UserPoolId: USER_POOL_ID!,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: organizationName }, // Adding organization name as the user's name
      ],
      DesiredDeliveryMediums: ['EMAIL'],
    };

    const createUserCommand = new AdminCreateUserCommand(createUserParams);
    const createUserResponse = await cognitoClient.send(createUserCommand);

    // Step 5: Add the user to the "organization" group
    const addToGroupParams = {
      UserPoolId: USER_POOL_ID!,
      Username: email,
      GroupName: ORGANIZATION_GROUP, // Adding the user to the organization group
    };

    const addUserToGroupCommand = new AdminAddUserToGroupCommand(addToGroupParams);
    await cognitoClient.send(addUserToGroupCommand); // Wait for the user to be added to the group

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'User successfully registered, organization created, and added to the organization group',
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
