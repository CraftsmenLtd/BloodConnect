import { UserDTO } from '@commons/dto/UserDTO'
import Repository from './Repository'

export default interface UserRepository extends Repository<UserDTO> {
  create(user: UserDTO): Promise<UserDTO>;
}
