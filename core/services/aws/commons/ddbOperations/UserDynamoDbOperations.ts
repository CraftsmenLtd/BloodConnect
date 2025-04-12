import DynamoDbTableOperations from './DynamoDbTableOperations'
import type { UserDetailsDTO } from 'commons/dto/UserDTO'
import type { UserFields } from '../ddbModels/UserModel'
import UserModel from '../ddbModels/UserModel'

export default class UserDynamoDbOperations extends DynamoDbTableOperations<
  UserDetailsDTO,
  UserFields,
  UserModel
  > {
    constructor(tableName: string, region: string) {
      super(new UserModel(), tableName, region)
  }
}
