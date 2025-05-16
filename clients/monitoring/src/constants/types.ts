type DynamoDBString = { S: string };
type DynamoDBNumber = { N: string };

export type BloodRequestDynamoDBUnmarshaledItem = {
  PK: DynamoDBString;
  SK: DynamoDBString;
  bloodQuantity: DynamoDBNumber;
  contactNumber: DynamoDBString;
  countryCode: DynamoDBString;
  createdAt: DynamoDBString;
  donationDateTime: DynamoDBString;
  geohash: DynamoDBString;
  GSI1PK: DynamoDBString;
  GSI1SK: DynamoDBString;
  latitude: DynamoDBNumber;
  location: DynamoDBString;
  longitude: DynamoDBNumber;
  LSI1SK: DynamoDBString;
  patientName: DynamoDBString;
  requestedBloodGroup: DynamoDBString;
  seekerName: DynamoDBString;
  shortDescription: DynamoDBString;
  status: DynamoDBString;
  transportationInfo: DynamoDBString;
  urgencyLevel: DynamoDBString;
};
