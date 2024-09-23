import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { Theme } from '../../setup/theme'

interface LinkWithTextProps {
  staticText?: string;
  linkText: string;
  onPress: () => void;
}

const LinkWithText: React.FC<LinkWithTextProps> = ({ staticText, linkText, onPress }) => {
  const styles = createStyles(useTheme())

  return (
    <View style={styles.container}>
      <Text>{staticText}</Text>
      <TouchableOpacity onPress={onPress}>
        <Text style={styles.linkText}>{linkText}</Text>
      </TouchableOpacity>
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: 'bold'
  }
})

export default LinkWithText
