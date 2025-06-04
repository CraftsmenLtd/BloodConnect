import React from 'react'
import type { ViewStyle, TextStyle, StyleProp } from 'react-native'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { FontAwesome6 } from '@expo/vector-icons'

/**
 * Badge Props
 * @property {string | number} text - Text or number to display in the badge.
 * @property {StyleProp<ViewStyle>} containerStyle - Custom styles for the badge container.
 * @property {StyleProp<TextStyle>} textStyle - Custom styles for the badge text.
 * @property {string} iconName - Give icon name - support @expo/vector-icons/fontawesome6 names.
 */
type BadgeProps = {
  text: string | number;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  iconName?: string;
}

/**
 * Badge Component
 * Displays a circular badge with fully customizable styles.
 *
 * @param {BadgeProps} props - Properties for the Badge component.
 *
 * @example
 * // Dynamic styles and text
 * const status = "ACCEPTED"
 * const dynamicStyles = {
 *   ACCEPTED: {
 *     container: { backgroundColor: '#00FF00' },
 *     text: { color: '#FFFFFF' },
 *   },
 *   IGNORE: {
 *     container: { backgroundColor: '#FF9999' },
 *     text: { color: '#FFFFFF' },
 *   },
 * };
 *
 * <Badge
 *   text=status
 *   containerStyle={dynamicStyles[status].container}
 *   textStyle={dynamicStyles[status].text}
 *   iconName="checkmark-circle-outline"
 * />
 */
const Badge: React.FC<BadgeProps> = ({
  text,
  containerStyle = {},
  textStyle = {},
  iconName
}: BadgeProps) => {
  const theme = useTheme()
  const styles = createStyles()

  return (
    <View
      style={[
        styles.badge,
        containerStyle
      ]}
    >
      { (iconName !== undefined) && (
        <FontAwesome6
          name={iconName}
          size={16}
          color={theme.colors.black}
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, textStyle]} numberOfLines={1} ellipsizeMode='tail'>{text}</Text>
    </View>
  )
}

const createStyles = (): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 120,
    overflow: 'hidden',
  },
  icon: {
    marginRight: 4
  }
})

export default Badge
