import React from 'react'
import { TouchableOpacity, Text, StyleSheet, Image, View, ImageSourcePropType, StyleProp, ViewStyle, TextStyle } from 'react-native'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { Theme } from '../../setup/theme'

interface SocialButtonProps {
  text: string;
  onPress: () => void;
  icon: ImageSourcePropType;
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const SocialButton = ({ text, onPress, icon, buttonStyle, textStyle }: SocialButtonProps) => {
  const styles = createStyles(useTheme())

  return (
    <TouchableOpacity style={[styles.socialButton, buttonStyle]} onPress={onPress}>
      <View style={styles.socialButtonContent}>
        <Image source={icon} style={styles.socialIcon} />
        <Text style={[styles.socialButtonText, textStyle]}>{text}</Text>
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
    justifyContent: 'center'
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
