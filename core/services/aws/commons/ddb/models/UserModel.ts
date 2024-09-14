import { HasDateTimeLog } from '@commons/dto/DtoCommon'
import { UserDTO } from '@commons/dto/UserDTO'
import DbModelDtoConverter from './DbModelDtoConverter'

type UserFields = Omit<UserDTO, 'id' | 'registrationDate'> & HasDateTimeLog & {
  pk: `USER#${string}`;
  sk: 'PROFILE';
  createdAt: Date;
}

export default class UserDdbModel implements DbModelDtoConverter<UserDTO, UserFields> {
  fromDto(userDto: UserDTO): UserFields {
    const { id, registrationDate, ...remainingUser } = userDto
    return {
      pk: `USER#${typeof id === 'string' ? id : id.toString()}`,
      sk: 'PROFILE',
      ...remainingUser,
      createdAt: registrationDate
    }
  }

  toDto(dbFields: UserFields): UserDTO {
    const { pk, sk, createdAt, ...remainingUserFields } = dbFields
    return { ...remainingUserFields, id: pk.replace('USER#', ''), registrationDate: createdAt }
  }
}
