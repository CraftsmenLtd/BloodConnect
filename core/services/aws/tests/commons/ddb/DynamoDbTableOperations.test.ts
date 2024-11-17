import DynamoDbTableOperations from "../../../commons/ddb/DynamoDbTableOperations";
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import { UserDetailsDTO } from "../../../../../../commons/dto/UserDTO";
import UserModel from "../../../../../application/models/dbModels/UserModel";
import DatabaseError from "../../../../../../commons/libs/errors/DatabaseError";
import { GENERIC_CODES } from "../../../../../../commons/libs/constants/GenericCodes";
import {
  mockUserDetailsWithStringId,
  expectedUser,
} from "../../../../../application/tests/mocks/mockUserData";
import { QueryConditionOperator } from "../../../../../application/models/policies/repositories/QueryTypes";

describe("DynamoDbTableOperations Tests", () => {
  const ddbMock = mockClient(DynamoDBDocumentClient);
  const dynamoDbOperations = new DynamoDbTableOperations<
    UserDetailsDTO,
    any,
    UserModel
  >(new UserModel());

  beforeEach(() => {
    ddbMock.reset();
    process.env.DYNAMODB_TABLE_NAME = "TestTable";
    jest.spyOn(UserModel.prototype, "fromDto").mockReturnValue(expectedUser);
    jest
      .spyOn(UserModel.prototype, "toDto")
      .mockReturnValue(mockUserDetailsWithStringId);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should create an item in DynamoDB successfully", async () => {
    const mockPutResponse = { $metadata: { httpStatusCode: 200 } };
    ddbMock.on(PutCommand).resolves(mockPutResponse);

    const createdItem = await dynamoDbOperations.create(
      mockUserDetailsWithStringId
    );

    expect(createdItem).toEqual(mockUserDetailsWithStringId);
    expect(ddbMock.calls()).toHaveLength(1);
    expect(UserModel.prototype.fromDto).toHaveBeenCalledWith(
      mockUserDetailsWithStringId
    );
  });

  test("should throw an error when DynamoDB fails to create an item", async () => {
    const mockPutResponse = { $metadata: { httpStatusCode: 500 } };
    ddbMock.on(PutCommand).resolves(mockPutResponse);

    await expect(
      dynamoDbOperations.create(mockUserDetailsWithStringId)
    ).rejects.toThrow(
      'Failed to create item in DynamoDB. property "putCommandOutput.Attributes" is undefined'
    );

    expect(ddbMock.calls()).toHaveLength(1);
  });

  test("should update an item in DynamoDB successfully", async () => {
    const mockUpdateResponse = { $metadata: { httpStatusCode: 200 } };
    ddbMock.on(UpdateCommand).resolves(mockUpdateResponse);

    const updatedItem = await dynamoDbOperations.update(
      mockUserDetailsWithStringId
    );

    expect(updatedItem).toEqual(mockUserDetailsWithStringId);
    expect(ddbMock.calls()).toHaveLength(1);
    expect(UserModel.prototype.fromDto).toHaveBeenCalledWith(
      mockUserDetailsWithStringId
    );
  });

  test("should throw an error when DynamoDB fails to update an item", async () => {
    const mockUpdateResponse = { $metadata: { httpStatusCode: 500 } };
    ddbMock.on(UpdateCommand).resolves(mockUpdateResponse);

    await expect(
      dynamoDbOperations.update(mockUserDetailsWithStringId)
    ).rejects.toThrow(
      "Failed to update item in TestTable. Error: Failed to update item in DynamoDB. HTTP Status Code: 500"
    );

    expect(ddbMock.calls()).toHaveLength(1);
  });

  test("should throw an error when update operation encounters an error", async () => {
    ddbMock.on(UpdateCommand).rejects(new Error("DynamoDB update error"));

    await expect(
      dynamoDbOperations.update(mockUserDetailsWithStringId)
    ).rejects.toThrow(
      "Failed to update item in TestTable. Error: DynamoDB update error"
    );

    expect(ddbMock.calls()).toHaveLength(1);
  });

  test("should fetch an item from DynamoDB successfully", async () => {
    const mockGetResponse = {
      Item: expectedUser,
      $metadata: { httpStatusCode: 200 },
    };
    ddbMock.on(GetCommand).resolves(mockGetResponse);

    const fetchedItem = await dynamoDbOperations.getItem("partitionKey");

    expect(fetchedItem).toEqual(mockUserDetailsWithStringId);
    expect(ddbMock.calls()).toHaveLength(1);
    expect(UserModel.prototype.toDto).toHaveBeenCalledWith(expectedUser);
  });

  test("should return null when item is not found in DynamoDB", async () => {
    const mockGetResponse = {
      Item: undefined,
      $metadata: { httpStatusCode: 200 },
    };
    ddbMock.on(GetCommand).resolves(mockGetResponse);

    const fetchedItem = await dynamoDbOperations.getItem("partitionKey");

    expect(fetchedItem).toBeNull();
    expect(ddbMock.calls()).toHaveLength(1);
  });

  test("should throw an error when DynamoDB fails to fetch item", async () => {
    ddbMock.on(GetCommand).rejects(new Error("DynamoDB getItem error"));

    await expect(dynamoDbOperations.getItem("partitionKey")).rejects.toThrow(
      new DatabaseError(
        "Failed to fetch item from DynamoDB",
        GENERIC_CODES.ERROR
      )
    );

    expect(ddbMock.calls()).toHaveLength(1);
  });

  test("should throw error when DynamoDB table name is not defined", () => {
    delete process.env.DYNAMODB_TABLE_NAME;
    expect(() => dynamoDbOperations.getTableName()).toThrow(
      new DatabaseError("DDB Table name not defined", GENERIC_CODES.ERROR)
    );
  });

  test("should return the correct table name from the environment", () => {
    const tableName = dynamoDbOperations.getTableName();
    expect(tableName).toBe("TestTable");
  });

  describe("query method tests", () => {
    test("should execute a basic query successfully", async () => {
      const mockQueryResponse = {
        Items: [expectedUser],
        LastEvaluatedKey: undefined,
        $metadata: { httpStatusCode: 200 },
      };
      ddbMock.on(QueryCommand).resolves(mockQueryResponse);

      const result = await dynamoDbOperations.query({
        partitionKeyCondition: {
          attributeName: "PK",
          operator: QueryConditionOperator.EQUALS,
          attributeValue: "USER#12345",
        },
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(mockUserDetailsWithStringId);
      expect(result.lastEvaluatedKey).toBeUndefined();
    });

    test("should execute query with sort key condition", async () => {
      const mockQueryResponse = {
        Items: [expectedUser],
        $metadata: { httpStatusCode: 200 },
      };
      ddbMock.on(QueryCommand).resolves(mockQueryResponse);

      const result = await dynamoDbOperations.query({
        partitionKeyCondition: {
          attributeName: "PK",
          operator: QueryConditionOperator.EQUALS,
          attributeValue: "USER#12345",
        },
        sortKeyCondition: {
          attributeName: "SK",
          operator: QueryConditionOperator.BEGINS_WITH,
          attributeValue: "PROFILE",
        },
      });

      expect(result.items).toHaveLength(1);
      const queryCall = ddbMock.calls()[0];
      expect(queryCall.args[0].input).toMatchObject({
        KeyConditionExpression: "#PK = :PK AND begins_with(#SK, :SK)",
        ExpressionAttributeNames: {
          "#PK": "PK",
          "#SK": "SK",
        },
      });
    });

    test("should execute query with BETWEEN operator", async () => {
      const mockQueryResponse = {
        Items: [expectedUser],
        $metadata: { httpStatusCode: 200 },
      };
      ddbMock.on(QueryCommand).resolves(mockQueryResponse);

      const result = await dynamoDbOperations.query({
        partitionKeyCondition: {
          attributeName: "PK",
          operator: QueryConditionOperator.EQUALS,
          attributeValue: "USER#12345",
        },
        sortKeyCondition: {
          attributeName: "SK",
          operator: QueryConditionOperator.BETWEEN,
          attributeValue: "START",
          attributeValue2: "END",
        },
      });

      expect(result.items).toHaveLength(1);
      const queryCall = ddbMock.calls()[0];
      expect(queryCall.args[0].input).toMatchObject({
        KeyConditionExpression: "#PK = :PK AND #SK BETWEEN :SK AND :SK2",
      });
    });

    test("should throw error when BETWEEN operator missing second value", async () => {
      await expect(
        dynamoDbOperations.query({
          partitionKeyCondition: {
            attributeName: "PK",
            operator: QueryConditionOperator.EQUALS,
            attributeValue: "USER#12345",
          },
          sortKeyCondition: {
            attributeName: "SK",
            operator: QueryConditionOperator.BETWEEN,
            attributeValue: "START",
            attributeValue2: "",
          },
        })
      ).rejects.toThrow(
        "Failed to query items from DynamoDB: BETWEEN operator requires a non-empty second value"
      );
    });

    test("should handle query with all options", async () => {
      const mockQueryResponse = {
        Items: [expectedUser],
        LastEvaluatedKey: { PK: "lastKey" },
        $metadata: { httpStatusCode: 200 },
      };
      ddbMock.on(QueryCommand).resolves(mockQueryResponse);

      const result = await dynamoDbOperations.query({
        partitionKeyCondition: {
          attributeName: "PK",
          operator: QueryConditionOperator.EQUALS,
          attributeValue: "USER#12345",
        },
        options: {
          indexName: "GSI1",
          limit: 10,
          scanIndexForward: false,
          exclusiveStartKey: { PK: "startKey" },
          filterExpression: "#status = :status",
          filterExpressionValues: { ":status": "ACTIVE" },
        },
      });

      expect(result.items).toHaveLength(1);
      expect(result.lastEvaluatedKey).toEqual({ PK: "lastKey" });

      const queryCall = ddbMock.calls()[0];
      expect(queryCall.args[0].input).toMatchObject({
        IndexName: "GSI1",
        Limit: 10,
        ScanIndexForward: false,
        ExclusiveStartKey: { PK: "startKey" },
        FilterExpression: "#status = :status",
      });
    });

    test("should handle query error", async () => {
      ddbMock.on(QueryCommand).rejects(new Error("Query failed"));

      await expect(
        dynamoDbOperations.query({
          partitionKeyCondition: {
            attributeName: "PK",
            operator: QueryConditionOperator.EQUALS,
            attributeValue: "USER#12345",
          },
        })
      ).rejects.toThrow("Failed to query items from DynamoDB: Query failed");
    });
  });

  describe("utility method tests", () => {
    test("should handle empty options in applyQueryOptions", async () => {
      const mockQueryResponse = {
        Items: [expectedUser],
        $metadata: { httpStatusCode: 200 },
      };
      ddbMock.on(QueryCommand).resolves(mockQueryResponse);

      await dynamoDbOperations.query({
        partitionKeyCondition: {
          attributeName: "PK",
          operator: QueryConditionOperator.EQUALS,
          attributeValue: "USER#12345",
        },
        options: {},
      });

      const queryCall = ddbMock.calls()[0];
      const input = queryCall.args[0].input as QueryCommand;

      const expectedKeys = [
        "TableName",
        "KeyConditionExpression",
        "ExpressionAttributeValues",
        "ExpressionAttributeNames",
      ];
      const actualKeys = Object.keys(input);

      expect(actualKeys.sort()).toEqual(expectedKeys.sort());
    });

    test("should handle partial options", async () => {
      const mockQueryResponse = {
        Items: [expectedUser],
        $metadata: { httpStatusCode: 200 },
      };
      ddbMock.on(QueryCommand).resolves(mockQueryResponse);

      await dynamoDbOperations.query({
        partitionKeyCondition: {
          attributeName: "PK",
          operator: QueryConditionOperator.EQUALS,
          attributeValue: "USER#12345",
        },
        options: {
          limit: 10,
          scanIndexForward: true,
        },
      });

      const queryCall = ddbMock.calls()[0];
      const input = queryCall.args[0].input as QueryCommand;

      expect(input).toMatchObject({
        TableName: "TestTable",
        KeyConditionExpression: "#PK = :PK",
        Limit: 10,
        ScanIndexForward: true,
      });
    });
  });
});
