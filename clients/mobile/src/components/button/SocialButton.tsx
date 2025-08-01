import React from 'react'
import type { ImageSourcePropType, StyleProp, ViewStyle, TextStyle } from 'react-native'
import { TouchableOpacity, Text, StyleSheet, Image, View, ActivityIndicator } from 'react-native'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'

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
    backgroundColor: 'white',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: theme.colors.extraLightGray,
    paddingVertical: 12,
    marginBottom: 10,
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
    marginRight: 10
  },
  socialButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '500'
  }
})
