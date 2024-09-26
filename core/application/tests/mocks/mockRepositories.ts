import Repository from '@application/technicalImpl/policies/repositories/Repository'
import { UserDTO } from '@commons/dto/UserDTO'

export const mockRepository: jest.Mocked<Repository<UserDTO>> = {
  create: jest.fn()
}
