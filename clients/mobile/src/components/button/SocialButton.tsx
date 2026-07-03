import React from 'react'
import type { ImageSourcePropType, StyleProp, ViewStyle, TextStyle } from 'react-native'
import { TouchableOpacity, StyleSheet, Image, View, ActivityIndicator } from 'react-native'
import { Text } from '../text/AppText'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import { spacing, radius } from '../../setup/theme/tokens'

type SocialButtonProps = {
  text: string;
  onPress: () => void;
  icon: ImageSourcePropType;
  loading?: boolean;
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const SocialButton = ({ text, onPress, icon, loading, buttonStyle, textStyle }: SocialButtonProps) => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const isLoading = loading ?? false

  return (
    <TouchableOpacity style={[styles.socialButton, buttonStyle]} onPress={onPress} disabled={loading}>
      <View style={styles.socialButtonContent}>
        <Image source={icon} style={styles.socialIcon} />
        {isLoading
          ? (<ActivityIndicator size="small" color={theme.colors.primary}/>)
          : (<Text style={[styles.socialButtonText, textStyle]}>{text}</Text>)}
      </View>
    </TouchableOpacity>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  socialButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: spacing.md
  },
  socialButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '500'
  }
})
