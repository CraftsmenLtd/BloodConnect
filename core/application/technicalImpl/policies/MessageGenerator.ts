import { GenericMessage } from '@commons/dto/MessageDTO'

export default interface MessageHandler<T extends GenericMessage = GenericMessage> {
  getMessage(): T;
}
