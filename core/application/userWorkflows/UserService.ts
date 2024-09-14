import { GenericCodes } from '@commons/libs/constants/GenericCodes'
import UserRepository from '../technicalImpl/policies/repositories/UserRepository'
import UserOperationError from './UserOperationError'
import { UserDTO } from '@commons/dto/UserDTO'
import { generateUniqueID } from '../utils/ksuidGenerator'
import EmailVerificationMessage from '@application/userWorkflows/messages/EmailVerification'
import ForgotPassword from '@application/userWorkflows/messages/ForgotPassword'
import { GenericMessage } from '@commons/dto/MessageDTO'

type UserAttributes = {
  email: string;
  name: string;
  phone_number: string;
}

export class UserService {
  async createNewUser(userAttributes: UserAttributes, userRepository: UserRepository): Promise<UserDTO> {
    try {
      return userRepository.create({
        id: generateUniqueID(),
        email: userAttributes.email,
        name: userAttributes.name,
        phone: userAttributes.phone_number,
        registrationDate: new Date()
      })
    } catch (error) {
      throw new UserOperationError(`Failed to create new user. Error: ${error}`, GenericCodes.error)
    }
  }

  getPostSignUpMessage(userName: string, securityCode: string): GenericMessage {
    return new EmailVerificationMessage(userName, securityCode).getMessage()
  }

  getForgotPasswordMessage(userName: string, securityCode: string): GenericMessage {
    return new ForgotPassword(userName, securityCode).getMessage()
  }
}
