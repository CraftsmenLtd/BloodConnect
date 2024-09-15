import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminSetUserPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import generateApiGatewayResponse from "../../commons/lambda/ApiGateway";
import { HttpCodes } from "@commons/libs/constants/GenericCodes";

const region = process.env.AWS_REGION;
const USER_POOL_ID = process.env.USER_POOL_ID;
const DYNAMODB_TABLE_ARN = process.env.DYNAMODB_TABLE_ARN;
const ORGANIZATION_GROUP = "organization";

const cognitoClient = new CognitoIdentityProviderClient({ region });
const dynamoClient = new DynamoDBClient({ region });

async function RegisterOrganizationLambda(
  event: any
): Promise<APIGatewayProxyResult> {
  
  console.log("Received event:", JSON.stringify(event, null, 2));
  try {
    const { email, organizationName, password } = event;

    if (!email || !organizationName || !password) {
      return generateApiGatewayResponse(
        JSON.stringify({
          message: "Email, organization name, and password are required.",
        }),
        HttpCodes.badRequest
      );
    }

    // Step 1: Check if the organization exists in DynamoDB
    const getItemParams = {
      TableName: DYNAMODB_TABLE_ARN!,
      Key: {
        pk: { S: `ORG#${email}` }, // Partition key as ORG#<email>
        sk: { S: "PROFILE" }, // Sort key as PROFILE
      },
    };

    const getItemCommand = new GetItemCommand(getItemParams);
    const getItemResponse = await dynamoClient.send(getItemCommand);

    // Step 2: If the organization exists, return a conflict message
    if (getItemResponse.Item) {
      return generateApiGatewayResponse(
        JSON.stringify({ message: "Organization already exists." }),
        HttpCodes.conflict
      );
    }

    // Step 3: If the organization does not exist, add it to DynamoDB
    const putItemParams = {
      TableName: DYNAMODB_TABLE_ARN!,
      Item: {
        pk: { S: `ORG#${email}` }, // Partition key
        sk: { S: "PROFILE" }, // Sort key
        email: { S: email }, // Email
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
        { Name: "email", Value: email },
        { Name: "name", Value: organizationName }, // Adding organization name as the user's name
      ],
      DesiredDeliveryMediums: ["EMAIL"],
      ForceAliasCreation: false,
    };

    const createUserCommand = new AdminCreateUserCommand(createUserParams);
    const createUserResponse = await cognitoClient.send(createUserCommand);

    // Step 5: Set the user's permanent password
    const setPasswordParams = {
      UserPoolId: USER_POOL_ID!,
      Username: email,
      Password: password,
      Permanent: true, // Set password as permanent
    };

    const setPasswordCommand = new AdminSetUserPasswordCommand(setPasswordParams);
    await cognitoClient.send(setPasswordCommand);

    // Step 6: Add the user to the "organization" group
    const addToGroupParams = {
      UserPoolId: USER_POOL_ID!,
      Username: email,
      GroupName: ORGANIZATION_GROUP, // Adding the user to the organization group
    };

    const addUserToGroupCommand = new AdminAddUserToGroupCommand(
      addToGroupParams
    );
    await cognitoClient.send(addUserToGroupCommand); // Wait for the user to be added to the group

    return generateApiGatewayResponse(
      JSON.stringify({
        message:
          "User successfully registered, organization created, and added to the organization group",
      }),
      HttpCodes.created
    );
  } catch (error) {
    console.error("Error creating user or adding to group:", error);

    return generateApiGatewayResponse(
      JSON.stringify({
        message: "Internal server error",
        error: error.message,
      }),
      HttpCodes.internalServerError
    );
  }
}

export default RegisterOrganizationLambda;
