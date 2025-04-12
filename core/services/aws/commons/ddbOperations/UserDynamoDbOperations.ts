import DynamoDbTableOperations from './DynamoDbTableOperations'
import type { UserDetailsDTO } from 'commons/dto/UserDTO'
import type { UserFields } from 'core/services/aws/commons/ddbModels/UserModel'
import UserModel from 'core/services/aws/commons/ddbModels/UserModel'

export default class UserDynamoDbOperations extends DynamoDbTableOperations<
  UserDetailsDTO,
  UserFields,
  UserModel
  > {
    constructor(tableName: string, region: string) {
      super(new UserModel(), tableName, region)
  }
}
