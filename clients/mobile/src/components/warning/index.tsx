import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '../text/AppText'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import { spacing, radius } from '../../setup/theme/tokens'

type WarningProps = {
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
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.goldenSun,
    borderRadius: radius.md,
    backgroundColor: theme.colors.peachCream,
    marginVertical: spacing.md
  },
  warningIcon: {
    fontSize: theme.typography.fontSize,
    marginRight: spacing.md,
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
