import React from 'react'
import { useTranslation } from 'react-i18next'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { LanguageSwitcher } from '../../components/languageSwitcher'
import { languageOptions } from '../../setup/constant/language'
import type { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { openSafetyReport } from '../../utility/safetyReport'

const SettingsPage: React.FC = (): React.ReactElement => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <LanguageSwitcher
        label={t('fromLabel.chooseLanguage')}
        placeholder={t('placeholders.selectAppLanguage')}
        languages={languageOptions}
        size="auto"
      />

      <TouchableOpacity
        style={styles.reportRow}
        onPress={() => { void openSafetyReport() }}
        accessibilityLabel={t('settings.reportSafety')}
        accessibilityHint="Opens mail app to report a safety concern"
      >
        <MaterialIcons name="flag" size={24} style={styles.reportIcon} />
        <Text style={styles.reportText}>{t('settings.reportSafety')}</Text>
        <MaterialIcons name="open-in-new" size={20} style={styles.reportChevron} />
      </TouchableOpacity>
    </View>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: theme.colors.white,
    },
    reportRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 24,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.extraLightGray,
    },
    reportIcon: {
      color: theme.colors.primary,
      marginRight: 12,
    },
    reportText: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.textPrimary,
    },
    reportChevron: {
      color: theme.colors.grey,
    },
  })

export default SettingsPage
