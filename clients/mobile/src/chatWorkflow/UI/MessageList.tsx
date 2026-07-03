import React from 'react'
import { FlatList } from 'react-native'
import type { ChatMessageView } from '../types'
import { MessageBubble } from './MessageBubble'

export const MessageList = (
  { messages, myUserId, onEndReached }:
  { messages: ChatMessageView[]; myUserId: string; onEndReached?: () => void }
): React.ReactElement => (
  <FlatList
    testID="chat-room-message-list"
    data={messages}
    keyExtractor={(item) => item.messageId ?? item.clientMessageId}
    renderItem={({ item }) => <MessageBubble message={item} isMine={item.senderId === myUserId} />}
    onEndReached={onEndReached}
    onEndReachedThreshold={0.2}
  />
)
