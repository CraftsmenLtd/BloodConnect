export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export type OutgoingChatMessage = {
  channelId: string;
  messageId: string;
  text: string;
  createdAt: string;
}

export type WebSocketLike = {
  send: (data: string) => void;
  close: () => void;
  readyState: number;
  onopen: ((event: unknown) => void) | null;
  onclose: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
}

export type SocketFactory = (url: string, token?: string) => WebSocketLike
