import { UserDTO } from '@application/userWorkflows/UserDTO'

export interface UserRepository {
  createUserItem(params: UserDTO): Promise<Partial<UserDTO>>;
}
