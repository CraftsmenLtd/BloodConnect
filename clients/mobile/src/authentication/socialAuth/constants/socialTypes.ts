export const SOCIAL_TYPES = {
  GOOGLE: 'google',
  FACEBOOK: 'facebook'
} as const

export type SocialType = typeof SOCIAL_TYPES[keyof typeof SOCIAL_TYPES]
