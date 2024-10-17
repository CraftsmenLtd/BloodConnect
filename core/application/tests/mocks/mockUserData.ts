import { UserDTO } from '../../../../commons/dto/UserDTO'
import { UserFields } from '../../technicalImpl/dbModels/UserModel'

export const mockUserWithStringId: UserDTO = {
  id: '12345',
  email: 'ebrahim@example.com',
  name: 'Ebrahim',
  phone: '1234567890',
  registrationDate: new Date('2023-09-16T12:00:00Z')
}

export const mockUserWithNumberId: UserDTO = {
  ...mockUserWithStringId,
  id: 12345
}

export const expectedUser: UserFields = {
  PK: 'USER#12345',
  SK: 'PROFILE',
  email: 'ebrahim@example.com',
  name: 'Ebrahim',
  phone: '1234567890',
  createdAt: '2023-09-16T12:00:00.000Z'
}
