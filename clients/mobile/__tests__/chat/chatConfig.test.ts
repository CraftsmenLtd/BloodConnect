// Mutable expo-constants mock so each test sets CHAT_ENABLED before the module under test reads it.
const mockExtra: { CHAT_ENABLED?: string } = {}
jest.mock('expo-constants', () => ({ __esModule: true, default: { get expoConfig() { return { extra: mockExtra } } } }))

// isChatEnabled is the single gate for both chat routes (routes.ts) and the entry-point buttons
// (DonorResponses/PostCard), so exercising it here covers the flag-off hides / flag-on shows behaviour
// without importing the full screen graph that routes.ts pulls in.
describe('isChatEnabled', () => {
  afterEach(() => { delete mockExtra.CHAT_ENABLED; jest.resetModules() })

  it('is true only when CHAT_ENABLED is the string "true"', () => {
    jest.isolateModules(() => {
      mockExtra.CHAT_ENABLED = 'true'

      expect(require('../../src/chat/chatConfig').isChatEnabled()).toBe(true)
    })
  })

  it('is false when CHAT_ENABLED is unset', () => {
    jest.isolateModules(() => {

      expect(require('../../src/chat/chatConfig').isChatEnabled()).toBe(false)
    })
  })

  it('is false for any value other than "true"', () => {
    jest.isolateModules(() => {
      mockExtra.CHAT_ENABLED = 'false'

      expect(require('../../src/chat/chatConfig').isChatEnabled()).toBe(false)
    })
  })
})
