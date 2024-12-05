import React from 'react'
import { Text, TouchableOpacity, StyleSheet, StyleProp, TextStyle, Linking } from 'react-native'
import { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'

interface LinkTextProps {
  url: string;
  text: string;
  style?: StyleProp<TextStyle>;
  onError?: (message: string) => void;
}

// export const LinkText: React.FC<LinkTextProps> = ({ url, text, style }) => {
//   const theme = useTheme()
//   const styles = createStyles(theme)

//   const handlePress = async(): Promise<void> => {
//     try {
//       const supported = await Linking.canOpenURL(url)
//       if (supported) {
//         await Linking.openURL(url)
//       } else {
//         console.error('Cannot open URL:', url)
//       }
//     } catch (error) {
//       console.error('Error opening URL:', error)
//     }
//   }

//   return (
//     <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
//       <Text style={[styles.link, style]}>{text}</Text>
//     </TouchableOpacity>
//   )
// }

export const LinkText: React.FC<LinkTextProps> = ({
  url,
  text,
  style,
  onError = () => {}
}) => {
  const theme = useTheme()
  const styles = createStyles(theme)

  const handlePress = React.useCallback(() => {
    void (async() => {
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
    // <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
    //   <Text style={[styles.link, style]}>{text}</Text>
    // </TouchableOpacity>
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
