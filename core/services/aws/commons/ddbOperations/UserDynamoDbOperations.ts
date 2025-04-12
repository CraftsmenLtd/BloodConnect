import DynamoDbTableOperations from './DynamoDbTableOperations'
import type { UserDetailsDTO } from 'commons/dto/UserDTO'
import type { UserFields } from '../ddbModels/UserModel'
import UserModel from '../ddbModels/UserModel'
import type UserRepository from '../../../../application/models/policies/repositories/UserRepository'

export default class UserDynamoDbOperations extends DynamoDbTableOperations<
  UserDetailsDTO,
  UserFields,
  UserModel
> implements UserRepository {
  constructor(tableName: string, region: string) {
    super(new UserModel(), tableName, region)
  }
}
