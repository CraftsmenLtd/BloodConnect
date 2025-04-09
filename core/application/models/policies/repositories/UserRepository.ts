import type { DTO } from '../../../../../commons/dto/DTOCommon'

export type UserProfileDTO = {
  userId: string;
  deviceToken?: string;
} & DTO

export type UserRepository = {
  getUserProfile(userId: string): Promise<UserProfileDTO | null>;
}
