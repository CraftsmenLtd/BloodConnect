import React from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'

interface WarningProps {
  text: string;
  showWarning: boolean;
}

const Warning: React.FC<WarningProps> = ({ text, showWarning }) => {
  const styles = createStyles(useTheme())
  return (
    <>
      {showWarning && text.trim() !== '' && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Warning: {text}
          </Text>
        </View>
      )}
    </>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: theme.colors.goldenSun,
    borderRadius: 8,
    backgroundColor: theme.colors.peachCream,
    marginVertical: 10
  },
  warningIcon: {
    fontSize: theme.typography.fontSize,
    marginRight: 10,
    color: theme.colors.darkAmber
  },
  warningText: {
    flex: 1,
    fontSize: theme.typography.errorFontSize,
    color: theme.colors.darkAmber,
    lineHeight: 18
  }
})

export default Warning
