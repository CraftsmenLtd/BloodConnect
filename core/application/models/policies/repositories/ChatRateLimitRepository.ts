// Atomic per-channel send rate limiter backed by a short-TTL DynamoDB counter item.
// tryConsume increments the current window's counter under a conditional check and returns false
// (without incrementing further) once the limit for the window is reached.
type ChatRateLimitRepository = {
  tryConsume(channelId: string, limit: number, windowSeconds: number): Promise<boolean>;
}
export default ChatRateLimitRepository
