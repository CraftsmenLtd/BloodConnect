export type DynamoDBString = { S: string };
export type DynamoDBNumber = { N: string };

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

export type NotificationDynamoDBUnmarshaledItem = {
  payload: {
    M: {
      patientName: DynamoDBString;
      seekerName: DynamoDBString;
      requestedBloodGroup: DynamoDBString;
      distance: DynamoDBNumber;
      requestPostId: DynamoDBString;
      seekerId: DynamoDBString;
      shortDescription: DynamoDBString;
      urgencyLevel: DynamoDBString;
      createdAt: DynamoDBString;
      locationId: DynamoDBString;
      contactNumber: DynamoDBString;
      location: DynamoDBString;
      bloodQuantity: DynamoDBNumber;
      donationDateTime: DynamoDBString;
      transportationInfo: DynamoDBString;
    };
  };
  GSI1PK: DynamoDBString;
  LSI1SK: DynamoDBString;
  status: DynamoDBString;
  createdAt: DynamoDBString;
  SK: DynamoDBString;
  PK: DynamoDBString;
  GSI1SK: DynamoDBString;
  title: DynamoDBString;
  body: DynamoDBString;
};

export type UserLocationDynamoDBUnmarshaledItem = {
  PK: DynamoDBString;
  SK: DynamoDBString;
  area: DynamoDBString;
  createdAt: DynamoDBString;
  GSI1PK: DynamoDBString;
  GSI1SK: DynamoDBString;
  lastVaccinatedDate: DynamoDBString;
  latitude: DynamoDBNumber;
  longitude: DynamoDBNumber;
};

export type CompleteRequest = (BloodRequestDynamoDBUnmarshaledItem &
  { notifiedDonors?: (NotificationDynamoDBUnmarshaledItem
    & {location: UserLocationDynamoDBUnmarshaledItem})[];
  })
