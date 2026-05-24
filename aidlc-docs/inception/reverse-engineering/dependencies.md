# Dependencies

## Internal Dependencies

```
commons/dto
  ^--- core/application (uses DTOs for business logic)
  ^--- core/services/aws (uses DTOs for Lambda I/O)
  ^--- clients/mobile (uses DTOs for API contracts)
  ^--- clients/organization (uses DTOs)

commons/libs
  ^--- core/services/aws (uses logger, config, error handling)
  ^--- core/application (uses config)

core/application
  ^--- core/services/aws (delegates to service layer for business logic)

core/services/maps
  ^--- core/services/aws (geocoding for donation location)
```

## External Dependencies

### ngeohash
- **Purpose**: Geohash encoding/decoding and neighbor lookup for proximity search

### @aws-sdk/client-dynamodb + @aws-sdk/lib-dynamodb
- **Version**: v3
- **Purpose**: DynamoDB CRUD operations in Lambda handlers

### @aws-sdk/client-sns
- **Purpose**: Send push notifications via SNS + Firebase FCM

### @aws-sdk/client-ses
- **Purpose**: Send email notifications

### @aws-sdk/client-scheduler
- **Purpose**: Create EventBridge Scheduler targets for donor search loop

### date-fns
- **Purpose**: Date manipulation and formatting in business logic

### axios
- **Purpose**: HTTP client in mobile app for API calls

### React Navigation
- **Purpose**: Navigation framework for mobile app

### Expo SDK
- **Purpose**: React Native cross-platform framework and services

### redux + react-redux
- **Purpose**: State management in web clients

### tailwindcss
- **Purpose**: Utility-first CSS in web clients

### aws-amplify + @aws-amplify/ui-react
- **Purpose**: AWS auth UI components in monitoring dashboard

### jest + ts-jest
- **Version**: Jest 29
- **Purpose**: Unit testing framework for all TypeScript packages

### aws-sdk-client-mock
- **Purpose**: Mock AWS SDK v3 calls in Jest unit tests
