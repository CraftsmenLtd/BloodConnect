export const mockServiceLogger = expect.objectContaining({
  error: expect.any(Function),
  info: expect.any(Function),
  warn: expect.any(Function),
  debug: expect.any(Function)
})