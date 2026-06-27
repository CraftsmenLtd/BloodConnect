import type { ReactNode } from 'react'
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ChatChannelDTO, ChatMessageDTO } from '../../../../../commons/dto/ChatDTO'
import type { ConnectionStatus } from '../types'
import { mergeMessages } from '../hooks/useChatMessages'

export type ChatContextType = {
  channels: ChatChannelDTO[];
  messagesByChannel: Record<string, ChatMessageDTO[]>;
  unreadByChannel: Record<string, number>;
  connectionStatus: ConnectionStatus;
  setChannels: (channels: ChatChannelDTO[]) => void;
  upsertMessages: (channelId: string, messages: ChatMessageDTO[]) => void;
  setUnreadCount: (channelId: string, count: number) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
}

const defaultContextValue: ChatContextType = {
  channels: [],
  messagesByChannel: {},
  unreadByChannel: {},
  connectionStatus: 'disconnected',
  setChannels: () => undefined,
  upsertMessages: () => undefined,
  setUnreadCount: () => undefined,
  setConnectionStatus: () => undefined
}

export const ChatContext = createContext<ChatContextType>(defaultContextValue)

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [channels, setChannels] = useState<ChatChannelDTO[]>([])
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, ChatMessageDTO[]>>({})
  const [unreadByChannel, setUnreadByChannel] = useState<Record<string, number>>({})
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')

  const upsertMessages = useCallback((channelId: string, incoming: ChatMessageDTO[]): void => {
    setMessagesByChannel((current) => ({
      ...current,
      [channelId]: mergeMessages(current[channelId] ?? [], incoming)
    }))
  }, [])

  const setUnreadCount = useCallback((channelId: string, count: number): void => {
    setUnreadByChannel((current) => ({ ...current, [channelId]: count }))
  }, [])

  const value = useMemo<ChatContextType>(() => ({
    channels,
    messagesByChannel,
    unreadByChannel,
    connectionStatus,
    setChannels,
    upsertMessages,
    setUnreadCount,
    setConnectionStatus
  }), [channels, messagesByChannel, unreadByChannel, connectionStatus, upsertMessages, setUnreadCount])

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export const useChat = (): ChatContextType => useContext(ChatContext)
