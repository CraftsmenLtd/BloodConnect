import { DTO, HasIdentifier } from './DTOCommon'

export type UserDTO = DTO & HasIdentifier & {
  email: string;
  name: string;
  phone: string;
  registrationDate: Date;
}
