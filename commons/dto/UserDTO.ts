import { DTO, HasIdentifier } from './DtoCommon'

export type UserDTO = DTO & HasIdentifier & {
  email: string;
  name: string;
  phone: string;
  registrationDate: Date;
}
