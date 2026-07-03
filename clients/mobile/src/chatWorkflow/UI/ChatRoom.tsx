import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useChatRoom } from '../hooks/useChatRoom'
import type { ChatApiClient } from '../chatApi'
import type { ChannelContext } from '../types'
import { MessageList } from './MessageList'
import { ChatRoomHeader } from './ChatRoomHeader'
import { MessageComposer } from './MessageComposer'
import { TypingIndicator } from './TypingIndicator'
import { LockedBanner } from './LockedBanner'

export type ChatRoomProps = {
  channelId: string;
  myUserId: string;
  token: string;
  websocketUrl: string;
  apiClient: ChatApiClient;
  context?: ChannelContext;
  isLocked?: boolean;
}

export const ChatRoom = (props: ChatRoomProps): React.ReactElement => {
  const { channelId, myUserId, token, websocketUrl, apiClient, context, isLocked } = props
  const { messages, isOtherTyping, send, loadOlder, sendTyping } = useChatRoom({
    channelId,
    myUserId,
    token,
    websocketUrl,
    apiClient
  })

  return (
    <View style={styles.container}>
      <ChatRoomHeader context={context} />
      <MessageList messages={messages} myUserId={myUserId} onEndReached={() => { void loadOlder() }} />
      <TypingIndicator visible={isOtherTyping} />
      {isLocked === true
        ? <LockedBanner />
        : <MessageComposer onSend={(body) => { void send(body) }} onTyping={sendTyping} />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 }
})
