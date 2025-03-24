import type { DTO } from '../../../../../commons/dto/DTOCommon'

export interface UserProfileDTO extends DTO {
  userId: string;
  deviceToken?: string;
}

export interface UserRepository {
  getUserProfile(userId: string): Promise<UserProfileDTO | null>;
}
