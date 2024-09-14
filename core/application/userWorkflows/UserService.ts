import { GenericCodes } from '@commons/libs/constants/GenericCodes'
import UserRepository from '../policies/repositories/UserRepository'
import UserOperationError from './UserOperationError'
import { UserDTO } from '@commons/dto/UserDTO'
import { generateUniqueID } from '../utils/ksuidGenerator'

type UserAttributes = {
  email: string;
  name: string;
  phone_number: string;
}

type UserNotificationMessage = { title: string; message: string }

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

  getPostSignUpMessage(userName: string, securityCode: string): UserNotificationMessage {
    return {
      title: 'Welcome to Blood Connect!',
      message: `Hello ${userName},<br/><br/>
                Welcome! Please verify your email using the following code: ${securityCode}.<br/><br/>
                Thanks!`
    }
  }

  getForgotPasswordMessage(userName: string, securityCode: string): UserNotificationMessage {
    return {
      title: 'Reset your password for Blood Connect',
      message: `Hello ${userName},<br/><br/>
                You have requested to reset your password.<br/>
                Use the following code to reset your password: ${securityCode}<br/><br/>
                If you did not request this, please ignore this email.<br/><br/>
                Thanks!`
    }
  }
}
