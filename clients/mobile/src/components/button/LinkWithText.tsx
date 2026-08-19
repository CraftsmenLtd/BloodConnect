import React from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Text } from '../text/AppText'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import { spacing } from '../../setup/theme/tokens'

type LinkWithTextProps = {
  staticText?: string;
  linkText: string;
  onPress: () => void;
  isDisabled?: boolean;
  countdown?: number | null;
}

const LinkWithText: React.FC<LinkWithTextProps> = ({ staticText, linkText, onPress, isDisabled = false, countdown }) => {
  const styles = createStyles(useTheme())

  return (
    <View style={styles.container}>
      <Text>{staticText}</Text>
      <TouchableOpacity onPress={onPress} disabled={isDisabled}>
        <Text style={[styles.linkText, isDisabled && styles.disabledLinkText]}>
          {isDisabled && countdown !== null ? (
            `Resend OTP in ${Math.floor(countdown / 60)}:${('0' + (countdown % 60)).slice(-2)}`
          ) : linkText}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: spacing.xl
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: 'bold'
  },
  disabledLinkText: {
    color: theme.colors.textPrimary
  }
})

export default LinkWithText
