import React from 'react'
import type { StyleProp, TextStyle } from 'react-native';
import { Text, StyleSheet, Linking } from 'react-native'
import type { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'

type LinkTextProps = {
  url: string;
  text: string;
  style?: StyleProp<TextStyle>;
  onError?: (message: string) => void;
}

export const LinkText: React.FC<LinkTextProps> = ({
  url,
  text,
  style,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onError = () => { }
}) => {
  const theme = useTheme()
  const styles = createStyles(theme)

  const handlePress = React.useCallback(() => {
    void (async () => {
      try {
        const supported = await Linking.canOpenURL(url)
        if (supported) {
          await Linking.openURL(url)
        } else {
          onError(`Cannot open URL: ${url}`)
        }
      } catch (error) {
        onError(`Failed to open URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    })()
  }, [url, onError])

  return (
    <Text onPress={handlePress} style={[styles.link, style]}>
      {text}
    </Text>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  link: {
    color: theme.colors.primary,
    textDecorationLine: 'underline'
  }
})

export default LinkText
