import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '../text/AppText'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import { radius } from '../../setup/theme/tokens'

type InitialsAvatarProps = {
  name: string;
  size?: number;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter((part) => part !== '')
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()

  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
}

const hashString = (value: string): number => {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = value.charCodeAt(index) + ((hash << 5) - hash)
  }

  return Math.abs(hash)
}

const InitialsAvatar: React.FC<InitialsAvatarProps> = ({ name, size = 56 }) => {
  const theme = useTheme()
  const styles = createStyles(theme)
  // Palette limited to colors with adequate contrast against white text.
  const palette = [
    theme.colors.primary,
    theme.colors.secondary,
    theme.colors.darkAmber,
    theme.colors.focus,
    theme.colors.bloodRed
  ]
  const backgroundColor = palette[hashString(name) % palette.length]

  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor }]}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{getInitials(name)}</Text>
    </View>
  )
}

export default InitialsAvatar

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center'
  },
  initials: {
    color: theme.colors.onPrimary,
    fontWeight: 'bold'
  }
})
