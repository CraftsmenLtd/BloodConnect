import { RepositoryFactory } from '@application/technical/factories/RepositoryFactory'
import { UserRepository } from '@application/technical/adapter/userServiceAdapter/UserRepository'

export interface UserAttributes {
  email: string;
  name: string;
  phone_number: string;
}

export class UserService {
  constructor(private readonly repository: UserRepository = RepositoryFactory.getUserRepository()) {}

  async createNewUser(userAttributes: UserAttributes): Promise<void> {
    try {
      await this.repository.createUserItem({
        email: userAttributes.email,
        name: userAttributes.name,
        phone: userAttributes.phone_number,
        registrationDate: new Date().toISOString()
      })
    } catch (error) {
      throw new Error('Failed to create new user')
    }
  }
}
