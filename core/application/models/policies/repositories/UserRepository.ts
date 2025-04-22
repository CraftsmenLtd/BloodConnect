import type { UserDetailsDTO } from 'commons/dto/UserDTO';
import type Repository from './Repository';

type UserRepository = {
  getUser(userId: string): Promise<UserDetailsDTO | null>;
} & Repository<UserDetailsDTO, Record<string, unknown>>
export default UserRepository
