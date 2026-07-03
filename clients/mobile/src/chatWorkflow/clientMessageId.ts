const RADIX = 36
const RANDOM_SLICE_START = 2
const RANDOM_SLICE_END = 10

export const generateClientMessageId = (): string =>
  `${Date.now().toString(RADIX)}-${Math.random().toString(RADIX).slice(RANDOM_SLICE_START, RANDOM_SLICE_END)}`
