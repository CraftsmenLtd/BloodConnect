import { DynamoDBUserRepositoryAdapter } from '../adapter/userServiceAdapter/DynamoDBUserRepositoryAdapter'
import { UserRepository } from '../adapter/userServiceAdapter/UserRepository'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class RepositoryFactory {
  static getUserRepository(dbType = process.env.DB_TYPE): UserRepository {
    if (dbType === 'DynamoDB') {
      return new DynamoDBUserRepositoryAdapter()
    } else {
      throw new Error(`Unsupported DB_TYPE: ${dbType}`)
    }
  }
}
